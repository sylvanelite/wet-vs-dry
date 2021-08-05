import { Bullet } from "./bullet.mjs";

class MachineGun {
    static init(owner) {
        const ecs = Fes.data.ecs;
        const self = Bullet.init(owner);//"inherit" from bullet
        ecs.components.bullet.gravity[self] = 0;
        ecs.components.bullet.damage[self] = 7;
        ecs.components.bullet.explodes[self] = true;
        ecs.components.bullet.cooldown[self] = 2;
        ecs.components.bullet.friction[self] = 0;
        ecs.components.bullet.duration[self] = 20;
        ecs.components.direction.magnitude[self] = 4;
        ecs.components.bullet.rgb[self] = Bullet.rgbToInt(168,40,200);
        ecs.components.size.width[self] = 6;
        ecs.components.size.height[self] = 6;
        return self;
    }
}
export {
    MachineGun
};