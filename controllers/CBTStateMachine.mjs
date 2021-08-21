
import { defineSystem,types } from "../ecs.js";
import { Knockback } from "./knockback.mjs";
import { Collision } from "./collision.mjs";
import { Judge } from "../interactable/judge/judge.mjs";
import DataRedhood  from "../assets/characters/ch_greenhood.mjs";
import DataWarrior from "../assets/characters/ch_warrior.mjs";
import DataBattlemage from "../assets/characters/ch_battlemage.mjs";

class CBTStateMachine{
    static ANIMATION_SCALE = 0.7;
    static ANIMATION_DATA = {
        REDHOOD:0,
        WARRIOR:1,
        BATTLEMAGE:2
    };
    static imageCache = {};
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
    static FRAME_RATE=0.2;
    static defineComponents(){
        Fes.data.ecs.defineComponent("cbtState",{
            currentState:types.int8,
            animationProgress:types.float32,//which frame the current animation is on
            animation:types.int32,          //which animation is currently running
            animationData:types.int8,       //id of the object that holds all of animations
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
    static defineRenderSystems(ecs,s){
        const query = ecs.createQuery("cbtState");
        const system = defineSystem(query, CBTStateMachine.render);
        s.push(system);
    }
    static addToEntity(entity){
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity,"cbtState");
        ecs.components.cbtState.currentState[entity] = CBTStateMachine.STATES.IDLE;
        ecs.components.cbtState.animationProgress[entity] = 0;
        ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.IDLE;
        ecs.components.cbtState.animationData[entity] = CBTStateMachine.ANIMATION_DATA.REDHOOD;
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

    static updateCBT(entity){
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
        switch(ecs.components.cbtState.currentState[entity]){
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
                console.log("unknown state:"+ecs.components.cbtState.currentState[entity]);
                break;
        }
        CBTStateMachine.checkHitboxes(entity);
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
        //console.log("changing state to: ",newState);
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
            if(ecs.components.platformer.did_jump[entity]){
                ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.JUMP;
                ecs.components.cbtState.animationProgress[entity] = 0;
            }
            //if jump anim is done
            if(ecs.components.cbtState.animation[entity] != CBTStateMachine.ANIMATIONS.JUMP || 
                (ecs.components.cbtState.animation[entity] == CBTStateMachine.ANIMATIONS.JUMP &&
                    CBTStateMachine.animationIsOver(entity))){
                    //going up in air
                    if(ecs.components.cbtState.animation[entity] != CBTStateMachine.ANIMATIONS.IN_AIR_UP && 
                        ecs.components.platformer.current_v_speed[entity]<0){
                        ecs.components.cbtState.animation[entity] = CBTStateMachine.ANIMATIONS.IN_AIR_UP;
                        ecs.components.cbtState.animationProgress[entity] = 0;
                    }
                    //going down in air
                    if(ecs.components.cbtState.animation[entity] != CBTStateMachine.ANIMATIONS.IN_AIR_DOWN && 
                        ecs.components.platformer.current_v_speed[entity]>0){
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
        let animation = CBTStateMachine.getAnimation(entity);
        if(animation){
            if(!frame&&
                ecs.components.cbtState.animationProgress[entity] > animation.length){
                ecs.components.cbtState.animationProgress[entity] = animation.length-1;
            }
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
    static getAnimationData(entity){
        const ecs = Fes.data.ecs;
        switch(ecs.components.cbtState.animationData[entity]){
            case CBTStateMachine.ANIMATION_DATA.REDHOOD:
                return DataRedhood;
            case CBTStateMachine.ANIMATION_DATA.WARRIOR:
                return DataWarrior;
            case CBTStateMachine.ANIMATION_DATA.BATTLEMAGE:
                return DataBattlemage;
        } 
        return DataRedhood;
    }
    static getAnimation(entity){
        const ecs = Fes.data.ecs;
        const animationData = CBTStateMachine.getAnimationData(entity);
        let curAnimationName = "idle";
        //map the entity value from an int to a key in the json data
        switch(ecs.components.cbtState.animation[entity]){
            case CBTStateMachine.ANIMATIONS.IDLE:
                curAnimationName = "idle";
                break;
            case CBTStateMachine.ANIMATIONS.ATTACK_NEUTRAL:
                curAnimationName = "attack_neutral";
                break;
            case CBTStateMachine.ANIMATIONS.ATTACK_SIDE:
                curAnimationName = "attack_side";
                break;
            case CBTStateMachine.ANIMATIONS.ATTACK_UP:
                curAnimationName = "attack_up";
                break;
            case CBTStateMachine.ANIMATIONS.ATTACK_DOWN:
                curAnimationName = "attack_down";
                break;
            case CBTStateMachine.ANIMATIONS.SPECIAL_NEUTRAL:
                curAnimationName = "special_neutral";
                break;
            case CBTStateMachine.ANIMATIONS.SPECIAL_SIDE:
                curAnimationName = "special_side";
                break;
            case CBTStateMachine.ANIMATIONS.SPECIAL_UP:
                curAnimationName = "special_up";
                break;
            case CBTStateMachine.ANIMATIONS.SPECIAL_DOWN:
                curAnimationName = "special_down";
                break;
            case CBTStateMachine.ANIMATIONS.DODGE:
                curAnimationName = "dodge";
                break;
            case CBTStateMachine.ANIMATIONS.HIT:
                curAnimationName = "hit";
                break;
            case CBTStateMachine.ANIMATIONS.RUN:
                curAnimationName = "run";
                break;
            case CBTStateMachine.ANIMATIONS.JUMP:
                curAnimationName = "jump";
                break;
            case CBTStateMachine.ANIMATIONS.IN_AIR_UP:
                curAnimationName = "in_air_up";
                break;
            case CBTStateMachine.ANIMATIONS.IN_AIR_DOWN:
                curAnimationName = "in_air_down";
                break;
            default:
                console.log("unknown animation: ",ecs.components.cbtState.animation[entity])
        }
        return animationData.animations[curAnimationName];
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
        if(facing == CBTStateMachine.FACING.RIGHT){//note: "facing" is the attacker, "takeHit" is the attackee
            //https://stackoverflow.com/questions/3203952/mirroring-an-angle
            //https://stackoverflow.com/questions/3044441/how-to-reflect-an-angle-across-the-y-axis
            //flip angle based on facing
            angle=180-angle;
        }
        Knockback.setKnockback(entity,ecs.components.cbtState.percent[entity],
            hitbox.damage,angle,hitbox.baseKnockback,hitbox.scaling);
        ecs.components.cbtState.percent[entity]+=hitbox.damage;
    }
    static getBounds(entity){
        const ecs = Fes.data.ecs;
        const bounds = {
            x:ecs.components.position.x[entity]-ecs.components.size.width[entity]/2,
            y:ecs.components.position.y[entity]-ecs.components.size.height[entity],
            width:ecs.components.size.width[entity],
            height:ecs.components.size.height[entity]
        };
        return bounds;
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
        const bounds = CBTStateMachine.getBounds(entity);
        const query = ecs.createQuery("player");
        const queryJudge = ecs.createQuery("judge");
        for(const [idx,hitbox] of frame.hitboxes.entries()){
            let hbx = bounds.x+(facing*(hitbox.x*CBTStateMachine.ANIMATION_SCALE-frame.anchorX*CBTStateMachine.ANIMATION_SCALE));
            let hby = bounds.y+hitbox.y*CBTStateMachine.ANIMATION_SCALE-frame.anchorY*CBTStateMachine.ANIMATION_SCALE;
            for(let archetype of query.archetypes) {
                for(let playerEntity of archetype.entities) {
                    if(playerEntity != entity){
                        const c = {
                            x:hbx,
                            y:hby,
                            r:hitbox.size*CBTStateMachine.ANIMATION_SCALE
                        };
                        const r = CBTStateMachine.getBounds(playerEntity);
                        const collision = Collision.rectCircleCollision(c,r);
                        if(collision){
                            CBTStateMachine.takeHit(playerEntity,hitbox,ecs.components.cbtState.facing[entity]);
                        }
                    }
                }
            }
            //TODO: is there a more modular way to interact with hitboxes?
            for(let archetype of queryJudge.archetypes) {
                for(let judgeEntity of archetype.entities) {
                    const c = {
                        x:hbx,
                        y:hby,
                        r:hitbox.size*CBTStateMachine.ANIMATION_SCALE
                    };
                    const r = CBTStateMachine.getBounds(judgeEntity);
                    const collision = Collision.rectCircleCollision(c,r);
                    if(collision){
                        Judge.takeHit(judgeEntity,entity,hitbox);
                    }
                }
            }

        }
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

    //rendering methods
    static getImgData(entity){
        const ecs = Fes.data.ecs;
        const animation = CBTStateMachine.getAnimationData(entity);//the animation object
        //use the id of the animation data to store the img in the cache
        const animationDataIdx = ecs.components.cbtState.animationData[entity];
        if(!animation.sprite_sheet){
            return null;
        }
        if(CBTStateMachine.imageCache[animationDataIdx] == null){
            //start loading
            let img = new Image();
            CBTStateMachine.imageCache[animationDataIdx] = {
                image:img,
                isLoaded:false
            };
            img.onload = function(){
                CBTStateMachine.imageCache[animationDataIdx].isLoaded = true;
            };
            img.src = animation.sprite_sheet;
        }
        if(CBTStateMachine.imageCache[animationDataIdx].isLoaded){
            return CBTStateMachine.imageCache[animationDataIdx].image;
        }
    }
    static drawHitboxes(ctx,frame,startX,startY){
        for (const [idx, hitbox] of frame.hitboxes.entries()) {
            ctx.strokeStyle = "1px solid white";
            ctx.beginPath();
            ctx.arc(startX+hitbox.x*CBTStateMachine.ANIMATION_SCALE+0.5, 
                    startY+hitbox.y*CBTStateMachine.ANIMATION_SCALE+0.5, 
                    hitbox.size*CBTStateMachine.ANIMATION_SCALE,0, 2 * Math.PI);
            ctx.stroke();
            let angleRad = hitbox.angle *0.0174533;
            ctx.beginPath();
            ctx.moveTo(startX+hitbox.x*CBTStateMachine.ANIMATION_SCALE+0.5, 
                       startY+hitbox.y*CBTStateMachine.ANIMATION_SCALE+0.5);
            ctx.lineTo(startX+hitbox.x*CBTStateMachine.ANIMATION_SCALE+0.5 + hitbox.size*CBTStateMachine.ANIMATION_SCALE*Math.cos(angleRad), 
                       startY+hitbox.y*CBTStateMachine.ANIMATION_SCALE+0.5 + hitbox.size*CBTStateMachine.ANIMATION_SCALE*Math.sin(angleRad));   
            ctx.stroke();
        }
    }
    static render(entity) {
        const ecs = Fes.data.ecs;
        const bounds = CBTStateMachine.getBounds(entity);
        const floorX = Math.floor(bounds.x);
        const floorY = Math.floor(bounds.y);
        const ctx = Fes.R.varCtx;
        const frame = CBTStateMachine.getCurrentAnimationFrame(entity);
        if(frame){
            const img = CBTStateMachine.getImgData(entity);
            if(img){
                Fes.R.varCtx.imageSmoothingEnabled = true;
                const px = floorX- Fes.R.screenX;
                const py = floorY- Fes.R.screenY;
                ctx.save();
                ctx.translate(Math.floor(px), Math.floor(py));
                if(ecs.components.cbtState.facing[entity] == CBTStateMachine.FACING.RIGHT){
                    ctx.scale(-1, 1);
                }
                ctx.drawImage(img,
                    Math.floor(frame.x),
                    Math.floor(frame.y),
                    Math.floor(frame.width),
                    Math.floor(frame.height),
                    Math.floor(-frame.anchorX*CBTStateMachine.ANIMATION_SCALE),
                    Math.floor(-frame.anchorY*CBTStateMachine.ANIMATION_SCALE),
                    Math.floor(frame.width*CBTStateMachine.ANIMATION_SCALE),
                    Math.floor(frame.height*CBTStateMachine.ANIMATION_SCALE));
                //only render this while debugging:
                CBTStateMachine.drawHitboxes(ctx,frame,-frame.anchorX*CBTStateMachine.ANIMATION_SCALE,-frame.anchorY*CBTStateMachine.ANIMATION_SCALE);
                ctx.restore();
                Fes.R.varCtx.imageSmoothingEnabled = false;
            }
        }
    }
}


export { CBTStateMachine };