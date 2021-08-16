import { defineSystem,types } from "../ecs.js";
import { Platformer } from "./platformer.mjs";
class AI{
    
    static defineComponents(){
        Fes.data.ecs.defineComponent("controlSourceAI");
    }
    static defineSystems(ecs,s){
        //give each platformer the ability to also be a cbt object
        const query = ecs.createQuery("controlSourceAI");
        const system = defineSystem(query, AI.update);
        s.push(system);
    }
    static update(entity){
        AI.updateAIControls(entity);
    }
    
    static updateAIControls(entity){
        const ecs = Fes.data.ecs;
        const controls = Fes.engine.getControls(entity);
        ecs.components.platformer.LEFT[entity] = controls.Left;
        ecs.components.platformer.RIGHT[entity] = controls.Right;
        ecs.components.platformer.UP[entity] = controls.Up_Pressed;
        if(Fes.engine.frameCount%10==0){
            ecs.components.platformer.UP[entity] = true;
        }

    }
    
}


export { AI };