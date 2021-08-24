import { Bullet } from "./bullet.mjs";

class Shotgun {
    static init(owner) {
        const ecs = Fes.data.ecs;
        const self = Bullet.init(owner);//"inherit" from bullet
        ecs.components.bullet.gravity[self] = 0;
        ecs.components.bullet.damage[self] = 5;
        ecs.components.bullet.explodes[self] = false;
        ecs.components.bullet.cooldown[self] = 30;
        ecs.components.bullet.friction[self] = 0;
        ecs.components.bullet.duration[self] = 15;
        ecs.components.direction.magnitude[self] = 5;
        ecs.components.bullet.rgb[self] = Bullet.rgbToInt(0,0,255);
        ecs.components.size.width[self] = 12;
        ecs.components.size.height[self] = 12;
        return self;
    }
}
export {
    Shotgun
};