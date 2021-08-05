import {defineSystem,types} from "../../ecs.js";
import {Collision} from "../../controllers/collision.mjs";
import {Pathfind} from "../../controllers/pathfind.mjs";

class Enemy {

    static init(data){
        const ecs = Fes.data.ecs;
        const self = ecs.createEntity();
        ecs.addComponent(self,"position");
        ecs.components.position.x[self] = data.x;
        ecs.components.position.y[self] = data.y;
        ecs.addComponent(self,"size");
        ecs.components.size.width[self] = 16;
        ecs.components.size.height[self] = 16;
        ecs.addComponent(self,"direction");
        ecs.components.direction.magnitude[self] = 0;
        ecs.components.direction.angle[self] = 4.71239;//~270 deg
        ecs.addComponent(self,"enemy");
        ecs.components.enemy.hp[self] = 100;
        ecs.addComponent(self,"collisionBullet");
        ecs.components.collisionBullet.colliding[self] = 0;
        Pathfind.addToEntity(self);
        ecs.components.pathfind.kind[self] = Pathfind.PATH_KIND.A_STAR;
        return self;
    }

    static defineRenderSystems(ecs,s){
        const query = ecs.createQuery("enemy");
        const system = defineSystem(query, Enemy.render);
        s.push(system);
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("enemy");
        const system = defineSystem(query, Enemy.update);
        s.push(system);
    }
    static defineComponents(){        
        Fes.data.ecs.defineComponent("enemy",{
            hp:types.float64
        });
    }

	static update(entity){
        const ecs = Fes.data.ecs;
        if(ecs.components.collisionBullet.colliding[entity]){
            Enemy.updateCollision(entity);
        }
        Enemy.updateMovement(entity);
        Enemy.updateAI(entity);
	}
    static updateAI(entity){
        const ecs = Fes.data.ecs;
        if(!Fes.data.networking || !Fes.data.networking.isStarted){
            return;//don't run AI while in lobby
        }
        let maxPlayerEntity = 0
        const query = ecs.createQuery("player");
        for(let archetype of query.archetypes) {
            for(let playerEntity of archetype.entities) {
                //TODO: select a target, for now just pick first one & continually update
                if(playerEntity>=maxPlayerEntity){
                    maxPlayerEntity=playerEntity;
                }
            }
        }
        const playerX = ecs.components.position.x[maxPlayerEntity];
        const playerY = ecs.components.position.y[maxPlayerEntity];
        ecs.components.pathfind.targetx[entity] = playerX;
        ecs.components.pathfind.targety[entity] = playerY;
    }
    static updateCollision(entity){
        const ecs = Fes.data.ecs;
        //TODO: take damage
        const colIdxLower = Collision.binarySearch(Collision.arechtypeBullet,Collision.lowerBound,entity);
        const colIdxUpper = Collision.binarySearch(Collision.arechtypeBullet,Collision.upperBound,entity);
        if(colIdxLower == colIdxUpper == Collision.arechtypeBullet.length){
            //probably another object destroyed the bullet before this collision could be resolved
            //console.log("collision flagged, but not found on update!");
            return;//binary search returned no results
        }
        for(let i=colIdxUpper-1;i>=colIdxLower;i-=1) {
            let bulletEntity = Collision.arechtypeBullet[i];
            const collision = Collision.collisionCheck(entity,bulletEntity);
            if(collision){
                //do collision logic
                //console.log("taking dmg2: "+ecs.components.bullet.damage[bulletEntity]);
                if(ecs.components.bullet.explodes[bulletEntity] && 
                    ecs.components.bullet.damage[bulletEntity]>0){
                    //TODO: explode?
                    ecs.destroyEntity(bulletEntity);//only destory if bullet's dmg is >0 and explode is set
                    //NOTE: "destroyEntity" does not remove the bullet from Collision.arechtypeBullet
                    //need to do that manually:
                    Collision.arechtypeBullet.splice(i,1);
                }
            }
        }
    }
    static updateMovement(entity){
        const ecs = Fes.data.ecs;
        const move_speed =1;//TODO: modular move speed
        //will be set by pathfinding
        const stepX = ecs.components.pathfind.stepx[entity];
        const stepY = ecs.components.pathfind.stepy[entity];
        const x = ecs.components.position.x[entity];
        const y = ecs.components.position.y[entity];
        const dist = Math.sqrt((x-stepX)*(x-stepX) + (y-stepY)*(y-stepY));
        if(dist<move_speed){//no need to keep moving if we're that close.
            ecs.components.position.x[entity]=stepX;
            ecs.components.position.y[entity]=stepY;
            return;
        }
        //move by setting the direction heading
        let angle = Math.atan2(
            stepY-y,
            stepX-x
        );
        ecs.components.direction.angle[entity] = angle;
        ecs.components.direction.magnitude[entity] = move_speed;
        //TODO: should this be part of a direction component? shared slightly with bullet.
        let hOff = Math.cos(ecs.components.direction.angle[entity])*ecs.components.direction.magnitude[entity];
        let vOff = Math.sin(ecs.components.direction.angle[entity])*ecs.components.direction.magnitude[entity];
        ecs.components.position.x[entity]+=hOff;
        ecs.components.position.y[entity]+=vOff;

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
export { Enemy };