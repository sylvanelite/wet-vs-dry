import { MainMenuEntity } from "./menu.mjs";

class Joystick {

    
    static update(){
        if(Fes.data.joystick){
            if(!MainMenuEntity.isInMenu()){
                Joystick.updateJoystickButtons();
            }
        }

    }
	static updateJoystickButtons(){
		let handleKeyDown = function(key){
			if(!Fes.engine.controls[key]){
				Fes.engine.controls[key+"_Pressed"] = true;
			}
			Fes.engine.controls[key]=true;
		}
        //updateJoystick:
        const dir = Fes.data.joystick.GetDir();
		Fes.engine.controls.Left=false;
		Fes.engine.controls.Up=false;
		Fes.engine.controls.Down=false;
		Fes.engine.controls.Right=false;
        if(dir.indexOf("W")>-1){
            //keyboard left = true;
            handleKeyDown("Left");
        }
        if(dir.indexOf("N")>-1){
            //keyboard up = true;;
            handleKeyDown("Up");
        }
        if(dir.indexOf("S")>-1){
            //keyboard down = true;;
            handleKeyDown("Down");
        }
        if(dir.indexOf("E")>-1){
            //keyboard right = true;;
            handleKeyDown("Right");
        }
        //can also be "C", but don't need to do anything there
    }

    static init(){
        //https://stackoverflow.com/questions/3514784/what-is-the-best-way-to-detect-a-mobile-device	
        const isMobile = (/Mobi|Android/i.test(navigator.userAgent));
        if(isMobile){
            //this should default to 0px so that users can click on the menu
            //assumption is joy.js will set the height which can 
            const newDiv = document.createElement("div");
            newDiv.setAttribute("id", "joyDiv");
            newDiv.style.position="absolute";
            newDiv.style.top="0px";
            newDiv.style.left="0px";
            newDiv.style.width="200px";//screen width/2
            newDiv.style.height="200px";//screen height/2
            const currentElem = document.getElementById("cnv");
            document.body.insertBefore(newDiv, currentElem);
            Fes.data.joystick = new JoyStick("joyDiv");
            Fes.R.varCanvas.addEventListener("touchstart", Joystick.handleStart,false);
        }

    }
    static handleStart (evt) {
      let touches = evt.changedTouches;
      let halfWayX = (Fes.R.SCREEN_WIDTH/Fes.R.SCALE)/2;
      for (const touch of touches) {
        //check touch is > 1/2 width
        if(touch.pageX>halfWayX){
			Fes.engine.controls.Mouse_Left = true;
			Fes.engine.controls.Mouse_Left_Pressed = true;
        }

      }
    }
	
}


export { Joystick };