import Frame from "./frame.mjs";
import Hitbox from "./hitbox.mjs";
class BaseCharacter {
	constructor(){
        this.sprite_sheet = "";
        this.ch_name = "character";
        this.animation_frame = 0;
        this.animations = {
            idle:[],
            //walk
            run:[],
            jump:[],
            in_air_up:[],
            in_air_down:[],
            hit:[],
            dodge:[],
            hang:[],
            //hitstun and freefall can be modifiers (flashing, etc)
            attack_neutral:[],
            attack_side:[],
            attack_down:[],
            attack_up:[],
            special_neutral:[],
            special_side:[],
            special_down:[],
            special_up:[]
        };

        //TODO: inherit from object
	}
    applyJsonToCh(fileJson) {
        let ch = this;
        if (fileJson.hasOwnProperty("ch_name")) {
            ch.ch_name = fileJson.ch_name;
        }
        if (fileJson.hasOwnProperty("sprite_sheet")) {
            ch.sprite_sheet = fileJson.sprite_sheet;
        }
        if (fileJson.hasOwnProperty("animations")) {
            for (const [fKey, fFrames] of Object.entries(fileJson.animations)) {
                ch.animations[fKey] = [];
                for (const [fIdx, fValue] of fFrames.entries()) {
                    let frame = new Frame();
                    if (fValue.hasOwnProperty("width")) {
                        frame.width = parseInt(fValue.width,10);
                    }
                    if (fValue.hasOwnProperty("height")) {
                        frame.height = parseInt(fValue.height,10);
                    }
                    if (fValue.hasOwnProperty("x")) {
                        frame.x = parseInt(fValue.x,10);
                    }
                    if (fValue.hasOwnProperty("y")) {
                        frame.y = parseInt(fValue.y,10);
                    }
                    if (fValue.hasOwnProperty("anchorX")) {
                        frame.anchorX = parseInt(fValue.anchorX,10);
                    }
                    if (fValue.hasOwnProperty("anchorY")) {
                        frame.anchorY = parseInt(fValue.anchorY,10);
                    }
                    if (fValue.hasOwnProperty("hitboxes")) {
                        for (const [idx, hValue] of fValue.hitboxes.entries()) {
                            let hitbox = new Hitbox();
                            if (hValue.hasOwnProperty("x")) {
                                hitbox.x = parseInt(hValue.x,10);
                            }
                            if (hValue.hasOwnProperty("y")) {
                                hitbox.y = parseInt(hValue.y,10);
                            }
                            if (hValue.hasOwnProperty("size")) {
                                hitbox.size = parseInt(hValue.size,10);
                            }
                            if (hValue.hasOwnProperty("damage")) {
                                hitbox.damage = parseInt(hValue.damage,10);
                            }
                            if (hValue.hasOwnProperty("angle")) {
                                hitbox.angle = parseInt(hValue.angle,10);
                            }
                            if (hValue.hasOwnProperty("baseKnockback")) {
                                hitbox.baseKnockback = parseInt(hValue.baseKnockback,10);
                            }
                            if (hValue.hasOwnProperty("scaling")) {
                                hitbox.scaling = parseInt(hValue.scaling,10);
                            }
                            frame.hitboxes.push(hitbox);
                        }
                    }
                    ch.animations[fKey].push(frame);
                }
            }
        }
    }

    
}
export default BaseCharacter;

