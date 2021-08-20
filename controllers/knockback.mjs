import { defineSystem,types } from "../ecs.js";
import { Map } from "../map.mjs";

class Knockback {
    static friction = 0.95;
    static minMagnitude = 5;
    static bonusGravityGrowth = 0.5;
    static maxBonusGravity = 5;
    static maxKnockback = 100;
    static defineComponents(){
        Fes.data.ecs.defineComponent("knockback",{
            kbMagnitude:types.float32,
            kbAngle:types.float32,
            kbStunFrames:types.int32,
            bonusGravity: types.float32
        });
    }
    static defineSystems(ecs,s){
        //give each platformer the ability to also be a cbt object
        const query = ecs.createQuery("knockback");
        const system = defineSystem(query, Knockback.update);
        s.push(system);
    }
    static addToEntity(entity){
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity,"knockback");
        ecs.components.knockback.kbMagnitude[entity] = 0;
        ecs.components.knockback.kbAngle[entity] = 0;
        ecs.components.knockback.kbStunFrames[entity] = 0;
        ecs.components.knockback.bonusGravity[entity] = 0;
    }

    static setKnockback(entity,percent,damage,angle,baseKnockback,scaling){
        const ecs = Fes.data.ecs;
        let weight = 100;//TODO: pass in weight?
        let gravity = 1;
        //TODO: tweak formlua, esp magic numbers
        let knockback =  ((percent/10 + (percent * damage)/20) * 
                         (200/(weight+100)) +  
                         scaling + 
                         baseKnockback ) / 
                         (gravity - 0.075 * 5);
        if(knockback>Knockback.maxKnockback){
            knockback = Knockback.maxKnockback;
        }
        let stun = Math.floor(knockback*0.5);
        let angleRad = angle*0.0174533;
        ecs.components.knockback.kbMagnitude[entity] = knockback*0.1;
        ecs.components.knockback.kbAngle[entity] = angleRad;
        ecs.components.knockback.kbStunFrames[entity] = stun;
        ecs.components.knockback.bonusGravity[entity] = 0;
    }
    static isInHitstun(entity){
        const ecs = Fes.data.ecs;
        if(ecs.components.knockback.kbStunFrames[entity]>0){
            return true;
        }
        return false;
    }
    static update(entity){
        const ecs = Fes.data.ecs;
        //update hitstun frames 
        if(ecs.components.knockback.kbStunFrames[entity]>0){
            ecs.components.knockback.kbStunFrames[entity]-=1;
        }
        //no damage done, do nothing
        if(ecs.components.knockback.kbMagnitude[entity]<Knockback.minMagnitude){
            ecs.components.knockback.kbStunFrames[entity] = 0;
            return;
        }
        //apply friction
        ecs.components.knockback.kbMagnitude[entity] *= Knockback.friction;

        //compute H and V components of magnitude
        let hOff = Math.cos(ecs.components.knockback.kbAngle[entity])*ecs.components.knockback.kbMagnitude[entity];
        let vOff = Math.sin(ecs.components.knockback.kbAngle[entity])*ecs.components.knockback.kbMagnitude[entity];

        //apply bonus gravity for this trajectory
        //Note: this is a straight-line trajectory. platform movement will apply gravity.
        ecs.components.knockback.bonusGravity[entity] += Knockback.bonusGravityGrowth;
        if(ecs.components.knockback.bonusGravity[entity]>Knockback.maxBonusGravity){
            ecs.components.knockback.bonusGravity[entity] = Knockback.maxBonusGravity;
        }
        vOff += ecs.components.knockback.bonusGravity[entity];

        //check for wall bounces
        Knockback.checkBounce(entity,
                ecs.components.position.x[entity],
                ecs.components.position.y[entity],
                hOff,vOff);
        //update offsets based on bounce result
        hOff = Math.cos(ecs.components.knockback.kbAngle[entity])*ecs.components.knockback.kbMagnitude[entity];
        vOff = Math.sin(ecs.components.knockback.kbAngle[entity])*ecs.components.knockback.kbMagnitude[entity];

        //move the player
        Map.move_contact_solid(entity, 
            ecs.components.position.x[entity]+hOff,
            ecs.components.position.y[entity]+vOff);

    }
    static checkBounce(entity, x, y, hOff, vOff) {
        const ecs = Fes.data.ecs;
        const collisionCheck = Map.tileLineCollisiion(x, y, x + hOff, y + vOff);
        if (collisionCheck) {
            //horizontal bounce
            if(collisionCheck == Map.COLLISION_KIND.LEFT||
               collisionCheck == Map.COLLISION_KIND.RIGHT){
                ecs.components.knockback.kbAngle[entity] = Math.PI - ecs.components.knockback.kbAngle[entity]; //math.pi = 180 radians
            }
            //vertical bounce
            if(collisionCheck == Map.COLLISION_KIND.TOP||
               collisionCheck == Map.COLLISION_KIND.BOTTOM){
                ecs.components.knockback.kbAngle[entity] = 2*Math.PI - ecs.components.knockback.kbAngle[entity]; //math.pi = 180 radians                
            }
            if(collisionCheck == Map.COLLISION_KIND.INSIDE){
                //should not get here, but stop moving
                ecs.components.knockback.kbMagnitude[entity] = 0;
            }
        }
    }

}



export { Knockback };