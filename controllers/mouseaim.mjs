
import { defineSystem, types } from "../ecs.js";

class MouseAim{

    static addToEntity(entity){
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity,"mouseControls");
        ecs.components.mouseControls.x[entity] = 0;
        ecs.components.mouseControls.y[entity] = 0;
        ecs.addComponent(entity,"mouseaim");
    }
    static defineComponents(){
        Fes.data.ecs.defineComponent("mouseaim");
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