import { Map } from "./map.mjs";
import { Components } from "./ecs/components.mjs";
import { Systems } from "./ecs/systems.mjs";
import { Font } from "./assets/fonts/font.mjs";

let Fes = {
	definitions:{},
	data:{
		systems:[],
		renderSystems:[],
	},
	engine : {
		frameCount:0,
		inputBuffer : [],
		controls : {
			Up:false,
			Down:false,
			Left:false,
			Right:false,
			Mouse_Left:false,
			Mouse_Right:false,
			Mouse_Left_Pressed:false,
			Mouse_Right_Pressed:false,
			Mouse_Left_Released:false,
			Mouse_Right_Released:false,
			Mouse_X:-1,
			Mouse_Y:-1,
			Mouse_Screen_X:-1,
			Mouse_Screen_Y:-1,
		},
		INPUT_BUFFER_SIZE:6,
		FRAME_DURATION:32,
		renderTimer:null,
		renderLastTick:null,
		lastTick:Date.now(),
		timer:null,
		globId:0,
		instanceName:""//for multiplayer: each player needs a unique ID
	},
	R: {
		varCtx:null,
		screenX:0,
		screenY:0,
		TILE_SIZE:32,
		SCREEN_WIDTH:768,//NOTE: if changing, also update the HTML canvas size, and scle below
		SCREEN_HEIGHT:432,
		SCALE:0.6
	}
};
Fes.engine.getControls = function (entityId){
	//this can be overwritten to implemented control abstractions
	if(entityId == Fes.data.player){
		return Fes.engine.controls;
	}
	return Fes.engine.blankControls;
}
Fes.start = function (){
	Components.init();
	Systems.initUpdate(Fes.data.ecs,Fes.data.systems);
	Systems.initRender(Fes.data.ecs,Fes.data.renderSystems);
	Fes.engine.blankControls = JSON.parse(JSON.stringify(Fes.engine.controls));
	Map.init(function(){
		clearTimeout(Fes.engine.timer);//if there was a previous timer running, stop it
		Fes.engine.lastTick = Date.now();
		Fes.engine.renderLastTick = Date.now();
		Fes.update();
		cancelAnimationFrame(Fes.R.render);
		Fes.engine.renderTimer = requestAnimationFrame(Fes.R.render);
	});
	
};
Fes.update =function (){
    //keep track of time delta
    let delta = Date.now()-Fes.engine.lastTick;
	var frames = Math.floor(delta/Fes.engine.FRAME_DURATION)+1;
	var remainder = delta%Fes.engine.FRAME_DURATION;
	for(let f=0;f<frames;f+=1){
		Systems.update(Fes.data.systems);
		Fes.engine.frameCount+=1;
	}
	if(Fes.data.networking){
		Fes.data.networking.update();
	}
	if(Fes.data.mainMenu){
		Fes.data.mainMenu.update();
	}
    Fes.engine.lastTick = Date.now();
	Fes.engine.timer=setTimeout(Fes.update,Fes.engine.FRAME_DURATION - remainder);
	//clear press/release triggers
	for(const key of Object.keys(Fes.engine.controls)){
		if(key.indexOf("_")>-1&&key.indexOf("Mouse")==-1){//pressed or released have a suffix
			Fes.engine.controls[key]=false;
		}
	}
	Fes.engine.controls.Mouse_Left_Pressed = false;
	Fes.engine.controls.Mouse_Right_Pressed = false;
	Fes.engine.controls.Mouse_Left_Released = false;
	Fes.engine.controls.Mouse_Right_Released = false;
	//keep the mouse x/y in sync with screen updates
	Fes.engine.controls.Mouse_X = Fes.R.screenX+Fes.engine.controls.Mouse_Screen_X;
	Fes.engine.controls.Mouse_Y = Fes.R.screenY+Fes.engine.controls.Mouse_Screen_Y;
};
Fes.stop = function (){
    cancelAnimationFrame(Fes.engine.renderTimer);
    clearTimeout(Fes.engine.timer);
};
Fes.init = function (){
	let getRandomId = function() {
		let str = "";
		//stripped down to remove characters that look similar
		var characters = "A245679YJLPSWMGFC";
		for(let i = 0; i < 5; i+=1) {
		   str += characters.charAt(Math.floor(Math.random() * characters.length));
		}
		return str;
	 };
	Fes.engine.instanceName = getRandomId();
	Fes.engine.globId = 0;
    Fes.R.CreateCanvas();
    document.onkeydown = function checkKeyDown(e) {
		e = e || window.event;
		let handleKey = function(key){
			if(!Fes.engine.controls[key]){
				Fes.engine.controls[key+"_Pressed"] = true;
			}
			Fes.engine.controls[key]=true;
		}
		//TODO: custom bindings
		if (e.code == 'ArrowUp'||e.code=="KeyW") {
			handleKey("Up");
		}
		if (e.code == 'ArrowDown'||e.code=="KeyS") {
			handleKey("Down");
		}
		if (e.code == 'ArrowLeft'||e.code=="KeyA") {
			handleKey("Left");
		}
		if (e.code == 'ArrowRight'||e.code=="KeyD") {
			handleKey("Right");
		}
		//console.log(e.code);
		if (e.code == 'Digit1'||e.code=="KeyI") {
			handleKey("Attack");
		}
		if (e.code == 'Digit2'||e.code=="KeyO") {
			handleKey("Special");
		}
		if (e.code == 'Digit3'||e.code=="KeyP") {
			handleKey("Dodge");
		}
    };
    document.onkeyup = function checkKeyUp(e) {
        e = e || window.event;
		let handleKey = function(key){
			if(Fes.engine.controls[key]){
				Fes.engine.controls[key+"_Released"] = true;
			}
			Fes.engine.controls[key]=false;
		}
		if (e.code == 'ArrowUp'||e.code=="KeyW") {
			handleKey("Up");
		}
		if (e.code == 'ArrowDown'||e.code=="KeyS") {
			handleKey("Down");
		}
		if (e.code == 'ArrowLeft'||e.code=="KeyA") {
			handleKey("Left");
		}
		if (e.code == 'ArrowRight'||e.code=="KeyD") {
			handleKey("Right");
		}
		if (e.code == 'Digit1'||e.code=="KeyI") {
			handleKey("Attack");
		}
		if (e.code == 'Digit2'||e.code=="KeyO") {
			handleKey("Special");
		}
		if (e.code == 'Digit3'||e.code=="KeyP") {
			handleKey("Dodge");
		}
    };
	Fes.R.varCanvas.addEventListener("mousedown", function(e){
		Fes.engine.controls.Mouse_X = Fes.R.screenX+e.offsetX*Fes.R.SCALE;
		Fes.engine.controls.Mouse_Y = Fes.R.screenY+e.offsetY*Fes.R.SCALE;
		Fes.engine.controls.Mouse_Screen_X = e.offsetX*Fes.R.SCALE;
		Fes.engine.controls.Mouse_Screen_Y = e.offsetY*Fes.R.SCALE;
		if(e.button == 0){
			Fes.engine.controls.Mouse_Left = true;
			Fes.engine.controls.Mouse_Left_Pressed = true;
		}
		if(e.button == 2){
			Fes.engine.controls.Mouse_Right = true;
			Fes.engine.controls.Mouse_Right_Pressed = true;
		}
	});
	Fes.R.varCanvas.addEventListener("mouseup", function(e){
		Fes.engine.controls.Mouse_X = Fes.R.screenX+e.offsetX*Fes.R.SCALE;
		Fes.engine.controls.Mouse_Y = Fes.R.screenY+e.offsetY*Fes.R.SCALE;
		Fes.engine.controls.Mouse_Screen_X = e.offsetX*Fes.R.SCALE;
		Fes.engine.controls.Mouse_Screen_Y = e.offsetY*Fes.R.SCALE;
		if(e.button == 0){
			Fes.engine.controls.Mouse_Left = false;
			Fes.engine.controls.Mouse_Left_Released = true;
		}
		if(e.button == 2){
			Fes.engine.controls.Mouse_Right = false;
			Fes.engine.controls.Mouse_Right_Released = true;
		}
	});
	Fes.R.varCanvas.addEventListener("mousemove", function(e){
		Fes.engine.controls.Mouse_Screen_X = e.offsetX*Fes.R.SCALE;
		Fes.engine.controls.Mouse_Screen_Y = e.offsetY*Fes.R.SCALE;
		Fes.engine.controls.Mouse_X = Fes.R.screenX+Fes.engine.controls.Mouse_Screen_X;
		Fes.engine.controls.Mouse_Y = Fes.R.screenY+Fes.engine.controls.Mouse_Screen_Y;
		
	});
	Fes.R.varCanvas.addEventListener('contextmenu', function(e){
		e.preventDefault();
	});
	Fes.start();
};
Fes.R.drawText = function(text,x,y){
	for(let i=0;i<text.length;i+=1){
		let ch = text.charAt(i);
		Font.drawCharacter(ch,x+Font.kerning(i),y);
	}
}
Fes.R.render = function (){
	Fes.R.clear();
	Fes.R.varCtx.imageSmoothingEnabled = false;
	//TODO: sort by depth
	Systems.render();
	if(Fes.data.networking){
		Fes.data.networking.render();
	}
	if(Fes.data.mainMenu){
		Fes.data.mainMenu.render();
	}
    Fes.engine.renderTimer = requestAnimationFrame(Fes.R.render);
};

Fes.R.CreateCanvas = function () {
    if(!Fes.R.varCtx){
        let canvas = document.getElementById('cnv');
		Fes.R.varCanvas = canvas;
        Fes.R.varCtx = canvas.getContext('2d');
    }
};
Fes.R.clear = function () {
    if(Fes.R.varCtx){
        Fes.R.varCtx.clearRect(0, 0,Fes.R.SCREEN_WIDTH,Fes.R.SCREEN_HEIGHT);
    }
};
window.Fes = Fes;
window.onload=Fes.init;

