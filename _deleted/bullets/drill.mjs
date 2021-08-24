import { Bullet } from "./bullet.mjs";

class Drill {
    static init(owner) {
        const ecs = Fes.data.ecs;
        const self = Bullet.init(owner);//"inherit" from bullet
        ecs.components.bullet.gravity[self] = 0;
        ecs.components.bullet.damage[self] = 1;
        ecs.components.bullet.explodes[self] = true;
        ecs.components.bullet.cooldown[self] = 30;
        ecs.components.bullet.friction[self] = 0.1;
        ecs.components.bullet.duration[self] = 50;
        ecs.components.direction.magnitude[self] = 2;
        ecs.components.bullet.carve[self] = 1;
        ecs.components.bullet.rgb[self] = Bullet.rgbToInt(0,255,0);
        return self;
    }
}
export {
    Drill
};