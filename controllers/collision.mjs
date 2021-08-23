
import { defineSystem,types } from "../ecs.js";

class Collision{

    static defineComponents(){        
        Fes.data.ecs.defineComponent("collisionPlayer",{
            colliding:types.int8,
        });
    }
    static defineSystems(ecs,s){
        const collisionPlayerQuery = ecs.createQuery("collisionPlayer");
        const collisionPlayerSystem = defineSystem(collisionPlayerQuery, Collision.updateCollisionPlayer);
        s.push(collisionPlayerSystem);
    }
    static updateCollisionPlayer(entity){
        const ecs = Fes.data.ecs;
        //Note; this is slow, needs to create the query for every instance of (entity)
        //then iterates over every (player)
        //but since the number of players is low, this is ok for now.
        ecs.components.collisionPlayer.colliding[entity] = 0;
        const query = ecs.createQuery("player");
        for(let archetype of query.archetypes) {
            for(let playerEntity of archetype.entities) {
                const collision = Collision.collisionCheck(entity,playerEntity);
                if(collision){
                    //mark the entity as having collided, it will have to process this in its own update loop
                    ecs.components.collisionPlayer.colliding[entity] = 1;
                    break;
                }
            }
        }
    }
	static collisionCheck (entityA,entityB){
        const ecs = Fes.data.ecs;
        const objA = {
            x:ecs.components.position.x[entityA],
            y:ecs.components.position.y[entityA],
            width:ecs.components.size.width[entityA],
            height:ecs.components.size.height[entityA]
        };
        const objB = {
            x:ecs.components.position.x[entityB],
            y:ecs.components.position.y[entityB],
            width:ecs.components.size.width[entityB],
            height:ecs.components.size.height[entityB]
        };
        //rect collision (x is centered, y is the objects floor)
        Collision.rectRectCollision(objA,objB);
    }
    static rectRectCollision = function(objA,objB){
        if (objA.x-objA.width/2 < objB.x+objB.width/2 && objA.x+objA.width/2 > objB.x-objB.width/2 &&
          objA.y-objA.height < objB.y && objA.y > objB.y-objB.height){
              return true;
          }
        return false;
    }
    
    //https://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle
    static rectCircleCollision=function (circle,rect){
        let distX = Math.abs(circle.x - rect.x-rect.width/2);
        let distY = Math.abs(circle.y - rect.y-rect.height/2);
        if (distX > (rect.width/2 + circle.r)) { return false; }
        if (distY > (rect.height/2 + circle.r)) { return false; }
        if (distX <= (rect.width/2)) { return true; } 
        if (distY <= (rect.height/2)) { return true; }
        let dx=distX-rect.width/2;
        let dy=distY-rect.height/2;
        return (dx*dx+dy*dy<=(circle.r*circle.r));
    }

    
}


export { Collision };