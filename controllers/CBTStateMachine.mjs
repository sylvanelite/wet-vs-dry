
import { defineSystem,types } from "../ecs.js";
import { Knockback } from "./knockback.mjs";
import DataRedhood  from "../assets/characters/data-redhood.mjs";
import  DataWarrior from "../assets/characters/data-warrior.mjs";

class CBTStateMachine{
    static STATES ={
        IDLE:0,
        ATTACK:1,
        FREEFALL:2,
        HIT:3,
        HANG:4,
        DODGE:5
    }
    static FACING={
        LEFT:0,
        RIGHT:1
    }
    static ANIMATIONS={
        IDLE:0,
        ATTACK_NEUTRAL:1,
        ATTACK_SIDE:2,
        ATTACK_UP:3,
        ATTACK_DOWN:4,
        SPECIAL_NEUTRAL:5,
        SPECIAL_SIDE:6,
        SPECIAL_UP:7,
        SPECIAL_down:8,
        DODGE:9,
        HIT:10,
        RUN:11,
        JUMP:12,
        IN_AIR_UP:13,
        IN_AIR_DOWN:14
    }
    static FRAME_RATE=0.3;
    static defineComponents(){
        //console.log(DataRedhood);//TODO: use this to get animation/frame data
        Fes.data.ecs.defineComponent("cbtState",{
            currentState:types.int8,
            animationProgress:types.float32,
            animation:types.int32,
            facing:types.int8,
            percent:types.float32,
            
            UP:types.int8,
            LEFT:types.int8,
            RIGHT:types.int8,
            DOWN:types.int8,
            ATTACK:types.int8,
            SPECIAL:types.int8
            //DODOGE?
        });
    }
    static defineSystems(ecs,s){
        //give each platformer the ability to also be a cbt object
        const query = ecs.createQuery("cbtState");
        const queryLc = ecs.createQuery("controlSourceLocal");
        const queryNetwork = ecs.createQuery("controlSourceNetwork");
        const system = defineSystem(query, CBTStateMachine.updateCBT);
        const systemLc = defineSystem(queryLc, CBTStateMachine.updateLocalControls);
        const systemNetwork = defineSystem(queryNetwork, CBTStateMachine.updateLocalControls);
        s.push(system);
        s.push(systemLc);
        s.push(systemNetwork);
    }
    static addToEntity(entity){
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity,"cbtState");
        ecs.components.cbtState.currentState[entity] = CBTStateMachine.STATES.IDLE;
        ecs.components.cbtState.animationProgress[entity] = 0;
        ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.IDLE;
        ecs.components.cbtState.facing[entity] = CBTStateMachine.FACING.LEFT;
        ecs.components.cbtState.percent[entity] = 0;
        ecs.components.cbtState.UP[entity] = false;
        ecs.components.cbtState.DOWN[entity] = false;
        ecs.components.cbtState.LEFT[entity] = false;
        ecs.components.cbtState.RIGHT[entity] = false;
        ecs.components.cbtState.ATTACK[entity] = false;
        ecs.components.cbtState.SPECIAL[entity] = false;
    }
    static updateLocalControls(entity){
        const ecs = Fes.data.ecs;
        const controls = Fes.engine.getControls(entity);
        ecs.components.cbtState.UP[entity] = controls.Up;
        ecs.components.cbtState.DOWN[entity] = controls.Down;
        ecs.components.cbtState.LEFT[entity] = controls.Left;
        ecs.components.cbtState.RIGHT[entity] = controls.Right;
        ecs.components.cbtState.ATTACK[entity] = controls.Mouse_Left;
        ecs.components.cbtState.SPECIAL[entity] = controls.Mouse_Right;
    }

    static updateCBT(controls){
        const ecs = Fes.data.ecs;
        if(ecs.components.cbtState.currentState[entity]!=CBTStateMachine.STATES.IDLE){
            //TODO: null out movement (needs to happen on platformer object? that call engine's controls directly?)
            //TODO: L/R in freefall?.
            //this.controls.Up_Pressed = false;
            //this.controls.Up_Released = false;
            //this.controls.Left = false;
            //this.controls.Right = false;
        }
        //update the current state//TODO: confirm no overflow
        ecs.components.cbtState.animationProgress[entity]+=CBTStateMachine.FRAME_RATE;
        //check for state change
        switch(ecs.components.cbtState.currentState){
            case CBTStateMachine.STATES.IDLE:
                CBTStateMachine.updateIdle(entity);
                break;
            case CBTStateMachine.STATES.ATTACK:
                CBTStateMachine.updateAttack(entity);
                break;
            case CBTStateMachine.STATES.FREEFALL:
                CBTStateMachine.updateFreefall(entity);
                break;
            case CBTStateMachine.STATES.HANG:
                CBTStateMachine.updateHang(entity);
                break;
            case CBTStateMachine.STATES.DODGE:
                CBTStateMachine.updateDodge(entity);
                break;
            case CBTStateMachine.STATES.HIT:
                CBTStateMachine.updateHit(entity);
                break;
            default:
                console.log("unknown state:"+CBTStateMachine.currentState);
                break;
        }
    }
    static changeState(entity,newState){
        const ecs = Fes.data.ecs;
        // do transition logic before updating "currentState"
        // this makes the transition know which state it came from
        switch(newState){
            case CBTStateMachine.STATES.IDLE:
                break;
            case CBTStateMachine.STATES.ATTACK:
                CBTStateMachine.transitionAttack(entity);
                break;
            case CBTStateMachine.STATES.FREEFALL:
                break;
            case CBTStateMachine.STATES.HANG:
                break;
            case CBTStateMachine.STATES.DODGE:
                CBTStateMachine.transitionDodge(entity);
                break;
            case CBTStateMachine.STATES.HIT:
                CBTStateMachine.transitionHit(entity);
                break;
            default:
                console.log("unknown state transition:"+newState);
                break;
        }
        ecs.components.cbtState.currentState[entity] = newState;
        //TODO: any state transition logic
        //TODO: ALL STATES: if collision hit->hit (except dodge)
        console.log("changing state to: ",newState);
    }
    static updateIdle(entity){
        const ecs = Fes.data.ecs;
        //idle can update facing if on ground
        if(ecs.components.platformer.grounded[entity]){//TODO: set facing rules in other states? hang? dodge?
            if(ecs.components.cbtState.LEFT[entity]){
                ecs.components.cbtState.facing[entity] = CBTStateMachine.FACING.LEFT;
            }
            if(ecs.components.cbtState.RIGHT[entity]){
                ecs.components.cbtState.facing[entity] = CBTStateMachine.FACING.RIGHT;
            }
        }
        //update animations
        if(ecs.components.platformer.grounded[entity]){
            //grounded
            if( Math.abs(ecs.components.platformer.current_h_speed[entity])<0.5){
                if(ecs.components.cbtState.animation[entity] != CBTStateMachine.ANIMATIONS.IDLE){
                    ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.IDLE;
                    ecs.components.cbtState.animationProgress[entity] = 0;
                }
            }else{
                if(ecs.components.cbtState.animation[entity] != CBTStateMachine.ANIMATIONS.RUN){
                    ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.RUN;
                    ecs.components.cbtState.animationProgress[entity] = 0;
                }
            }
        }else{
            //just did a jump
            if(ecs.components.platformer.grounded.did_jump[entity]){
                ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.JUMP;
                ecs.components.cbtState.animationProgress[entity] = 0;
            }
            //if jump anim is done
            if(ecs.components.cbtState.animation[entity] != CBTStateMachine.ANIMATIONS.JUMP || 
                (ecs.components.cbtState.animation[entity] == CBTStateMachine.ANIMATIONS.JUMP &&
                    CBTStateMachine.animationIsOver(entity))){
                    //going up in air
                    if(ecs.components.cbtState.animation[entity] != CBTStateMachine.ANIMATIONS.IN_AIR_UP && 
                        ecs.components.platformer.grounded.current_v_speed[entity]<0){
                        ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.IN_AIR_UP;
                        ecs.components.cbtState.animationProgress[entity] = 0;
                    }
                    //going down in air
                    if(ecs.components.cbtState.animation[entity] != CBTStateMachine.ANIMATIONS.IN_AIR_DOWN && 
                        ecs.components.platformer.grounded.current_v_speed[entity]>0){
                        ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.IN_AIR_DOWN;
                        ecs.components.cbtState.animationProgress[entity] = 0;
                    }

                }
        }
        if(CBTStateMachine.animationIsOver(entity)){
            ecs.components.cbtState.animationProgress[entity] = 0;
        }
        //if press atk -> atk
        if(ecs.components.cbtState.ATTACK[entity] || ecs.components.cbtState.SPECIAL[entity]){
            CBTStateMachine.changeState(entity,CBTStateMachine.STATES.ATTACK);
            return;
        }
        //if dodge & able -> dodge
        /*
        //TODO: dodge button: ecs.components.cbtState.DODGE[entity] ??
        if(this.controls.Dodge_Pressed){//TODO:should dodge be on release?
            CBTStateMachine.changeState(entity,CBTStateMachine.STATES.DODGE);
            return;
        }
        */
    }
    static updateAttack(entity){
        const ecs = Fes.data.ecs;
        //if anim was freefall -> freefall
        //if anim over -> idle
        if(CBTStateMachine.animationIsOver(entity)){
            CBTStateMachine.changeState(entity,CBTStateMachine.STATES.IDLE);
        }
    }
    static updateFreefall(entity){
        const ecs = Fes.data.ecs;
        //if hit ground -> idle 
        if(ecs.components.platformer.grounded[entity]){
            CBTStateMachine.changeState(entity,CBTStateMachine.STATES.IDLE);
        }
    }
    static updateHang(entity){
        const ecs = Fes.data.ecs;
        //should this wait for a button first?
        //if anim over -> idle
        if(CBTStateMachine.animationIsOver(entity)){
            CBTStateMachine.changeState(entity,CBTStateMachine.STATES.IDLE);
        }
    }
    static updateDodge(entity){
        const ecs = Fes.data.ecs;
        //if anim over -> idle
        if(CBTStateMachine.animationIsOver(entity)){
            CBTStateMachine.changeState(entity,CBTStateMachine.STATES.IDLE);
        }
    }
    static updateHit(entity){
        const ecs = Fes.data.ecs;
        //if stun over -> idle
        if(!Knockback.isInHitstun(entity)){
            CBTStateMachine.changeState(entity,CBTStateMachine.STATES.IDLE);
            return;
        }
        //freeze the hit animation at the last frame 
        let frame = CBTStateMachine.getCurrentAnimationFrame(entity);
        if(!frame&&
            ecs.components.cbtState.animationProgress[entity]>10){//TODO: this.owner.character.animations.hit.length)
            ecs.components.cbtState.animationProgress[entity] = 10;//TODO: this.owner.character.animations.hit.length-1;
        }
    }

    static animationIsOver(entity){
        const ecs = Fes.data.ecs;
        let frame = CBTStateMachine.getCurrentAnimationFrame(entity);
        if(!frame){
            return true;
        }
        return ecs.components.cbtState.animationProgress[entity]>=frame.length;
    }
    static getAtkDirection(entity){
        const ecs = Fes.data.ecs;
        let atk = "NEUTRAL";
        //TODO: check precidence on multi-button presses
        //for now assumes L/R most common buttons to press during movement
        //down least common, so most authoritative on atk
        if(ecs.components.cbtState.LEFT[entity]||ecs.components.cbtState.RIGHT[entity]){
            atk = "SIDE"
        }
        if(ecs.components.cbtState.UP[entity]){
            atk = "UP";
        }
        if(ecs.components.cbtState.DOWN[entity]){
            atk = "DOWN"
        }
        return atk;
    }
    static getAnimation(entity){
        const ecs = Fes.data.ecs;
        return 0;//TODO: this.owner.character.animations[this.animation];
    }
    static getCurrentAnimationFrame(entity){
        const ecs = Fes.data.ecs;
        let anim = CBTStateMachine.getAnimation(entity);
        if(anim){
            let frame =  Math.floor(ecs.components.cbtState.animationProgress[entity]);
            return anim[frame];
        }
        return null;
    }
    static takeHit(entity,hitbox,facing){
        const ecs = Fes.data.ecs;
        CBTStateMachine.changeState(entity,CBTStateMachine.STATES.HIT);
        let angle = hitbox.angle;
        if(facing == this.FACING.RIGHT){//note: "facing" is the attacker, "takeHit" is the attackee
            //https://stackoverflow.com/questions/3203952/mirroring-an-angle
            //https://stackoverflow.com/questions/3044441/how-to-reflect-an-angle-across-the-y-axis
            //flip angle based on facing
            angle=180-angle;
        }
        Knockback.setKnockback(entity,ecs.components.cbtState.percent[entity],
            hitbox.damage,angle,hitbox.baseKnockback,hitbox.scaling);
        ecs.components.cbtState.percent[entity]+=hitbox.damage;
    }
    static checkHitboxes(entity){
        const ecs = Fes.data.ecs;
        let frame = CBTStateMachine.getCurrentAnimationFrame(entity);
        if(!frame){
            return;
        }
        let facing =1;
        if(ecs.components.cbtState.facing[entity] == CBTStateMachine.FACING.RIGHT){
            facing=-1;
        }
        //https://stackoverflow.com/questions/21089959/detecting-collision-of-rectangle-with-circle
        //TODO: here
        /*
        for(const [idx,hitbox] of frame.hitboxes.entries()){
            let bounds = this.owner.getBounds();
            let hbx = bounds.x+(facing*(hitbox.x-frame.anchorX));
            let hby = bounds.y+hitbox.y-frame.anchorY;
            let rectCircleCollision=function (circle,rect){
                let distX = Math.abs(circle.x - rect.x-rect.w/2);
                let distY = Math.abs(circle.y - rect.y-rect.h/2);
                if (distX > (rect.w/2 + circle.r)) { return false; }
                if (distY > (rect.h/2 + circle.r)) { return false; }
                if (distX <= (rect.w/2)) { return true; } 
                if (distY <= (rect.h/2)) { return true; }
                let dx=distX-rect.w/2;
                let dy=distY-rect.h/2;
                return (dx*dx+dy*dy<=(circle.r*circle.r));
            }
            for(let i=0;i<Fes.engine.objects.length;i+=1){
                let obj = Fes.engine.objects[i];
                if(obj.name=="player" && obj.id != this.owner.id){
                    let c = {
                        x:hbx,
                        y:hby,
                        r:hitbox.size
                    };
                    let r = obj.getBounds();
                    if(rectCircleCollision(c,r)){
                        obj.stateMachine.takeHit(hitbox,this.facing);
                    }
                }
            }
        }
        */
    }

    static transitionAttack(entity){
        const ecs = Fes.data.ecs;
        let atk = CBTStateMachine.getAtkDirection(entity);
        let atkStr = "ATTACK_"+atk;
        if(ecs.components.cbtState.ATTACK[entity]){
            atkStr = "ATTACK_"+atk;
        }
        if(ecs.components.cbtState.SPECIAL[entity]){
            atkStr = "SPECIAL_"+atk;
        }
        ecs.components.cbtState.animationProgress[entity] = 0;
        ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS[atkStr];
    }
    static transitionDodge(entity){
        const ecs = Fes.data.ecs;
        //TODO: directional movement based on innitial press?
        ecs.components.cbtState.animationProgress[entity] = 0;
        ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.DODGE;
    }
    static transitionHit(entity){
        const ecs = Fes.data.ecs;
        //TODO: hit calculation
        ecs.components.cbtState.animationProgress[entity] = 0;
        ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.HIT;
    }
}


export { CBTStateMachine };