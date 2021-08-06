import { Platformer } from "./controllers/platformer.mjs";
import { MouseAim } from "./controllers/mouseaim.mjs";
import { CBTStateMachine } from "./controllers/CBTStateMachine.mjs";
import { Knockback } from "./controllers/knockback.mjs";
import { defineSystem } from "../ecs.js";


class Player  {
    static init(data){
        const ecs = Fes.data.ecs;
        const self = ecs.createEntity();
        ecs.addComponent(self,"position");
        ecs.components.position.x[self] = data.x;
        ecs.components.position.y[self] = data.y;
        ecs.addComponent(self,"size");
        ecs.components.size.width[self] = 8;
        ecs.components.size.height[self] = 8;
        Platformer.addToEntity(self);
        MouseAim.addToEntity(self);
        CBTStateMachine.addToEntity(self);
        Knockback.addToEntity(self);
        ecs.addComponent(self,"player");
        return self;
    }
    static defineRenderSystems(ecs,s){
        const query = ecs.createQuery("player");
        const system = defineSystem(query, Player.render);
        s.push(system);
    }
    static render(entity) {
        let ecs = Fes.data.ecs;
        let floorX = Math.floor(ecs.components.position.x[entity]);
        let floorY = Math.floor(ecs.components.position.y[entity]);
        let ctx = Fes.R.varCtx;
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.rect(floorX - Fes.R.screenX-0.5-ecs.components.size.width[entity]/2,
                 floorY - Fes.R.screenY-0.5-ecs.components.size.height[entity],
                 ecs.components.size.width[entity], 
                 ecs.components.size.height[entity]);
        ctx.stroke();
    }

}


export { Player };