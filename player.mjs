import { Platformer } from "./controllers/platformer.mjs";
import { MouseAim } from "./controllers/mouseaim.mjs";
import { CBTStateMachine } from "./controllers/CBTStateMachine.mjs";
import { Knockback } from "./controllers/knockback.mjs";
import { Stocks } from "./controllers/stocks.mjs";
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
        Stocks.addToEntity(self);
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
        ctx.fillStyle = "rgba(0,0,255,0.5)";
        //ctx.strokeStyle = "1px solid black";
        if(Fes.data.player == entity){
            ctx.fillStyle = "rgba(255,0,0,0.5)";
        }
        ctx.beginPath();
        ctx.arc(floorX - Fes.R.screenX-0.5-ecs.components.size.width[entity]/2, 
                 floorY - Fes.R.screenY-0.5-ecs.components.size.height[entity]/2, 
                 ecs.components.size.width[entity]*2,0, 2 * Math.PI);
        ctx.fill();
        //ctx.stroke();


    }

}


export { Player };