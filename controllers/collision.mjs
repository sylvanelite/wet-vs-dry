
import { defineSystem,types } from "../ecs.js";

class Collision{
    static arechtypeBullet = []; 

    static defineComponents(){        
        Fes.data.ecs.defineComponent("collisionPlayer",{
            colliding:types.int8,
        });
        Fes.data.ecs.defineComponent("collisionBullet",{
            colliding:types.int8,
        });
    }
    static defineSystems(ecs,s){
        const collisionPlayerQuery = ecs.createQuery("collisionPlayer");
        const collisionPlayerSystem = defineSystem(collisionPlayerQuery, Collision.updateCollisionPlayer);
        const collisionBulletQuery = ecs.createQuery("collisionBullet");
        const collisionBulletSystem = defineSystem(collisionBulletQuery, Collision.updateCollisionBullet,
        Collision.beforeCollisionBulletSweep);
        s.push(collisionPlayerSystem);
        s.push(collisionBulletSystem);
    }
    static updateCollisionPlayer(entity){
        const ecs = Fes.data.ecs;
        //Note; this is slow, needs to create the query for every instance of (entity)
        //then iterates over every (player)
        //could be made faster like bullet collision
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
    static beforeCollisionBulletSweep(){
        const ecs = Fes.data.ecs;
        const query = ecs.createQuery("bullet");
        Collision.arechtypeBullet = []; 
        //not sure if ECS cares about the order of the archetype array
        //to be safe, create a copy before sorting it, 
        //also use this chance to flatten the archetypes to just contain the enetities
        for(const archetype of query.archetypes){
            for(let bulletEntity of archetype.entities) {
                Collision.arechtypeBullet.push(bulletEntity);
            }
        }
        //sort by x since bullets are more likely to travel sideways
        Collision.arechtypeBullet.sort(function(a,b){
            return ecs.components.position.x[a] - ecs.components.position.x[b]; 
        });
    }
    static updateCollisionBullet(entity){
        const ecs = Fes.data.ecs;
        ecs.components.collisionBullet.colliding[entity] = 0;
        const colIdxLower = Collision.binarySearch(Collision.arechtypeBullet,Collision.lowerBound,entity);
        const colIdxUpper = Collision.binarySearch(Collision.arechtypeBullet,Collision.upperBound,entity);
        if(colIdxLower == colIdxUpper == Collision.arechtypeBullet.length){
            return;//binary search returned no results
        }
        for(let i=colIdxLower;i<colIdxUpper;i+=1) {
            let bulletEntity = Collision.arechtypeBullet[i];
            const collision = Collision.collisionCheck(entity,bulletEntity);
            if(collision){
                //mark the entity as having collided, it will have to process this in its own update loop
                ecs.components.collisionBullet.colliding[entity] = 1;
                break;
            }
        }
    }

    //https://stackoverflow.com/questions/22697936/binary-search-in-javascript
    //returns index where: predicate(i-1) == false, and predicate(i) == true    
    static binarySearch(array, pred, entity){
        let lo = -1, hi = array.length;
        while (1 + lo < hi) {
            const mi = lo + ((hi - lo) >> 1);
            if (pred(entity,array[mi])) {
                hi = mi;
            } else {
                lo = mi;
            }
        }
        return hi;
    }
    //predicate for finding object idx that overlaps entity LHS
    static lowerBound (entity,other){
        const ecs = Fes.data.ecs;
        const entityX = ecs.components.position.x[entity];
        const entityW = ecs.components.size.width[entity];
        const entityLeft = entityX - entityW/2;
        const otherX = ecs.components.position.x[other];
        const otherW = ecs.components.size.width[other];
        const otherRight = otherX + otherW/2;
        return entityLeft<otherRight;
    }
    //predicate for finding object idx that overlaps entity RHS
    static upperBound (entity,other){
        const ecs = Fes.data.ecs;
        const entityX = ecs.components.position.x[entity];
        const entityW = ecs.components.size.width[entity];
        const entityRight = entityX + entityW/2;
        const otherX = ecs.components.position.x[other];
        const otherW = ecs.components.size.width[other];
        const otherRight = otherX + otherW/2;
        return entityRight<otherRight;
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