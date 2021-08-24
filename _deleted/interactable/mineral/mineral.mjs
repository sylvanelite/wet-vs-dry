import {defineSystem,types} from "../../ecs.js";
import {Map} from "../../map.mjs";

class Mineral {

    static init(data){
        const ecs = Fes.data.ecs;
        const self = ecs.createEntity();
        ecs.addComponent(self,"position");
        ecs.components.position.x[self] = data.x;
        ecs.components.position.y[self] = data.y;
        ecs.addComponent(self,"size");
        ecs.components.size.width[self] = 32;
        ecs.components.size.height[self] = 32;
        ecs.addComponent(self,"mineral");
        ecs.components.mineral.hp[self] = 100;
        ecs.components.mineral.value[self] = 20;
        ecs.addComponent(self,"collisionPlayer");
        ecs.components.collisionPlayer.colliding[self] = 0;
        return self;
    }

    static defineRenderSystems(ecs,s){
        const query = ecs.createQuery("mineral");
        const system = defineSystem(query, Mineral.render);
        s.push(system);
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("mineral");
        const system = defineSystem(query, Mineral.update);
        s.push(system);
    }
    static defineComponents(){        
        Fes.data.ecs.defineComponent("mineral",{
            hp:types.float64,
            value:types.float64,
        });
    }
    
	static update(entity){
        const ecs = Fes.data.ecs;
        if(ecs.components.collisionPlayer.colliding[entity]){
            console.log("collision!");
        }
	}
    
    
	static render(entity){
        const ecs = Fes.data.ecs;
		let ctx = Fes.R.varCtx;
		ctx.strokeStyle = "#000000";
		ctx.beginPath();
        let w = ecs.components.size.width[entity];
        let h = ecs.components.size.height[entity];
		ctx.rect(ecs.components.position.x[entity]-Fes.R.screenX-w/2-0.5, 
                 ecs.components.position.y[entity]-h-Fes.R.screenY-0.5, 
			   w,h);
		ctx.stroke();
	}
}
export { Mineral };