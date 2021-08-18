import { Map } from "../map.mjs"; 
import { types, defineSystem } from "../ecs.js";
import { Knockback } from "./knockback.mjs";

//https://github.com/DavidStrachan/GM-Perfect-Platforming-Paragon
//maybe also: https://2dengine.com/?p=platformers
class Platformer {
    static defineComponents(){
        Fes.data.ecs.defineComponent("platformer",{
            max_walk_speed:types.float64,
            max_fall_speed:types.float64,
            walk_acceleration:types.float64,
            walk_decceleration:types.float64,
            jump_speed:types.float64,
            current_h_speed:types.float64,
            current_v_speed:types.float64,
            gravity:types.float64,
            gravity_min:types.float64,
            gravity_max:types.float64,
            grounded:types.int8,
            move_to_x:types.float64,
            move_to_y:types.float64,
            did_jump:types.int8,
            max_air_jumps:types.int32,
            air_jump_count:types.int32,
            grounded_frames_ago:types.int32,
            landed_frames_ago:types.int32,
            UP_frames_ago:types.int32,
            xmoveamount:types.float64,
            ymoveamount:types.float64,
            UP:types.int8,
            LEFT:types.int8,
            RIGHT:types.int8,
        });
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("platformer");
        const queryLc = ecs.createQuery("controlSourceLocal");
        const queryNetwork = ecs.createQuery("controlSourceNetwork");
        //controlSourceAI is also defined in the AI object
        const system = defineSystem(query, Platformer.updatePlatformMovement);
        const systemLc = defineSystem(queryLc, Platformer.updateLocalControls);
        const systemNetwork = defineSystem(queryNetwork, Platformer.updateLocalControls);
        s.push(system);
        s.push(systemLc);
        s.push(systemNetwork);
    }
    static addToEntity(entity){
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity,"platformer");
        ecs.components.platformer.max_walk_speed[entity] = 2;
        ecs.components.platformer.max_fall_speed[entity] = 5;
        ecs.components.platformer.walk_acceleration[entity] = 2; // when holding button how fast to get to max speed
        ecs.components.platformer.walk_decceleration[entity] = 0.1; // when no button is held how fast to get to 0
        ecs.components.platformer.jump_speed[entity] = 8;
        ecs.components.platformer.current_h_speed[entity] = 0; // how fast the player would like to move 
        ecs.components.platformer.current_v_speed[entity] = 0;
        ecs.components.platformer.gravity_min[entity] = 0.1;
        ecs.components.platformer.gravity_max[entity] = 0.5;
        ecs.components.platformer.gravity[entity] = ecs.components.platformer.gravity_max[entity];
        ecs.components.platformer.grounded[entity] = false;

        ecs.components.platformer.move_to_x[entity] = ecs.components.position.x[entity];
        ecs.components.platformer.move_to_y[entity] = ecs.components.position.y[entity];
        // helper vars
        ecs.components.platformer.did_jump[entity] = false;
        ecs.components.platformer.max_air_jumps[entity] = 1;//number of double jumps
        ecs.components.platformer.air_jump_count[entity] = ecs.components.platformer.max_air_jumps[entity];
        ecs.components.platformer.grounded_frames_ago[entity] = 999;//cyote time
        ecs.components.platformer.landed_frames_ago[entity] = 999;  //sticky feet
        ecs.components.platformer.UP_frames_ago[entity] = 999;      //jump buffering
        ecs.components.platformer.xmoveamount[entity] = 0;
        ecs.components.platformer.ymoveamount[entity] = 0;
        ecs.components.platformer.LEFT[entity] = false;
        ecs.components.platformer.RIGHT[entity] = false;
    }
    static helper ={
        anti_gravity_apex: true,
        jump_buffering: true,
        sticky_feet: true,
        speedy_apex: true,
        coyote_jump: true,
        max_fall_speed: true,
        catch_missed_jump: true,
        double_jump: true,
        reverse: true,
    };


    //-- static logic here
    static clamp(num, min, max) {
        return num <= min ? min : num >= max ? max : num;
    }
    static jump(entity) {
        const ecs = Fes.data.ecs;
        if(!ecs.components.platformer.grounded[entity]&&!Platformer.isCyoteJump(entity)){
            ecs.components.platformer.air_jump_count[entity]-=1;
        }
        ecs.components.platformer.current_v_speed[entity] = -(ecs.components.platformer.jump_speed[entity]);
        ecs.components.platformer.did_jump[entity] = true;
    }

    static canJump(entity){
        const ecs = Fes.data.ecs;
        //check regular jump
        if (ecs.components.platformer.grounded[entity]) {
            return true;
        }
        if(Platformer.isCyoteJump(entity)){
            return true;
        }
        //check double jump
        if (Platformer.helper.double_jump){
            if(!ecs.components.platformer.grounded[entity] &&  ecs.components.platformer.air_jump_count[entity]>0) {
                return true;
            }
        }
        return false;
    }

    static isAtApex(entity){
        const ecs = Fes.data.ecs;
        if (!ecs.components.platformer.grounded[entity]) {
             // if they are going slower than this && in the air we call this the apex
            if (Math.abs( ecs.components.platformer.current_v_speed[entity]) < 6) {
                return true;
            }
        }
        return false;
    }

    static isCyoteJump(entity){
        const ecs = Fes.data.ecs;
        if(Platformer.helper.coyote_jump &&  
            ecs.components.platformer.grounded_frames_ago[entity] < 8 &&  !ecs.components.platformer.grounded[entity]){
            return true;
        }
        return false;
    }

    static updateCoyoteJump(entity){
        const ecs = Fes.data.ecs;
        // count how long I've been in air
        if( ecs.components.platformer.grounded[entity]){
            ecs.components.platformer.grounded_frames_ago[entity] = 0;
        }
        ecs.components.platformer.grounded_frames_ago[entity] += 1; 
    }

    static updateHelperAntiGravApex(entity){
        const ecs = Fes.data.ecs;
        // reduce grav near apex so that reversing direction near top of jump 
        // makes it more likely to get a platform just in range
        // and more likely to arrive back at starting point
        ecs.components.platformer.gravity[entity] = ecs.components.platformer.gravity_max[entity];
        if(Platformer.isAtApex(entity) && Platformer.helper.anti_gravity_apex[entity]){
            ecs.components.platformer.gravity[entity] = ecs.components.platformer.gravity_min[entity];
        }
    }
    static updateHelperJumpBuffer(jumpRequested,entity){
        const ecs = Fes.data.ecs;
        //currently pushing up, reset the buffer
        if (jumpRequested) {
            ecs.components.platformer.UP_frames_ago[entity] = 0;
            return true;
        }
        //otherwise, if up was pressed recently, return true
        ecs.components.platformer.UP_frames_ago[entity] += 1;
        //but only if you're going down
        //i.e. the player has requested a jump, but their vspeed hasn't gone positive (didn't jump immediately)
        //but within 4 frame, they've landed, i.e. the player was trying to time "up" to landing
        if (Platformer.helper.jump_buffering && 
            ecs.components.platformer.UP_frames_ago[entity] < 4 && ecs.components.platformer.current_v_speed[entity]>0) { 
            jumpRequested = true;
        }
        return jumpRequested;
    }
    static updateHelperFastApex(entity){
        const ecs = Fes.data.ecs;
        // give horizontal boost to acceleration at apex
        // makes it more likely to get a platform just in range
        // and more likely to arrive back at starting point
        if (Platformer.isAtApex(entity) && Platformer.helper.speedy_apex) {
            if (ecs.components.platformer.current_h_speed[entity] > 1 && ecs.components.platformer.LEFT[entity]) {
                ecs.components.platformer.current_h_speed[entity] -= 5;
            }
            if (ecs.components.platformer.current_h_speed[entity] < -1 && ecs.components.platformer.RIGHT[entity]) {
                ecs.components.platformer.current_h_speed[entity] += 5;
            }
        }
    }
    static updateHelperStickyFeet(entity){
        const ecs = Fes.data.ecs;
        // hit floor sticky feet
        if (Platformer.helper.sticky_feet && 
            !Map.place_free(ecs.components.platformer.move_to_x[entity], ecs.components.platformer.move_to_y[entity] + 1)) { // I'm going to hit the floor
            if (ecs.components.platformer.landed_frames_ago[entity] < 6) { // just hit the ground this frame
                if (ecs.components.platformer.LEFT[entity] && ecs.components.platformer.current_h_speed[entity] > 0) { // you are moving one direction but pressing the button for other way 
                    ecs.components.platformer.move_to_x[entity] -= ecs.components.platformer.max_walk_speed[entity]; // ability to instantly change direction when landing 
                    ecs.components.platformer.current_h_speed[entity] = -ecs.components.platformer.max_walk_speed[entity];
                }
                if (ecs.components.platformer.RIGHT[entity] && ecs.components.platformer.current_h_speed[entity] < 0) { // you are moving one direction but pressing the button for other way 
                    ecs.components.platformer.move_to_x[entity] += ecs.components.platformer.max_walk_speed[entity]; // ability to instantly change direction when landing 
                    ecs.components.platformer.current_h_speed[entity] = ecs.components.platformer.max_walk_speed[entity];
                }
            }
        }
    }
    static updateHelperCatchJump(entity){
        const ecs = Fes.data.ecs;
        // if the player is nearly landing on a platform, make them reach it
        // i.e. they are going down and pressing towards the platform's edge
        if (ecs.components.platformer.current_v_speed[entity] > 0) { // going down
            const bump_amount = 30;
            if (ecs.components.platformer.current_h_speed[entity] > 1) { // going right
                if (!Map.place_free(ecs.components.position.x[entity] + 1, ecs.components.position.y[entity])) { // they are about to hit a wall
                    if (Platformer.helper.catch_missed_jump &&
                        Map.place_free(ecs.components.platformer.move_to_x[entity], ecs.components.platformer.move_to_y[entity] - bump_amount)) {
                        ecs.components.position.x[entity] = ecs.components.platformer.move_to_x[entity];
                        ecs.components.position.y[entity] = ecs.components.platformer.move_to_y[entity] - (bump_amount + 1);
                        Map.move_contact_solid_angle(entity, 270, bump_amount + 2);
                    }
                }
            }
            if (ecs.components.platformer.current_h_speed[entity] < -1) { // going left
                if (Map.place_free(ecs.components.position.x[entity] - 1, ecs.components.position.y[entity]) == false) { // they are about to hit a wall
                    if (Platformer.helper.catch_missed_jump && 
                        Map.place_free(ecs.components.platformer.move_to_x[entity], ecs.components.platformer.move_to_y[entity] - bump_amount)) {
                        ecs.components.position.x[entity] = ecs.components.platformer.move_to_x[entity];
                        ecs.components.position.y[entity] = ecs.components.platformer.move_to_y[entity] - (bump_amount + 1);
                        Map.move_contact_solid_angle(entity, 270, bump_amount + 2);
                    }
                }
            }
        }
    }
    static updateLocalControls(entity){
        const ecs = Fes.data.ecs;
        const controls = Fes.engine.getControls(entity);
        ecs.components.platformer.LEFT[entity] = controls.Left;
        ecs.components.platformer.RIGHT[entity] = controls.Right;
        ecs.components.platformer.UP[entity] = controls.Up_Pressed;

    }

    static updatePlatformMovement(entity){
        const ecs = Fes.data.ecs;
        //--start: kockback
        //brick controls for characters in hitstun
        if(Knockback.isInHitstun(entity)){
            ecs.components.platformer.LEFT[entity] = false;
            ecs.components.platformer.RIGHT[entity] = false;
            ecs.components.platformer.UP[entity] = false;
            return;
        }
        //--end: knockback
        let jumpRequested = ecs.components.platformer.UP[entity];
        ecs.components.platformer.did_jump[entity] = false;
        if (ecs.components.platformer.LEFT[entity] > 0 || ecs.components.platformer.RIGHT[entity] > 0) { // they are moving left / right
            ecs.components.platformer.current_h_speed[entity] += (ecs.components.platformer.RIGHT[entity] - ecs.components.platformer.LEFT[entity]) * (ecs.components.platformer.walk_acceleration[entity]);
            ecs.components.platformer.current_h_speed[entity] = Platformer.clamp(ecs.components.platformer.current_h_speed[entity], -(ecs.components.platformer.max_walk_speed[entity]), (ecs.components.platformer.max_walk_speed[entity]));
        } else { // not moving sideways, apply horizontal friction
            //slow them down 
            if (ecs.components.platformer.current_h_speed[entity] > ecs.components.platformer.walk_decceleration[entity]) {
                ecs.components.platformer.current_h_speed[entity] -= (ecs.components.platformer.walk_decceleration[entity]);
            } else if (ecs.components.platformer.current_h_speed[entity] < -ecs.components.platformer.walk_decceleration[entity]) {
                ecs.components.platformer.current_h_speed[entity] += (ecs.components.platformer.walk_decceleration[entity]);
            } else {
                ecs.components.platformer.current_h_speed[entity] = 0;
            }
        }
        Platformer.updateHelperAntiGravApex(entity);
        // gravty 
        ecs.components.platformer.current_v_speed[entity] += (ecs.components.platformer.gravity[entity]);
        // max fall speed 
        if (ecs.components.platformer.current_v_speed[entity] > ecs.components.platformer.max_fall_speed[entity] && Platformer.helper.max_fall_speed) {
            ecs.components.platformer.current_v_speed[entity] = ecs.components.platformer.max_fall_speed[entity];
        }
        jumpRequested = Platformer.updateHelperJumpBuffer(jumpRequested,entity);
        if (jumpRequested) {
            if(Platformer.canJump(entity)){
                Platformer.jump(entity);
            }
        }
        Platformer.updateHelperFastApex(entity);
        ecs.components.platformer.move_to_x[entity] = ecs.components.position.x[entity] + (ecs.components.platformer.current_h_speed[entity]);
        ecs.components.platformer.move_to_y[entity] = ecs.components.position.y[entity] + (ecs.components.platformer.current_v_speed[entity]);
        Platformer.updateHelperStickyFeet(entity);
        //#region // actually move the person 
        // from the control checks we know where the player should be 
        if (Map.place_free(ecs.components.platformer.move_to_x[entity], ecs.components.platformer.move_to_y[entity])) {
            // player didnt hit a wall so move them 
            ecs.components.position.x[entity] = ecs.components.platformer.move_to_x[entity];
            ecs.components.position.y[entity] = ecs.components.platformer.move_to_y[entity];
        } else {
            // I've hit a wall so work out where I should be 
            ecs.components.platformer.xmoveamount[entity] =  ecs.components.platformer.move_to_x[entity] -  ecs.components.position.x[entity];
            if ( ecs.components.platformer.xmoveamount[entity] > 0) {
                Map.move_contact_solid_angle(entity, 0, ecs.components.platformer.xmoveamount[entity]);
            } else if (ecs.components.platformer.xmoveamount[entity] < 0) {
                Map.move_contact_solid_angle(entity, 180, -ecs.components.platformer.xmoveamount[entity]);
            }
            // doing this twice so the player slides along the wall rather than stopping if I collide in one direction && not the other 
            ecs.components.platformer.ymoveamount[entity] = ecs.components.platformer.move_to_y[entity] - ecs.components.position.y[entity];
            if (ecs.components.platformer.ymoveamount[entity] > 0) {
                Map.move_contact_solid_angle(entity, 270, ecs.components.platformer.ymoveamount[entity]);
            } else if (ecs.components.platformer.ymoveamount[entity] < 0) {
                Map.move_contact_solid_angle(entity  , 90, -ecs.components.platformer.ymoveamount[entity]);
            }
        }
        //#endregion
        //#region // check for on ground 
        if (Map.place_free(ecs.components.position.x[entity], ecs.components.position.y[entity] + 1)) {
            ecs.components.platformer.grounded[entity] = false;
        } else {
            if (!ecs.components.platformer.grounded[entity]) {
                ecs.components.platformer.landed_frames_ago[entity] = 0;
            }
            ecs.components.platformer.grounded[entity] = true;
            if(Platformer.helper.double_jump){
                ecs.components.platformer.air_jump_count[entity] = ecs.components.platformer.max_air_jumps[entity];
            }
            ecs.components.platformer.current_v_speed[entity] = 0;
        }
        if (ecs.components.platformer.grounded[entity]) {
            ecs.components.platformer.landed_frames_ago[entity] += 1; // count how long I've been on ground
        }
        //#endregion
        Platformer.updateHelperCatchJump(entity);
        // bumped head 
        if (ecs.components.platformer.current_v_speed[entity] < 0 && !Map.place_free(ecs.components.position.x[entity], ecs.components.position.y[entity] - 1)) {
            ecs.components.platformer.current_v_speed[entity] = 0;
        } else if (ecs.components.platformer.current_v_speed[entity] > 0 && !Map.place_free(ecs.components.position.x[entity], ecs.components.position.y[entity] + 1)) { // on ground
            ecs.components.platformer.current_v_speed[entity] = 0;
        }
        // touched wall
        if (ecs.components.platformer.current_h_speed[entity] > 0 && !Map.place_free(ecs.components.position.x[entity] + 1, ecs.components.position.y[entity])) {
            ecs.components.platformer.current_h_speed[entity] = 0;
        } else if (ecs.components.platformer.current_h_speed[entity] < 0 && !Map.place_free(ecs.components.position.x[entity] - 1, ecs.components.position.y[entity])) {
            ecs.components.platformer.current_h_speed[entity] = 0;
        }
        // for buffering stuff next frame
        Platformer.updateCoyoteJump(entity);
    }
    //-- end static logic 
    
}



export { Platformer};