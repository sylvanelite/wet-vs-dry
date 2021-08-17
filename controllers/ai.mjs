import { defineSystem,types } from "../ecs.js";

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
        ecs.components.platformer.LEFT[entity] = false;
        ecs.components.platformer.RIGHT[entity] = false;
        ecs.components.platformer.UP[entity] = false;
        ecs.components.cbtState.UP[entity] = false;
        ecs.components.cbtState.DOWN[entity] = false;
        ecs.components.cbtState.LEFT[entity] = false;
        ecs.components.cbtState.RIGHT[entity] = false;
        ecs.components.cbtState.ATTACK[entity] = false;
        ecs.components.cbtState.SPECIAL[entity] = false;
        if(Fes.engine.frameCount%20==0){
            ecs.components.platformer.UP[entity] = true;
        }
        if(Fes.engine.frameCount%40==0){
            ecs.components.cbtState.ATTACK[entity] = true;
        }
    }
    
}


export { AI };