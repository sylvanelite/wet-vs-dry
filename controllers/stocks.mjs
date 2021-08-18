import { defineSystem,types } from "../ecs.js";
import { Map } from "../map.mjs";
import { Collision } from "./collision.mjs";

class Stocks {
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
        //TODO: defining components is relatively wateful
        //      get sync for free, but there will only be 1 entity for e.g. 10000 allocated components  
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
        if(Stocks.StockState.numberAlive<=1){
            //check for game over
            console.log("game over!");
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
            Fes.data.ecs.components.position.x[entity] = 288;//TODO: set x spawn points
            Fes.data.ecs.components.position.y[entity] = 320;
        }
    }
    static render(entity){
        const ecs = Fes.data.ecs;
        //TODO: render stocks on screen
    }
}


export { Stocks };