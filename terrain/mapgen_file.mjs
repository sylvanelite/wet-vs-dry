import {MapRenderer} from "./map_renderer.mjs";
import {Player} from "../player.mjs";
import {Map} from "../map.mjs";
import {NetworkEntity} from "../controllers/nwEntity.mjs";
import {MainMenuEntity} from "../controllers/menu.mjs";

class FileMapGen {
	static createObejct(object){
		if(object.name == "player"){
			let p = Player.init(object);
			//strict equality is because entity is 0 for the 
			if(Fes.data.player===undefined){
				Fes.data.ecs.addComponent(p,"controlSourceLocal");
				Fes.data.player = p;
			}
            return;
		}
		if(object.name == "networking"){
			if(!Fes.data.networking){
				Fes.data.networking = new NetworkEntity();
				return;
			}
			console.log("network controller already added");
            return;
		}
		if(object.name == "menu"){
			if(!Fes.data.mainMenu){
				Fes.data.mainMenu = new MainMenuEntity();
				return;
			}
			console.log("main menu controller already added");
			return;
		}
		console.log("unkown object "+object.name);
	}
	static fileData = null;
	
	static generateTerrain(){
		let data = FileMapGen.fileData;
		console.log(data.layers[1]);
        Map.setData(data.layers[1]);
	}
	static generateObjects(){
		let data = FileMapGen.fileData;
		//create objects
		for(let i=0;i<data.layers.length;i+=1){
			let layer = data.layers[i];
			if(layer.hasOwnProperty("objects")){
				for(let j=0;j<layer.objects.length;j+=1){
					let object = layer.objects[j];
					object.y+=object.width;
					FileMapGen.createObejct(object);
				}
			}
		}
	}
    static load(callback){
		fetch('./terrain/data/tiled/map.json')
        //fetch('./terrain/data/tile.json')
		.then(response => response.json())
		.then(function(data){
			FileMapGen.fileData = data;
			FileMapGen.generateObjects();
			FileMapGen.generateTerrain();
			MapRenderer.init();
		  callback();
		});
    }
	static takeDamage(entity){
		
	}
}

export { FileMapGen };