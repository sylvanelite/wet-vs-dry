import { Networking } from "./Networking.mjs";
import { FileMapGen } from "../terrain/mapgen_file.mjs";
import { Player } from "../player.mjs";
import { ECS } from "../ecs.js";
import { CBTStateMachine } from "./CBTStateMachine.mjs";

class MainMenuEntity {
    static imageCache = {};

    static getImgData(imgName){
        const ecs = Fes.data.ecs;
        if(MainMenuEntity.imageCache[imgName] == null){
            //start loading
            let img = new Image();
            MainMenuEntity.imageCache[imgName] = {
                image:img,
                isLoaded:false
            };
            img.onload = function(){
                MainMenuEntity.imageCache[imgName].isLoaded = true;
            };
            img.src = "./assets/menu/"+imgName+".png";
        }
        if(MainMenuEntity.imageCache[imgName].isLoaded){
            return MainMenuEntity.imageCache[imgName].image;
        }
    }
    static MENU_MODE={
        MAIN_MENU:0,
        NETWORK:1,
        RUNNING:2
    };
	constructor(){
        this.mode = MainMenuEntity.MENU_MODE.MAIN_MENU;
        this.startButton = {
            x:333,
            y:473,
            width:180,
            height:64,
            text:"START"
        };
        this.networkButton = {
            x:529,
            y:473,
            width:100,
            height:64,
            text:"NETWORK"
        };
        this.petal_random = {
            img:"random_ch",
            x:285,y:100
        };
        this.petal_1 = {
            img:"ch1",
            x:202,y:139
        };
        this.petal_2 = {
            img:"ch2",
            x:180,y:230
        };
        this.petal_3 = {
            img:"ch3",
            x:239,y:303
        };
        this.petal_1a = {
            img:"ch1a",
            x:369,y:139
        };
        this.petal_2a = {
            img:"ch2a",
            x:389,y:230
        };
        this.petal_3a = {
            img:"ch3a",
            x:332,y:303
        };
        this.petals = [this.petal_random,this.petal_1,this.petal_2,this.petal_3,
            this.petal_1a,this.petal_2a,this.petal_3a];
        this.player1Selected = 0;
        this.player2Selected = 0;
        Fes.data.ecs.removeComponent(Fes.data.player, "controlSourceLocal");
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
    isMouseOverCircle(display){
        const radius = 40;
        const mouseDist = Math.hypot(display.x+radius - Fes.engine.controls.Mouse_Screen_X, 
            display.y+radius - Fes.engine.controls.Mouse_Screen_Y)
            return (mouseDist<=radius);
    }
	collisionCheck (objA,objB){
        //rect collision (x is centered, y is the objects floor)
        if (objA.x-objA.width/2 < objB.x+objB.width/2 && objA.x+objA.width/2 > objB.x-objB.width/2 &&
          objA.y-objA.height < objB.y && objA.y > objB.y-objB.height){
              return true;
          }
        return false;
    }
    startLocalGame(){
        const ecs = Fes.data.ecs;
        this.mode = MainMenuEntity.MENU_MODE.RUNNING;
        Fes.data.ecs.addComponent(Fes.data.player,"controlSourceLocal");
        let aiInstance = Player.init({
            x:ecs.components.position.x[Fes.data.player]+128,
            y:ecs.components.position.y[Fes.data.player]-10
        });
        console.log(aiInstance);
        Fes.data.ecs.addComponent(aiInstance,"controlSourceAI");
        this.assignCharacterToEntity(Fes.data.player,this.player1Selected);
        this.assignCharacterToEntity(aiInstance,this.player2Selected);
    }
    selectCharacter(idx,playerNo){//playerNo == 1 or 2
        //TODO: any animation logic, etc?
        this["player"+playerNo+"Selected"] = idx;
    }
    assignCharacterToEntity(entity,chosenChIdx){
        const chosenCh = this.petals[chosenChIdx].img;
        console.log("assigning:"+chosenCh+" to "+entity);
        const ecs = Fes.data.ecs;
        if(chosenCh == "ch1" || chosenCh == "ch1a"){
            ecs.components.cbtState.animationData[entity] = CBTStateMachine.ANIMATION_DATA.REDHOOD;
        }
        if(chosenCh == "ch2" || chosenCh == "ch2a"){
            ecs.components.cbtState.animationData[entity] = CBTStateMachine.ANIMATION_DATA.WARRIOR;
        }
        if(chosenCh == "random_ch"){
            if(Fes.engine.frameCount%2==0){
                ecs.components.cbtState.animationData[entity] = CBTStateMachine.ANIMATION_DATA.REDHOOD;
            }else{
                ecs.components.cbtState.animationData[entity] = CBTStateMachine.ANIMATION_DATA.WARRIOR;
            }
        }
    }
    //--game logic 
    update(){
        if(this.mode === MainMenuEntity.MENU_MODE.RUNNING){
            return;
        }
        if(this.mode === MainMenuEntity.MENU_MODE.MAIN_MENU){
            //Start
            if(Fes.engine.controls.Mouse_Left_Pressed){
                if(this.isMouseOverRect(this.startButton)){
                    this.startLocalGame();
                }
            }
            //siwtch to network mode
            if(Fes.engine.controls.Mouse_Left_Pressed){
                if(this.isMouseOverRect(this.networkButton)){
                    this.mode = MainMenuEntity.MENU_MODE.NETWORK;
                    //create instance of nw object
                    FileMapGen.createObejct({name:"networking"});
                    this.selectCharacter(0,2);//set the indicator to random to blind pick nw opponent
                }
            }
            //Ch select
            for(let i=0;i<this.petals.length;i+=1){
                let petal = this.petals[i];
                if(Fes.engine.controls.Mouse_Left_Pressed){
                    if(this.isMouseOverCircle(petal)){
                        this.selectCharacter(i,1);
                    }
                }
                if(Fes.engine.controls.Mouse_Right_Pressed){
                    if(this.isMouseOverCircle(petal)){
                        this.selectCharacter(i,2);
                    }
                }
            }
        }
        if(this.mode === MainMenuEntity.MENU_MODE.NETWORK){
            //Ch select
            for(let i=0;i<this.petals.length;i+=1){
                let petal = this.petals[i];
                if(Fes.engine.controls.Mouse_Left_Pressed){
                    if(this.isMouseOverCircle(petal)){
                        this.selectCharacter(i,1);
                    }
                }
            }
            //if the networking object has started the game's connections, set the menu to be running
            if(Fes.data.networking.peer){
                this.mode = MainMenuEntity.MENU_MODE.RUNNING;
            }
        }

    }
    renderPetals(){
		let ctx = Fes.R.varCtx;
        for(let petal of this.petals){
            let imgName = petal.img;
            if(this.isMouseOverCircle(petal)){
                imgName+="_inverted";
            }
            const img = MainMenuEntity.getImgData(imgName);
            if(img){
                ctx.drawImage(img,  petal.x,petal.y);

            }
        }
    }
    renderCharacterChoices(){
		let ctx = Fes.R.varCtx;
        let imgName = "p1_select";
        const petal = this.petals[this.player1Selected];
        const img = MainMenuEntity.getImgData(imgName);
        if(img){
            ctx.drawImage(img, petal.x+10,petal.y+10);
        }
        let imgName2 = "p2_select";
        const petal2 = this.petals[this.player2Selected];
        const img2 = MainMenuEntity.getImgData(imgName2);
        if(img2){
            ctx.drawImage(img2, petal2.x+10,petal2.y+10);
        }

    }
	render(){
        if(this.mode === MainMenuEntity.MENU_MODE.RUNNING){
            return;
        }
		let ctx = Fes.R.varCtx;
        if(this.mode === MainMenuEntity.MENU_MODE.MAIN_MENU){
            let buttons = [this.startButton,this.networkButton];
            for(let button of buttons){
                ctx.fillStyle = '#c4c4c4';
                if(this.isMouseOverRect(button)){
                    ctx.fillStyle = '#00FF00';
                }
                ctx.fillRect(button.x-button.width/2, button.y-button.height,  button.width, button.height);
                ctx.strokeStyle = "#000000";
                ctx.beginPath();
                ctx.rect(button.x-button.width/2-0.5, button.y-button.height-0.5,  button.width, button.height);
                ctx.stroke();
                ctx.fillStyle = '#000000';
                ctx.font = '16px serif';
                ctx.fillText(button.text, button.x-(button.text.length*11)/2, button.y-button.height/2 );    
            }
        }
        if(this.mode === MainMenuEntity.MENU_MODE.NETWORK){
            //can no longer change character after reaching the hosting/joining section
            if(Fes.data.networking.peer){
                return;
            }
        }
        this.renderPetals();
        this.renderCharacterChoices();
	}
    static isInMenu(){
        if(!Fes.data.mainMenu){
            return true;
        }        
        if(Fes.data.networking){
            //check if the menu has started (host/join screen)
            if(!Fes.data.networking.isStarted){
                return true;
            }
        }
        if(Fes.data.mainMenu.mode != MainMenuEntity.MENU_MODE.RUNNING){
            return true;
        }
        return false;
    }
    
}
export { MainMenuEntity };



