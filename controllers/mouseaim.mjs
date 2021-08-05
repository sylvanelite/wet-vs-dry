
import { defineSystem, types } from "../ecs.js";
import { Bullet } from "../interactable/bullets/bullet.mjs";
import { Grenade } from "../interactable/bullets/grenade.mjs";
import { Flame } from "../interactable/bullets/flame.mjs";
import { Drill } from "../interactable/bullets/drill.mjs";
import { Shotgun } from "../interactable/bullets/shotgun.mjs";
import { Platform } from "../interactable/bullets/platform.mjs";
import { Sniper } from "../interactable/bullets/sniper.mjs";
import { Graple } from "../interactable/bullets/graple.mjs";
import { MachineGun } from "../interactable/bullets/machinegun.mjs";
import { Shield } from "../interactable/bullets/shield.mjs";

class MouseAim{
    static SHOOT_KIND ={
        BULLET:0,
        GRENADE:1,
        FLAME:2,
        DRILL:3,
        SHOTGUN:4,
        PLATFORM:5,
        SNIPER:6,
        GRAPLE:7,
        MACHINE_GUN:8,
        SHIELD:9
    }

    static addToEntity(entity){
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity,"mouseControls");
        ecs.components.mouseControls.x[entity] = 0;
        ecs.components.mouseControls.y[entity] = 0;
        ecs.addComponent(entity,"mouseaim");
        ecs.components.mouseaim.shootKind[entity] = MouseAim.SHOOT_KIND.BULLET;
        ecs.components.mouseaim.shootKindAlt[entity] = MouseAim.SHOOT_KIND.GRENADE;
        ecs.components.mouseaim.canShoot[entity] = 0;
        ecs.components.mouseaim.canShootAlt[entity] = 0;
    }
    static defineComponents(){
        Fes.data.ecs.defineComponent("mouseaim",{
            canShoot:types.int32,
            canShootAlt:types.int32,
            shootKind:types.int8,
            shootKindAlt:types.int8,
        });
    }
    static defineRenderSystems(ecs,s){
        const query = ecs.createQuery("mouseaim","controlSourceLocal");
        const system = defineSystem(query, MouseAim.render);
        s.push(system);
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("mouseaim","controlSourceLocal");
        const system = defineSystem(query, MouseAim.updateMouseAim);
        s.push(system);
        //network  = same as local but not rendered
        const queryNetwork = ecs.createQuery("mouseaim","controlSourceNetwork");
        const systemNetwork = defineSystem(queryNetwork, MouseAim.updateMouseAim);
        s.push(systemNetwork);
    }
    static updateMouseAim(entity){
        const ecs = Fes.data.ecs;
        const controls = Fes.engine.getControls(entity);
        //pointer
        ecs.components.mouseControls.x[entity] = controls.Mouse_X;
        ecs.components.mouseControls.y[entity] = controls.Mouse_Y;
        //shoot
        if(ecs.components.mouseaim.canShoot[entity]>0){
            ecs.components.mouseaim.canShoot[entity]-=1;
        }
        if(ecs.components.mouseaim.canShootAlt[entity]>0){
            ecs.components.mouseaim.canShootAlt[entity]-=1;
        }
        //use Left instead of Left_Pressed for hold fire weapons
        if(controls.Mouse_Left && ecs.components.mouseaim.canShoot[entity]<=0){
            const kind =ecs.components.mouseaim.shootKind[entity];
            let bullet = MouseAim.createBullet(entity,kind);
            if(bullet !==null){//strict comparison, bullet can be 0
                let angle = Math.atan2(
                    controls.Mouse_Y-ecs.components.position.y[entity],
                    controls.Mouse_X-ecs.components.position.x[entity]
                );
                ecs.components.direction.angle[bullet] = angle;
                ecs.components.mouseaim.canShoot[entity] = ecs.components.bullet.cooldown[bullet];
            }
        }
        if(controls.Mouse_Right && ecs.components.mouseaim.canShootAlt[entity]<=0){
            const kind =ecs.components.mouseaim.shootKindAlt[entity];
            let bullet = MouseAim.createBullet(entity,kind);
            if(bullet !==null){//strict comparison, bullet can be 0
                let angle = Math.atan2(
                    controls.Mouse_Y-ecs.components.position.y[entity],
                    controls.Mouse_X-ecs.components.position.x[entity]
                );
                ecs.components.direction.angle[bullet] = angle;
                ecs.components.mouseaim.canShootAlt[entity] = ecs.components.bullet.cooldown[bullet];
            }
        }
    }
    static createBullet(entity,kind){
        const ecs = Fes.data.ecs;
        let bullet = null;
        switch(kind){
            case MouseAim.SHOOT_KIND.BULLET:
                bullet = Bullet.init(entity);
                break;
            case MouseAim.SHOOT_KIND.GRENADE:
                bullet = Grenade.init(entity);
                break;
            case MouseAim.SHOOT_KIND.FLAME:
                bullet = Flame.init(entity);
                break;
            case MouseAim.SHOOT_KIND.DRILL:
                bullet = Drill.init(entity);
                break;
            case MouseAim.SHOOT_KIND.SHOTGUN:
                bullet = Shotgun.init(entity);
                break;
            case MouseAim.SHOOT_KIND.PLATFORM:
                bullet = Platform.init(entity);
                break;
            case MouseAim.SHOOT_KIND.SNIPER:
                bullet = Sniper.init(entity);
                break;
            case MouseAim.SHOOT_KIND.GRAPLE:
                bullet = Graple.init(entity);
                break;
            case MouseAim.SHOOT_KIND.MACHINE_GUN:
                bullet = MachineGun.init(entity);
                break;
            case MouseAim.SHOOT_KIND.SHIELD:
                bullet = Shield.init(entity);
                break;
            default:
                console.log("unknown bullet");
                break;
        }
        return bullet;
    }
    static render(entity){
        const ecs = Fes.data.ecs;
        let ctx = Fes.R.varCtx;
        let aimSize = 10;
        ctx.strokeStyle = "1px solid black";
        ctx.beginPath();
        ctx.arc(ecs.components.mouseControls.x[entity]+0.5- Fes.R.screenX, 
                ecs.components.mouseControls.y[entity]+0.5- Fes.R.screenY, 
                aimSize,0, 2 * Math.PI);
        ctx.stroke();
    }
    
}


export { MouseAim };