import { defineSystem,types } from "../ecs.js";
import { Collision } from "./collision.mjs";
import { MainMenuEntity } from "./menu.mjs";

class Stocks {

    static imageCache = {};

    static getImgData(imgName){
        const ecs = Fes.data.ecs;
        if(Stocks.imageCache[imgName] == null){
            //start loading
            let img = new Image();
            Stocks.imageCache[imgName] = {
                image:img,
                isLoaded:false
            };
            img.onload = function(){
                Stocks.imageCache[imgName].isLoaded = true;
            };
            img.src = "./assets/stocks/"+imgName+".png";
        }
        if(Stocks.imageCache[imgName].isLoaded){
            return Stocks.imageCache[imgName].image;
        }
    }

    static StockState = {
        numberAlive:0
    };
    static ARENA_BOUNDS = {
        //rect collision (x is centered, y is the objects floor)
        x:(128+640)/2,
        y:128+480,
        width:6400,
        height:480
    };
    static addToEntity(entity) {
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity, "stocks");
        ecs.components.stocks.stockCount[entity] = 3;
        return self;
    }
    static defineComponents(){        
        Fes.data.ecs.defineComponent("stocks",{
            stockCount:types.int32
        });
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("stocks");
        const system = defineSystem(query, Stocks.update,
            Stocks.beforeUpdate,
            Stocks.afterUpdate);
        s.push(system);
    }
    static defineRenderSystems(ecs, s) {
        const query = ecs.createQuery("stocks");
        const system = defineSystem(query, Stocks.render);
        s.push(system);
    }
    static beforeUpdate(){
        //keep track of the running total of stocks each frame
        Stocks.StockState.numberAlive = 0;
    }
    static afterUpdate(){
        //don't check for game over if the main menu is open
        if(!Fes.data.mainMenu){
            return;
        }
        if(Fes.data.mainMenu.mode != MainMenuEntity.MENU_MODE.RUNNING){
            return;
        }
        if(Stocks.StockState.numberAlive<=1){
            //check for game over
            console.log("game over!");
            //TODO: some way of resetting the main menu
        }
    }
    static update(entity){
        const ecs = Fes.data.ecs;
        //keep track of the number of alive players
        if(ecs.components.stocks.stockCount[entity]>0){
            Stocks.StockState.numberAlive += 1;
        }
        //check for out-of-bounds players
        const obj = {
            x:ecs.components.position.x[entity],
            y:ecs.components.position.y[entity],
            width:ecs.components.size.width[entity],
            height:ecs.components.size.height[entity]
        };
        if(!Collision.rectRectCollision(obj,Stocks.ARENA_BOUNDS)){
            //outside bounds, KO
            Fes.data.ecs.components.stocks.stockCount[entity]-=1;
            //set x spawn points
            let xSpawn = 600;
            if(Fes.data.player === entity){
                xSpawn = 288;
            }
            Fes.data.ecs.components.position.x[entity] = xSpawn;
            Fes.data.ecs.components.position.y[entity] = 320;
        }
    }
    static render(entity){
        const ctx = Fes.R.varCtx;
        const ecs = Fes.data.ecs;
        if(!Fes.data.mainMenu){
            return;
        }
        if(Fes.data.mainMenu.mode != MainMenuEntity.MENU_MODE.RUNNING){
            return;
        }
        //render on the right for everyone except the local player
        //should only be 1-1 so this might be ok
        let renderX = Fes.R.SCREEN_WIDTH-128;
        const renderY =  Fes.R.SCREEN_HEIGHT-64;
        if(Fes.data.player === entity){
            renderX = 64;
        }
        for(var i=0;i<Fes.data.ecs.components.stocks.stockCount[entity];i+=1){
            const img = Stocks.getImgData("stock");
            if(img){
                ctx.drawImage(img,renderX+i*34,renderY);
            }
        }

    }
}


export { Stocks };