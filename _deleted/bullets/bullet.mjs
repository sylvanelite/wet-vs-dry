import { defineSystem, types } from "../../ecs.js";
import { Map } from "../../map.mjs";

class Bullet {
    static init(owner) {
        const ecs = Fes.data.ecs;
        const self = ecs.createEntity();
        ecs.addComponent(self, "position");
        ecs.components.position.x[self] = ecs.components.position.x[owner];
        ecs.components.position.y[self] = ecs.components.position.y[owner];
        ecs.addComponent(self, "size");
        ecs.components.size.width[self] = 8;
        ecs.components.size.height[self] = 8;
        ecs.addComponent(self, "direction");
        ecs.components.direction.magnitude[self] = 3;
        ecs.components.direction.angle[self] = 0;
        ecs.addComponent(self, "bullet");
        ecs.components.bullet.gravity[self] = 0;
        ecs.components.bullet.damage[self] = 10;
        ecs.components.bullet.bounce[self] = false;
        ecs.components.bullet.gravityGrowth[self] = 0;
        ecs.components.bullet.maxGravity[self] = 0;
        ecs.components.bullet.explodes[self] = true;
        ecs.components.bullet.cooldown[self] = 6;
        ecs.components.bullet.friction[self] = 0;
        ecs.components.bullet.duration[self] = 100;
        ecs.components.bullet.carve[self] = 0;
        ecs.components.bullet.rgb[self] = Bullet.rgbToInt(255,255,255);
        return self;
    }

    static defineRenderSystems(ecs, s) {
        const query = ecs.createQuery("bullet");
        const system = defineSystem(query, Bullet.render);
        s.push(system);
    }
    static defineSystems(ecs, s) {
        const query = ecs.createQuery("bullet");
        const system = defineSystem(query, Bullet.update);
        s.push(system);
    }
    static defineComponents() {
        Fes.data.ecs.defineComponent("bullet", {
            gravity: types.float64, //current grav amount
            damage: types.int32, //damage done on collision
            bounce: types.int8, //if true, bounces off walls and floors 
            gravityGrowth: types.float64, //set to a positive number, bullet will drop
            maxGravity: types.float64, //constraint
            explodes: types.int8, //if it is destroyed on contact with tile. if dmg > 0 eplode on contact with enemeny
            cooldown: types.int32, //how long between shots
            friction: types.float64, //amount to slow down per frame
            duration: types.int32, //timer until bullet de-spawns
            carve: types.int8,//0,1,-1 -- 0=nothing, 1=carve on collide, -1=uncarve on collide
            rgb: types.int32//colour used for rendering
        });
    }

    static update(entity) {
        const ecs = Fes.data.ecs;
        //friction and gravity
        if (ecs.components.direction.magnitude[entity] > 0) {
            ecs.components.direction.magnitude[entity] - ecs.components.bullet.friction[entity];
        }
        if (ecs.components.direction.magnitude[entity] < 0) {
            ecs.components.direction.magnitude[entity] = 0;
        }
        if (ecs.components.bullet.duration[entity] > 0) {
            ecs.components.bullet.duration[entity] -= 1;
        }
        if (ecs.components.bullet.duration[entity] <= 0) {
            //this.explode();//TODO: expolode on time out?
            ecs.destroyEntity(entity);
            return;
        }
        //compute H and V components of magnitude
        let hOff = Math.cos(ecs.components.direction.angle[entity]) * ecs.components.direction.magnitude[entity];
        let vOff = Math.sin(ecs.components.direction.angle[entity]) * ecs.components.direction.magnitude[entity];
        //check for wall bounces
        if (ecs.components.bullet.bounce[entity]) {
            Bullet.checkBounce(entity, ecs.components.position.x[entity], ecs.components.position.y[entity], hOff, vOff);
            //update offsets based on bounce result
            hOff = Math.cos(ecs.components.direction.angle[entity]) * ecs.components.direction.magnitude[entity];
            vOff = Math.sin(ecs.components.direction.angle[entity]) * ecs.components.direction.magnitude[entity];
        }

        //apply bonus gravity for this trajectory
        //Note: this is a straight-line trajectory. platform movement will apply gravity.
        ecs.components.bullet.gravity[entity] += ecs.components.bullet.gravityGrowth[entity];
        if (ecs.components.bullet.gravity[entity] > ecs.components.bullet.maxGravity[entity]) {
            ecs.components.bullet.gravity[entity] = ecs.components.bullet.maxGravity[entity];
        }
        vOff += ecs.components.bullet.gravity[entity];
        if (!Map.place_free(ecs.components.position.x[entity] + hOff,
                ecs.components.position.y[entity] + vOff)) {
            if (ecs.components.bullet.carve[entity]>0) {//carve map at next cell
                Map.destroy_tile_at_xy(ecs.components.position.x[entity]+hOff,
                    ecs.components.position.y[entity]+vOff); 
            }
            if (ecs.components.bullet.carve[entity]<0) {//un carve map at existing cell
                Map.create_tile_at_xy(ecs.components.position.x[entity],
                    ecs.components.position.y[entity]); 
            }
            if (ecs.components.bullet.explodes[entity]) {//TODO: expolode
                ecs.destroyEntity(entity);
            }
        }
        //move the bullet
        Map.move_contact_solid(entity, 
                    ecs.components.position.x[entity]+hOff,
                    ecs.components.position.y[entity]+vOff);
    }

    static checkBounce(entity, x, y, hOff, vOff) {
        const ecs = Fes.data.ecs;
        const collisionCheck = Map.tileLineCollisiion(x, y, x + hOff, y + vOff);
        if (collisionCheck) {
            //horizontal bounce
            if(collisionCheck == Map.COLLISION_KIND.LEFT||
               collisionCheck == Map.COLLISION_KIND.RIGHT){
                 ecs.components.direction.angle[entity] = Math.PI - ecs.components.direction.angle[entity]; //math.pi = 180 radians
            }
            //vertical bounce
            if(collisionCheck == Map.COLLISION_KIND.TOP||
               collisionCheck == Map.COLLISION_KIND.BOTTOM){
                ecs.components.direction.angle[entity] = 2*Math.PI - ecs.components.direction.angle[entity]; //math.pi = 180 radians
            }
            if(collisionCheck == Map.COLLISION_KIND.INSIDE){
                //should not get here, but stop moving
                ecs.components.direction.magnitude[entity] = 0;
            }
        }
    }
    static rgbToInt(r,g,b){
        return (r << 16) + (g << 8) + (b);
    }
    static rgbIntToColour(c){
        const rgb ={
            r: (c & 0xff0000) >> 16, 
            g: (c & 0x00ff00) >> 8, 
            b: (c & 0x0000ff)
        };
        return "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
    }
    static render(entity) {
        const ecs = Fes.data.ecs;
        let ctx = Fes.R.varCtx;
        ctx.strokeStyle = "#000000";
        ctx.strokeStyle = Bullet.rgbIntToColour(ecs.components.bullet.rgb[entity]);
        ctx.beginPath();
        let w = ecs.components.size.width[entity];
        let h = ecs.components.size.height[entity];
        ctx.rect(ecs.components.position.x[entity] - Fes.R.screenX - w / 2 - 0.5,
            ecs.components.position.y[entity] - h - Fes.R.screenY - 0.5,
            w, h);
        ctx.stroke();
    }
}
export {
    Bullet
};