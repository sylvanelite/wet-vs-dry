import { defineSystem,types } from "../ecs.js";
import { CBTStateMachine } from "./CBTStateMachine.mjs";

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
        const ecs = Fes.data.ecs;
        AI.clearAIContols(entity);
        AI.attackAIControls(entity);
        AI.recoverAIControls(entity);

    }
    
    static clearAIContols(entity){
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
    }
    static tryAIJump(entity){
        const topEdge = 4*Fes.R.TILE_SIZE;
        const ecs = Fes.data.ecs;
        //don't jump if too close to the top (can KO self)
        if(ecs.components.position.y[entity]>topEdge){
            ecs.components.platformer.UP[entity] = true;
        }
    }

    static attackAIControls(entity){
        const ecs = Fes.data.ecs;


        //case: attack
        //if you're attacking, back off
        //if you're not attacking, hold in
        //if the opponent is above, try jumping
        //if you're less than X pixels away, try attacking

        //TODO: add randomness to each action
        //TODO: prevent chasing if opponent is off-stage?

        //back off
        if(ecs.components.cbtState.currentState[entity]==CBTStateMachine.STATES.ATTACK){
            if(ecs.components.position.x[entity]>ecs.components.position.x[Fes.data.player]){
                ecs.components.platformer.RIGHT[entity] = true;
            }else{
                ecs.components.platformer.LEFT[entity] = true;
            }
            return;//nothing else to do
        }

        
        const leftEdge = 7* Fes.R.TILE_SIZE+Fes.R.TILE_SIZE/2;//offset by half a tile, so that they'll recover to the edge, rather than fall past it
        const rightEdge = 21* Fes.R.TILE_SIZE-Fes.R.TILE_SIZE/2;//21 to account for edge tile width
        if(ecs.components.position.x[Fes.data.player]<leftEdge || ecs.components.position.x[Fes.data.player]>rightEdge){
            //if the player is off the edge, don't chase
            return;
        }

        //hold in
        if(ecs.components.position.x[entity]>ecs.components.position.x[Fes.data.player]){
            ecs.components.platformer.LEFT[entity] = true;
            ecs.components.cbtState.LEFT[entity] = true;//facing
        }else{
            ecs.components.platformer.RIGHT[entity] = true;
            ecs.components.cbtState.RIGHT[entity] = true;//facing
        }

        //try jumping
        if(ecs.components.position.y[entity]>ecs.components.position.y[Fes.data.player]+8){//plus a bit to give the jump a threshold
            //only try jumping if facing the oppoent, since we can't change direction mid-air
            if(ecs.components.cbtState.facing[entity] == CBTStateMachine.FACING.LEFT &&
                ecs.components.position.x[entity]>ecs.components.position.x[Fes.data.player]){
                AI.tryAIJump(entity);
            }
            if(ecs.components.cbtState.facing[entity] == CBTStateMachine.FACING.RIGHT &&
                ecs.components.position.x[entity]<ecs.components.position.x[Fes.data.player]){
                AI.tryAIJump(entity);
            }
        }
        
        //try attacking
        const deltaX = ecs.components.position.x[entity]-ecs.components.position.x[Fes.data.player];
        const deltaY = ecs.components.position.y[entity]-ecs.components.position.y[Fes.data.player];
        const dist = Math.hypot(deltaX,deltaY);
        if(dist<40){
            //TODO: use PRNG? or Fes.engine.frameCount? to randomise
            ecs.components.cbtState.LEFT[entity] = true;
            ecs.components.cbtState.ATTACK[entity] = true;
        }

    }

    static recoverAIControls(entity){
        const ecs = Fes.data.ecs;
        //case: recover
        //if you're off the side, try jump to max height, then double jump 
        //hold in unless you're below the stage and within (player width) pixels of the edge

        //7,13 = left edge tile 
        //20,13 = right edge tile
        const leftEdge = 7* Fes.R.TILE_SIZE+Fes.R.TILE_SIZE/2;//offset by half a tile, so that they'll recover to the edge, rather than fall past it
        const rightEdge = 21* Fes.R.TILE_SIZE-Fes.R.TILE_SIZE/2;//21 to account for edge tile width
        const bottomEdge = 13* Fes.R.TILE_SIZE;
        if(ecs.components.position.x[entity]<leftEdge){
            //recover from the left
            ecs.components.platformer.RIGHT[entity] = true;
            if(ecs.components.platformer.current_v_speed[entity]>0){
                AI.tryAIJump(entity);
            }
        }
        if(ecs.components.position.x[entity]>rightEdge){
            //recover right
            ecs.components.platformer.LEFT[entity] = true;
            //if you're going down, try jump
            if(ecs.components.platformer.current_v_speed[entity]>0){
                AI.tryAIJump(entity);
            }
        }
        if(ecs.components.position.x[entity]>bottomEdge){
            //TODO: recover below? (head back out, then recover high)
            //it's relatively difficult to get into this position, for now, just ignore?
        }

    }
    
}


export { AI };