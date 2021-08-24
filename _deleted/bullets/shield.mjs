import { Bullet } from "./bullet.mjs";

class Shield {
    static init(owner) {
        const ecs = Fes.data.ecs;
        const self = Bullet.init(owner);//"inherit" from bullet
        ecs.components.bullet.gravity[self] = 0;
        ecs.components.bullet.damage[self] = 0;
        ecs.components.bullet.explodes[self] = false;
        ecs.components.bullet.cooldown[self] = 240;//60*4 = 4 sec
        ecs.components.bullet.friction[self] = 0;
        ecs.components.bullet.duration[self] = 60;
        ecs.components.direction.magnitude[self] = 0.01;
        ecs.components.bullet.rgb[self] = Bullet.rgbToInt(106,202,224);
        ecs.components.size.width[self] = 48;
        ecs.components.size.height[self] = 48;
        return self;
    }
    //TODO: shield!
}
export {
    Shield
};