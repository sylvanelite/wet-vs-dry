import {defineSystem,types} from "../../ecs.js";

class Judge {

    static MODE={
        GREEN:0,
        YELLOW:1,
        RED:2,
        BLACK:3
    };
    static init(data){
        const ecs = Fes.data.ecs;
        const self = ecs.createEntity();
        ecs.addComponent(self,"position");
        ecs.components.position.x[self] = data.x;
        ecs.components.position.y[self] = data.y;
        ecs.addComponent(self,"size");
        ecs.components.size.width[self] = 64;
        ecs.components.size.height[self] = 64;
        ecs.addComponent(self,"judge");
        ecs.components.judge.hp[self] = 100;
        ecs.components.judge.mode[self] = Judge.MODE.GREEN;
        ecs.components.judge.targetX[self] = data.x;
        ecs.components.judge.targetY[self] = data.y;
        for(const prop of data.properties){
            if(prop.name == "targetX"||prop.name == "targetY"){
                console.log(prop.name, parseFloat(prop.value));
                ecs.components.judge[prop.name][self] = parseFloat(prop.value);
            }
        }
        return self;
    }

    static defineRenderSystems(ecs,s){
        const query = ecs.createQuery("judge");
        const system = defineSystem(query, Judge.render);
        s.push(system);
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("judge");
        const system = defineSystem(query, Judge.update);
        s.push(system);
    }
    static defineComponents(){        
        Fes.data.ecs.defineComponent("judge",{
            hp:types.float,
            targetX:types.float,
            targetY:types.float,
            mode:types.int8
        });
    }
    
	static update(entity){
        const ecs = Fes.data.ecs;
        //TODO: check for state and change
	}
    //collision is detected in CBTStateMachine functions
    static takeHit(judgeEntity,playerEntity,hitbox){
        const ecs = Fes.data.ecs;
        //TODO: actual damage calcs
        ecs.components.position.x[playerEntity] = ecs.components.judge.targetX[judgeEntity];
        ecs.components.position.y[playerEntity] = ecs.components.judge.targetY[judgeEntity];

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
export { Judge };