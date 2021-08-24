import { Bullet } from "./bullet.mjs";

class Sniper {
    static init(owner) {
        const ecs = Fes.data.ecs;
        const self = Bullet.init(owner);//"inherit" from bullet
        ecs.components.bullet.gravity[self] = 0;
        ecs.components.bullet.damage[self] = 50;
        ecs.components.bullet.explodes[self] = false;
        ecs.components.bullet.cooldown[self] = 60;
        ecs.components.bullet.friction[self] = 0;
        ecs.components.bullet.duration[self] = 40;
        ecs.components.direction.magnitude[self] = 7;
        ecs.components.bullet.rgb[self] = Bullet.rgbToInt(255,255,255);
        ecs.components.size.width[self] = 6;
        ecs.components.size.height[self] = 6;
        return self;
    }
}
export {
    Sniper
};