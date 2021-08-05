import { Bullet } from "./bullet.mjs";

class Flame {
    static init(owner) {
        const ecs = Fes.data.ecs;
        const self = Bullet.init(owner);//"inherit" from bullet
        ecs.components.bullet.gravity[self] = 0;
        ecs.components.bullet.damage[self] = 1;
        ecs.components.bullet.bounce[self] = true;
        ecs.components.bullet.gravityGrowth[self] = 0.05;
        ecs.components.bullet.maxGravity[self] = 4000;
        ecs.components.bullet.explodes[self] = false;
        ecs.components.bullet.cooldown[self] = 3;
        ecs.components.bullet.friction[self] = 0.1;
        ecs.components.bullet.duration[self] = 50;
        ecs.components.direction.magnitude[self] = 3;
        ecs.components.bullet.rgb[self] = Bullet.rgbToInt(255,0,0);
        return self;
    }
}
export {
    Flame
};