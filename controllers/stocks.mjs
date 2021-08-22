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
        numberAlive:0,
        renderPosition:0
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
        const system = defineSystem(query, Stocks.render,
            Stocks.beforeRenderUpdate);
        s.push(system);
    }
    static beforeUpdate(){
        //keep track of the running total of stocks each frame
        Stocks.StockState.numberAlive = 0;
    }
    static afterUpdate(){
        if(Stocks.isGameOver()){
            //TODO: "ok" button to restart the game, check mouse handling
        }
    }
    static beforeRenderUpdate(){
        Stocks.StockState.renderPosition = 0;
    }
    static isGameOver(){
        //don't check for game over if the main menu is open
        if(MainMenuEntity.isInMenu()){
            return false;
        }
        if(Stocks.StockState.numberAlive<=1){
            //check for game over
            return true;
            //TODO: some way of resetting the main menu
        }
        return false;
    }
    static isPlayerEntity(entity){
        //multiplayer mode, need to return true/false based on if you're the host or not
        if(Fes.data.networking){
            if(Fes.data.networking.isHost){
                return (Fes.data.player === entity);
            }else{
                return (Fes.data.player !== entity);
            }
        }
        //single player mode, just return true/false if it's the local player or not
        return (Fes.data.player === entity);
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
            ecs.components.stocks.stockCount[entity]-=1;
            ecs.components.cbtState.percent[entity] = 0;//reset the player's percent
            //set x spawn points
            let xSpawn = 600;
            if(Stocks.isPlayerEntity(entity)){
                xSpawn = 288;
            }
            ecs.components.position.x[entity] = xSpawn;
            ecs.components.position.y[entity] = 320;
        }
    }
    static render(entity){
        const ctx = Fes.R.varCtx;
        const ecs = Fes.data.ecs;
        if(MainMenuEntity.isInMenu()){
            return;
        }
        //render on the right for everyone except the local player
        //should only be 1-1 so this might be ok
        let renderX = Fes.R.SCREEN_WIDTH-128;
        const renderY =  Fes.R.SCREEN_HEIGHT-64;
        let renderYOffset = Stocks.StockState.renderPosition;
        if(Stocks.isPlayerEntity(entity)){
            renderX = 64;
            renderYOffset = 0;
        }
        for(var i=0;i<ecs.components.stocks.stockCount[entity];i+=1){
            const img = Stocks.getImgData("stock");
            if(img){
                ctx.drawImage(img,renderX+i*34,renderY+renderYOffset);
            }
        }
        if(!Stocks.isPlayerEntity(entity)){
            Stocks.StockState.renderPosition-=36;
            console.log(entity+" "+Stocks.StockState.renderPosition)
        }
        
        if(Stocks.isGameOver()){
        }
    }
}


export { Stocks };