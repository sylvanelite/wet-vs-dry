class Networking {
	constructor(){
        let url = window.location.host;
        if(url.indexOf(":")>0){//try remove port number
            let parts =url.split(":");
            url = parts[0];
        }
        this.peerSettings = {
            host: url,
            port: 9000,
            path: '/',
            debug: 2
        };
        this.baseId = "sylvan_4H6B8VJYTD_";//random string to prevent collisions with anyone else using peer js
		this.name="networking";
        this.isStarted = false;//set to true when all players have joined
        this.isHost = false;
        this.hostInstanceId = Fes.engine.instanceName;//will be overwritten if you're not the host
        this.messageBuffer = [];
        this.connections = [];
        this.peer = null;
        this.hostButton = {
            text:"Host",
            x:270,y:403,
            width:100,
            height:64
        };
        this.joinButton = {
            text:"Join",
            x:this.hostButton.x+120,y:this.hostButton.y,
            width:100,
            height:64
        };
        this.startButton = {
            text:"Start",
            x:250,y:300,
            width:100,
            height:64
        };
        this.setUp();
	}
    host(){
        let nw = this;
        let peer = new Peer(this.baseId+Fes.engine.instanceName, this.peerSettings);
        peer.on('open', function (id) {
            console.log('ID: ' + id);
            nw.isHost = true;
        });
        peer.on('connection', function (c) {
            nw.connections.push(c);
            console.log("connected",c.open);
            c.on('data', function (data) {
                nw.receive(data);
            });
            c.on('open', function () {
                console.log("Connected to: " + c.peer);
            });
            c.on('close', function () {
                //TODO: splice c from nw.connections and disconnect player
                console.log("connection closed.");
            });
            c.on('error', function (e) {
                //TODO: splice c from nw.connections and disconnect player
                console.log("Error: ",e);
            });
        });
        peer.on('disconnected', function() {
            console.log("disconnected");
        });
        peer.on('close', function() {
            console.log("connection closed");
        });
        peer.on('error', function (err) {
            console.log(err);
        });
        nw.peer = peer;
    }
    join(){
        let enteredId = prompt("Enter the host ID");
        if(!enteredId){
            alert("invalid ID");
            return;
        }
        enteredId = enteredId.toUpperCase();
        let idToJoin = this.baseId+enteredId;
        this.hostInstanceId = enteredId;
        let nw = this;
        let peer = new Peer(null, this.peerSettings);
        peer.on('open',function(id){
            console.log("Peer open:"+id);
            let conn = peer.connect(idToJoin,{reliable:true});//TODO: evaluate performace?
            conn.on('open', function () {
                console.log("Connected to: " + conn.peer);
            });
            conn.on('data', function (data) {
                nw.receive(data);
            });
            conn.on('close', function () {
                //TODO: splice c from nw.connections and disconnect player
                console.log("connection closed.");
            });
            conn.on('error', function (e) {
                //TODO: splice c from nw.connections and disconnect player
                console.log("Error: ",e);
            });
            nw.connections.push(conn);
        });
        peer.on('close', function() {
            console.log("connection closed");
        });
        peer.on('error', function (e) {
            console.log("Peer Error: ",e);
        });
        nw.peer = peer;
    }
    receive(msgPackage){
        let messages = JSON.parse(msgPackage);
        if(messages.length>15){
            console.log("lot of recieve in one go:");
            console.log(messages);
        }
        for(let i=0;i<messages.length;i+=1){
            let msgObj = messages[i];
            //if you're the host, bounce this message to all clients (even the people who sent it)
            //these copies of the message will be flagged as "fromHost" through the send event, and thus get processed
            if(!msgObj.fromHost){
                if(this.isHost){
                    this.send(msgObj);//NOTE: this changes "fromHost".
                }
                //only treat messages from the host as authoritative
                continue;
            }
            //handle messages. Messages should always have 2 properties "kind" and "data"
            this.handleMessage(msgObj);
        }
    }
    send(msg){
        //buffer messages into a package and send in update loop to avoid tons of individual sends
        msg.fromHost = this.isHost;
        this.messageBuffer.push(msg);
    }
    sendMessageBuffer(){
        if(this.messageBuffer.length){
            let messageString = JSON.stringify(this.messageBuffer);
            if(this.messageBuffer.length>15){
                console.log("lot of send in one go:");
                console.log(messageString);
            }
            this.messageBuffer = [];
            let isSent = false;
            if(this.connections&&this.connections.length){
                for(let i=0;i<this.connections.length;i+=1){
                    let conn = this.connections[i];
                    if(conn.open){
                        isSent = true;//flag that it was sent to at least 1 person.
                        conn.send(messageString);
                    }
                }
            }
            if(this.isHost){
                //if you're the host, process any outgoing messages locally
                this.receive(messageString);
            }
            if(!isSent&&this.connections.length){
                console.log("Failed to send!")
                this.messageBuffer = [];
            }
        }
    }
    updateObejct(data){ 
        let existingObj = this.getObjectById(data.id);
        if(existingObj){
            existingObj.updateNetworkReceive(data);
        }
    }
	update(){
        if(!this.peer){
            //we're not connected
            if(Fes.engine.controls.Mouse_Left_Pressed){
                if(this.isMouseOverRect(this.hostButton)){
                    this.host();
                }
                if(this.isMouseOverRect(this.joinButton)){
                    this.join();
                }
            }
            return;
        }
        //if we're connected, flush the message buffer over the wire
        if(this.peer.open){
            this.sendMessageBuffer();
        }
        if(!this.isStarted){
            //game is not started, wait for other players
            if(this.isHost){
                if(Fes.engine.controls.Mouse_Left_Pressed){
                    if(this.isMouseOverRect(this.startButton)){
                        this.onHostStartClick();
                    }
                }
            }
            return;
        }
	}
	collisionCheck (objA,objB){
        //rect collision (x is centered, y is the objects floor)
        if (objA.x-objA.width/2 < objB.x+objB.width/2 && objA.x+objA.width/2 > objB.x-objB.width/2 &&
          objA.y-objA.height < objB.y && objA.y > objB.y-objB.height){
              return true;
          }
        return false;
    }
	isMouseOverRect(display){
		let mousePos = {
			x:Fes.engine.controls.Mouse_Screen_X-1,
			y:Fes.engine.controls.Mouse_Screen_Y-1,
			width:2,
			height:2
		};
		return this.collisionCheck(display,mousePos);//TODO: collisionCheck
	}
	render(){
		let ctx = Fes.R.varCtx;
        //not connected, show host/join info
        if(!this.peer){
            let buttons = [this.hostButton,this.joinButton];
            //rect
            for(let i=0;i<buttons.length;i+=1){
                let button = buttons[i];
                ctx.fillStyle = '#c4c4c4';
                if(this.isMouseOverRect(button)){
                    ctx.fillStyle = '#00FF00';
                }
                ctx.fillRect(button.x-button.width/2, button.y-button.height,  button.width, button.height);
                ctx.strokeStyle = "#000000";
                ctx.beginPath();
                ctx.rect(button.x-button.width/2-0.5, button.y-button.height-0.5,  button.width, button.height);
                ctx.stroke();
                Fes.R.drawText(button.text, button.x-(button.text.length*8)/2, button.y-button.height/2 );
            }
            return;
        }
        if(!this.isStarted){
            let menuX = 100;
            let menuY = 32;
            ctx.fillStyle = '#c4c4c4';
            ctx.fillRect(menuX-25, menuY-25, 300, 300);
            if(!this.peer.open){
                Fes.R.drawText("Initilising...", menuX,menuY );
                return;
            }
            //game is not started, wait for other players
            if(this.isHost){
                //host sees all entrants
                Fes.R.drawText("Host ID:"+Fes.engine.instanceName, menuX,menuY );
                Fes.R.drawText("You are the host. players in game:", menuX,menuY+16 );
                let textIdx = 0;
                for(const conn of this.connections){
                    Fes.R.drawText("player - "+conn.connectionId+" "+conn.peerConnection.connectionState, menuX,menuY+32+textIdx );
                    textIdx+=12;
                }
                this.startButton
                ctx.fillStyle = '#c4c4c4';
                if(this.isMouseOverRect(this.startButton)){
                    ctx.fillStyle = '#00FF00';
                }
                ctx.fillRect(this.startButton.x-this.startButton.width/2, this.startButton.y-this.startButton.height,  this.startButton.width, this.startButton.height);
                ctx.strokeStyle = "#000000";
                ctx.beginPath();
                ctx.rect(this.startButton.x-this.startButton.width/2-0.5, this.startButton.y-this.startButton.height-0.5,  this.startButton.width, this.startButton.height);
                ctx.stroke();
                Fes.R.drawText(this.startButton.text, this.startButton.x, this.startButton.y-this.startButton.height/2 );
                return;
            }
            //join players see waiting screen
            Fes.R.drawText("Waiting for host to start.", menuX,menuY );
            return;
        }
	}
    //-- below is code specific to the engine, overwirtten by the specific implementation
    setUp(){ }//called when the network object is created
    onHostStartClick(){ } //called by host when clicking "start"
    handleMessage(msgObj){  }//message obj is a generic object with at least the field isHost = true
}
export { Networking };



