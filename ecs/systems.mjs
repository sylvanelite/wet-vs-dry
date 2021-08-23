import { Platformer } from "../controllers/platformer.mjs";
import { MouseAim } from "../controllers/mouseaim.mjs";
import { Collision } from "../controllers/collision.mjs";
import { CBTStateMachine } from "../controllers/CBTStateMachine.mjs";
import { AI } from "../controllers/ai.mjs";
import { Knockback } from "../controllers/knockback.mjs";
import { Stocks } from "../controllers/stocks.mjs";
import { Player } from "../player.mjs";
import { MapRenderer } from "../terrain/map_renderer.mjs";
import { ScreenRenderer } from "../terrain/screen_renderer.mjs";




class Systems  {
    constructor() {}
    
    static initUpdate(ecs,systems){
        if(systems.length){
            console.log("systems already defined!");
            return;
        }
        Platformer.defineSystems(ecs,systems);
        MouseAim.defineSystems(ecs,systems);
        Collision.defineSystems(ecs,systems);
        CBTStateMachine.defineSystems(ecs,systems);
        Knockback.defineSystems(ecs,systems);
        AI.defineSystems(ecs,systems);
        Stocks.defineSystems(ecs,systems);
    }
    static initRender(ecs,renderSystems){
        if(renderSystems.length){
            console.log("render systems already defined!");
            return;
        }
        MapRenderer.defineRenderSystems(ecs,renderSystems);
        Player.defineRenderSystems(ecs,renderSystems);
        CBTStateMachine.defineRenderSystems(ecs,renderSystems);
        Knockback.defineRenderSystems(ecs,renderSystems);
        MouseAim.defineRenderSystems(ecs,renderSystems);
        //NOTE: after this point, UI elemts are drawn
        ScreenRenderer.defineRenderSystems(ecs,renderSystems);
        //stocks are drawn on top of the screen
        Stocks.defineRenderSystems(ecs,renderSystems);
    }
    static update(systems){
        for(let i=0;i<systems.length;i+=1){
            const system = systems[i];
            system();
        }
    }
    static render(){
        for(let i=0;i<Fes.data.renderSystems.length;i+=1){
            const system = Fes.data.renderSystems[i];
            system();
        }
    }
}


export { Systems };