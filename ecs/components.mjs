import { ECS, types } from "../ecs.js";
import { Platformer } from "../controllers/platformer.mjs";
import { Collision } from "../controllers/collision.mjs";
import { Pathfind } from "../controllers/pathfind.mjs";
import { MouseAim } from "../controllers/mouseaim.mjs";
import { Orchestrator } from "../controllers/orchestrator.mjs";
import { CBTStateMachine } from "../controllers/CBTStateMachine.mjs";
import { Knockback } from "../controllers/knockback.mjs";
import { Bullet } from "../interactable/bullets/bullet.mjs";
import { Enemy } from "../interactable/enemy/enemy.mjs";
import { Mineral } from "../interactable/mineral/mineral.mjs";
import { Judge } from "../interactable/judge/judge.mjs";




class Components  {
    constructor() {}
    
    static init(){
        if(Fes.data.ecs){
            console.log("components already defined!");
            return;
        }
        const ecs = new ECS();
        Fes.data.ecs = ecs;
        ecs.defineComponent("position",{
            x:types.float64,
            y:types.float64,
        });
        ecs.defineComponent("size",{
            width:types.float64,
            height:types.float64,
        });
        ecs.defineComponent("direction",{
            magnitude:types.float64,
            angle:types.float64,
        });
        ecs.defineComponent("mouseControls",{
            x:types.float64,
            y:types.float64,
        });
        ecs.defineComponent("controlSourceLocal");
        ecs.defineComponent("controlSourceNetwork");
        ecs.defineComponent("player");
        ecs.defineComponent("mapRenderer");
        Platformer.defineComponents();
        Collision.defineComponents();
        Pathfind.defineComponents();
        MouseAim.defineComponents();
        Orchestrator.defineComponents();
        CBTStateMachine.defineComponents();
        Knockback.defineComponents();
        Bullet.defineComponents();
        Enemy.defineComponents();
        Mineral.defineComponents();
        Judge.defineComponents();
        
    }
}


export { Components };