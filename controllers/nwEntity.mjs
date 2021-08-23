import { Networking } from "./Networking.mjs";
import { Map } from "../map.mjs";
import { Player } from "../player.mjs";
import { MouseAim } from "./mouseaim.mjs";
import { ECS } from "../ecs.js";
import { Systems } from "../ecs/systems.mjs";
import { Audio } from "./audio.mjs";

class InputBuffer {
    constructor(msgObj){
        this.serverFrame = 0;
        this.inputDelay = 6;
        this.controlBuffer = [];
        this.controlBufferSize = 100;
        this.players = [];
        this.blankControls =  JSON.parse(JSON.stringify(Fes.engine.blankControls));
        this.blankControls.isPredicted = true;
        //clone the control buffer for each player, and assign 
        for(let i=0;i<this.controlBufferSize;i+=1){
            let bufferObj = {};
            for(const client of msgObj.clients){
                bufferObj[client.instance] = JSON.parse(JSON.stringify(this.blankControls));
            }
            //one more for the host (not included in the client list)
            bufferObj[msgObj.hostId] = JSON.parse(JSON.stringify(this.blankControls));
            this.controlBuffer.push(bufferObj);
        }
        //init vars for local use
        for(const client of msgObj.clients){
            this.players.push({ id:client.instance });
        }
        this.players.push({ id:msgObj.hostId });
    }
    getIdxForFrame(requestedFrame){
        let self = Fes.data.networking.inputBuffer;
        let serverIdx = self.serverFrame;
        let idx = requestedFrame - serverIdx;
        if(idx<0){
            console.log("requesting input that's too far behind!");
            idx = 0;
        }
        if(idx>=self.controlBuffer.length){
            console.log("requesting input that's too far ahead!"+idx);
            idx = self.controlBuffer.length-1;
        }
        return idx;
    }
    getControls(entityId){
        let self = Fes.data.networking.inputBuffer;
        let idx = self.getIdxForFrame(Fes.engine.frameCount);
        let controls = self.controlBuffer[idx][entityId];
        controls.isRead = true;
        return controls;
    }
    setControls(frame,inputs,entityId){
        let self = Fes.data.networking.inputBuffer;
        let idx = self.getIdxForFrame(frame);
        self.controlBuffer[idx][entityId] = inputs;
    }
    updatePredicitons(){
        let self = Fes.data.networking.inputBuffer;
        let lastInput = {};
        for(const player of self.players){
            lastInput[player.id] = self.controlBuffer[0][player.id];
        }
        //no need to iterte though the entire buffer, can abort early?
        let maxFrame = this.getIdxForFrame(Fes.engine.frameCount+self.inputDelay);
        if(maxFrame>=self.controlBuffer.length){
            console.log("trying to update until the end of the buffer!");
            maxFrame=self.controlBuffer.length;
        }
        for(let i=1;i<maxFrame;i+=1){
            for(const player of self.players){
                let ipt = self.controlBuffer[i][player.id];
                if(!ipt.isPredicted){
                    //it's good update the last known value
                    lastInput[player.id] = ipt;
                }else{
                    //it's a predicted value, replace with last known value
                    let newPrediction = JSON.parse(JSON.stringify(lastInput[player.id]));
                    newPrediction.isPredicted = true;
                    self.controlBuffer[i][player.id] = newPrediction;
                }
            }
        }
    }
    updateServerFrame(sFrame){
        let self = Fes.data.networking.inputBuffer;
        let inputDiff = sFrame - self.serverFrame;
        if(inputDiff<0){
            console.log("updating to old frame!");
            return;
        }
        //remove old inputs from the start of the array
        let spliced = self.controlBuffer.splice(0,inputDiff);
        //add new inputs to the end of the array
        for(let i=0;i<spliced.length;i+=1){
            let bufferObj = {};
            for(const player of self.players){
                bufferObj[player.id] = JSON.parse(JSON.stringify(self.blankControls));
            }
            self.controlBuffer.push(bufferObj);
            if(!spliced[i][0].isRead){
                console.log("not read");
            }
        }
        //update to the new frame
        self.serverFrame = sFrame;
    }
}


class NetworkEntity extends Networking {
	constructor(){
        super();
	}
    //-- below is code specific to the engine, not to the network object
    setUp(){
        //clear out local control sources:
        Fes.data.ecs.removeComponent(Fes.data.player, "controlSourceLocal");
        this.MESSAGE_KINDS = {
            INIT:"init",        //sent by host on init
            INPUT:"inputs",     //sent by clients to server, contains the client's inputs
            SYNC:"sync",        //sent by server to clients, contains the server's wold state
            GET_DATA:"GET_DATA" //sent by the host before init, client returns whatever config values are related to their local player 
        };
        this.tickRate = 5;  //how many server ticks should fire to each client tick
        this.tickCount = 0;
    }
    //called by host when clicking "start"
    onHostStartClick(){
        //players will have their own local data (e.g. class choice)
        //need to load their data into the host before the game can really start
        for(const c of this.connections){
            const getMsg = {
                kind:this.MESSAGE_KINDS.GET_DATA,
                hostId:Fes.data.player,
                data:{
                    id:c.peer,
                    //cilent will match by peer id and then fill data & send back
                }
            };
            console.log("msg send:",getMsg)
            this.send(getMsg);
            //flag the connection as pending, 
            //should probably change this so it doesn't modify the connection obj directly
            c.hasLoadedData = false;
            c.loadedData = {};//where the data will be loaded into
        }
    }
    //message obj is a generic object with at least the field isHost = true
    handleMessage(msgObj){
        switch(msgObj.kind){
            case this.MESSAGE_KINDS.INIT:
                this.msgInit(msgObj);
                break;
            case this.MESSAGE_KINDS.INPUT:
                this.msgInput(msgObj);
                break;
            case this.MESSAGE_KINDS.SYNC:
                this.msgSync(msgObj);
                break;
            case this.MESSAGE_KINDS.GET_DATA:
                this.msgGetData(msgObj);
                break;
            default:
                console.log("unkown message",msgObj);
        }
    }
    msgGetData(msgObj){
        //if you get a message requesting data for your peer, fill it and send it to the host
        if(msgObj.data.id==this.peer.id&&!msgObj.data.data){
            msgObj.data.data = {
                chosenClass:Fes.data.mainMenu.player1Selected//TODO:!!! what if the player changes thier character?
            }
            this.send(msgObj);//bounce the message back, but with your data
            return;
        }
        //got a responsce (it's sent to everyone). If you're the host, process it.
        if(msgObj.data.data){
            if(!this.isHost){
                return;
            }
            //else, flag that connection as valid & process data....
            for(const c of this.connections){
                if(c.peer == msgObj.data.id){
                    c.hasLoadedData = true;
                    c.loadedData = msgObj.data.data;
                    break;
                }
            }
        }
        //if you're the host, additionally check to see if everyone is loaded, if so start the game
        if(!this.isHost){
            return;
        }
        let allLoaded = true;
        for(const c of this.connections){
            if(!c.hasLoadedData){
                allLoaded = false;
                break;
            }
        }
        if(!allLoaded){
            return;
        }
        //if you're the host, iterate through connections, create entities, then serialise ECS
        //send ECS to all players and they will process from then on
        let msgInit = {
            kind:this.MESSAGE_KINDS.INIT,
            clients:[],
            hostId:Fes.data.player
        };
        let playerObj = {
            x :Fes.data.ecs.components.position.x[Fes.data.player],
            y :Fes.data.ecs.components.position.y[Fes.data.player]-64
        };
        //assign the local player
        Fes.data.mainMenu.assignCharacterToEntity(Fes.data.player, Fes.data.mainMenu.player1Selected);
        //assign the remote players
        for(const c of this.connections){
            playerObj.x += 300;
            playerObj.x = playerObj.x%600;
            //NOTE: c.peer == Fes.data.networking.peer.id
            //client can use this to tell which obj they have been assigned
            let instance = Player.init(playerObj);
            msgInit.clients.push({
                id:c.peer,
                instance:instance,
                x:playerObj.x,
                y:playerObj.y
            });
            Fes.data.ecs.addComponent(instance,"controlSourceNetwork");        
            Fes.data.mainMenu.assignCharacterToEntity(instance,c.loadedData.chosenClass);
        }
        this.isStarted = true;
        this.send(msgInit);
        Fes.data.ecs.addComponent(Fes.data.player,"controlSourceLocal");
        this.initServer(msgInit);
    }
    msgInit(msgObj){
        const hostId = Fes.data.networking.hostInstanceId;
        //ProcMapGen.generateTerrain(MapGen.getSeedForString(hostId));
        if(!this.isHost){
            for(const client of msgObj.clients){
                let instance = Player.init(client);
                if(client.id == this.peer.id){
                    Fes.data.player = client.instance;
                    console.log("setting player to: "+client.instance);
                    Fes.data.ecs.addComponent(Fes.data.player,"controlSourceLocal");
                }else{
                    console.log("setting instance to nw "+instance);
                    Fes.data.ecs.addComponent(instance,"controlSourceNetwork");
                }
                //assert
                if(instance != client.instance){
                    console.log("init: assert failed!");
                }
            }
            Fes.data.ecs.addComponent(msgObj.hostId,"controlSourceNetwork");
            this.isStarted = true;
        }
        //perform 1st time netwrok setup
        //reset the frame count so that all players have the same inital count
        Fes.engine.frameCount = 0;
        this.inputBuffer = new InputBuffer(msgObj);
        //overwrite the default control getter
        Fes.engine.getControls = this.inputBuffer.getControls;
        this.lastGoodState = new ECS(Fes.data.ecs.serialise());
        
        //start audio, note it needs to be enabled first to make the change.
        Audio.enableSound();
        Audio.playBGM(Audio.BGM_KINDS.LEVEL);
        Audio.disableSound();
    }
    msgInput(msgObj){
        if(msgObj.playerId!==Fes.data.player){
            this.inputBuffer.setControls(msgObj.frameNo,msgObj.controls,msgObj.playerId);
        }
        if(this.serverData){
            this.serverData.inputBuffer.setControls(msgObj.frameNo,msgObj.controls,msgObj.playerId);
        }
    }
    msgSync(msgObj){
        //server recnciliation, create a copy of the last known good frame from the server's sync
        //turf out old inputs
        this.inputBuffer.updateServerFrame(msgObj.serverFrame);
        let syncData = {};
        syncData.mapStr = msgObj.map;
        syncData.ecs = new ECS(msgObj.ecs);
        syncData.serverFrame = msgObj.serverFrame;
        syncData.systems = [];
        //compute how to adjust the frame rate to keep in sync with the server
        //at this point, your frame number should be = server+inputbuffer+lag
        if(this.syncData){
            //if there's an existing frame, we can compute how long it took between syncs
            let lag = this.syncData.serverFrame - syncData.serverFrame;
            if(lag<0){
                console.log("diff between packet arrival is negative!");
                lag = 0;
            }
            const desiredFrame = syncData.serverFrame+lag+this.inputBuffer.inputDelay;
            Fes.engine.frameCount = desiredFrame;
        }
        //control source components are set to the sync'ed player's data, change them
        for(const player of this.inputBuffer.players){
            syncData.ecs.removeComponent(player.id, "controlSourceLocal");
            syncData.ecs.removeComponent(player.id, "controlSourceNetwork");
            syncData.ecs.addComponent(player.id,"controlSourceNetwork");
        }
        syncData.ecs.addComponent(Fes.data.player,"controlSourceLocal");
        //TODO: see if there's a way to re-use systems without recreating each time
        Systems.initUpdate(syncData.ecs,syncData.systems);
        this.syncData = syncData;
        //roll syncData forward to the current frame
        this.replayRollback();
        //if you're too far ahead, or are behind, set curFrame = serverFrame + 6?
        if(Fes.engine.frameCount>syncData.serverFrame+this.inputBuffer.inputDelay*10){
            console.log("rollback is ahead, resetting frames");
            Fes.engine.frameCount=syncData.serverFrame+this.inputBuffer.inputDelay;
        }
        if(Fes.engine.frameCount<syncData.serverFrame){
            console.log("rollback is behind, resetting frames");
            Fes.engine.frameCount=syncData.serverFrame+this.inputBuffer.inputDelay;
        }
    }
    replayRollback(){
        let syncData = this.syncData;
        if(!syncData){
            console.log("have not got a base reference, cannot roll back");
            return;
        }
        //back up the local data, so that the server can take control for this function
        const curFrame = Fes.engine.frameCount;
        Fes.data.ecs = syncData.ecs;
        Map.deserialise(syncData.mapStr);
        for(let i=syncData.serverFrame;i<curFrame;i+=1){
            syncData.serverFrame=i;
            Fes.engine.frameCount = syncData.serverFrame;
            Systems.update(syncData.systems);
        }
        Fes.engine.frameCount = curFrame;
        Fes.data.systems = syncData.systems;
        //update render system refs to new ecs
        Fes.data.renderSystems = [];
        Systems.initRender(Fes.data.ecs,Fes.data.renderSystems);
    }
    //--game logic 
    update(){
        super.update();
        if(this.isHost && this.isStarted){
            //will get here if we're the server.
            //variable tick rate, the server can run at a slower tick rate than the client
            this.tickCount += 1;
            if(this.tickCount>=this.tickRate){
                this.tickCount = 0;
                this.tick();
            }
        }
        if(this.inputBuffer){
            this.updateInputs();
        }
    }
    //client-side
    updateInputs(){
        //updates local inputs
        let newControls = JSON.parse(JSON.stringify(Fes.engine.controls));
        newControls.isPredicted = false;
        const frameNo = Fes.engine.frameCount+this.inputBuffer.inputDelay;
        this.inputBuffer.setControls(frameNo,newControls,Fes.data.player);
        let controlMsg = {
            playerId:Fes.data.player,
            frameNo:frameNo,
            kind:this.MESSAGE_KINDS.INPUT,
            controls:newControls
        }
        this.send(controlMsg);
        this.inputBuffer.updatePredicitons();
    }
    //server-side
    initServer(msgObj){
        //only run on the host, stores the server's view of the world
        this.serverData = {};
        this.serverData.map = Map.serialise();
        this.serverData.ecs = new ECS(JSON.stringify(Fes.data.ecs.serialise()));
        this.serverData.inputBuffer = new InputBuffer(msgObj); 
        this.serverData.serverFrame = 0;
        this.serverData.systems = [];
        Systems.initUpdate(this.serverData.ecs,this.serverData.systems);
    }
    tick(){
        //back up the local data, so that the server can take control for this function
        const console = window.console.log;
        const ctrlBack = Fes.engine.getControls;
        const curFrame = Fes.engine.frameCount;
        const curEcs   = Fes.data.ecs;
        const curMap   = Map.serialise();
        window.console.log=function(...msg){
            console("network:",msg);//replace logging, so that we can differentiate logs made during a server tick
        }
        //process controls server-side
        Fes.engine.getControls = this.serverData.inputBuffer.getControls;
        Fes.data.ecs = this.serverData.ecs;
        Map.deserialise(this.serverData.map);
        for(let i=this.serverData.serverFrame;i<curFrame-this.inputBuffer.inputDelay;i+=1){//go up to the current frame, but stay behind
            this.serverData.serverFrame=i;
            Fes.engine.frameCount = this.serverData.serverFrame;
            Systems.update(this.serverData.systems);
        }
        this.serverData.map = Map.serialise();
        //TODO: send sync
        let syncMessage = {
            kind:this.MESSAGE_KINDS.SYNC,
            serverFrame:this.serverData.serverFrame,
            ecs:this.serverData.ecs.serialise(),
            map:this.serverData.map
        };
        //update server's frame
        this.serverData.inputBuffer.updateServerFrame(this.serverData.serverFrame);
        Fes.engine.getControls = ctrlBack;
        Fes.engine.frameCount = curFrame;
        Fes.data.ecs = curEcs; 
        Map.deserialise(curMap);
        window.console.log = console;
        this.send(syncMessage);
    }

    
    
}
export { NetworkEntity };



