import { Platformer } from "../controllers/platformer.mjs";
import { MouseAim } from "../controllers/mouseaim.mjs";
import { Collision } from "../controllers/collision.mjs";
import { Pathfind } from "../controllers/pathfind.mjs";
import { Orchestrator } from "../controllers/orchestrator.mjs";
import { CBTStateMachine } from "../controllers/CBTStateMachine.mjs";
import { AI } from "../controllers/ai.mjs";
import { Knockback } from "../controllers/knockback.mjs";
import { Stocks } from "../controllers/stocks.mjs";
import { Bullet } from "../interactable/bullets/bullet.mjs";
import { Enemy } from "../interactable/enemy/enemy.mjs";
import { Mineral } from "../interactable/mineral/mineral.mjs";
import { Judge } from "../interactable/judge/judge.mjs";
import { Player } from "../player.mjs";
import { MapRenderer } from "../terrain/map_renderer.mjs";




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
        Pathfind.defineSystems(ecs,systems);
        Orchestrator.defineSystems(ecs,systems);
        CBTStateMachine.defineSystems(ecs,systems);
        Knockback.defineSystems(ecs,systems);
        Bullet.defineSystems(ecs,systems);
        Enemy.defineSystems(ecs,systems);
        Mineral.defineSystems(ecs,systems);
        Judge.defineSystems(ecs,systems);
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
        MouseAim.defineRenderSystems(ecs,renderSystems);
        Bullet.defineRenderSystems(ecs,renderSystems);
        Enemy.defineRenderSystems(ecs,renderSystems);
        Mineral.defineRenderSystems(ecs,renderSystems);
        Judge.defineRenderSystems(ecs,renderSystems);
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