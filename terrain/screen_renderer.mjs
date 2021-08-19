import { MainMenuEntity } from "../controllers/menu.mjs";
import { defineSystem } from "../ecs.js";

class ScreenRenderer {
    
    static defineRenderSystems(ecs,s) {
        const query = ecs.createQuery("mapRenderer");
        const system = defineSystem(query, ScreenRenderer.render);
        s.push(system);
    }
    static render() {
        if(MainMenuEntity.isInMenu()){
            return;
        }
        let ctx = Fes.R.varCtx;
        //---
        /*
        //https://stackoverflow.com/questions/7615009/disable-interpolation-when-scaling-a-canvas
        //testing zoom. NOTE: this needs to be done before the UI is drawn (stocks) but after all objects are rendered
        //var imgData = ctx.getImageData(0, 0, Fes.R.SCREEN_WIDTH, Fes.R.SCREEN_HEIGHT);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        //TODO: compute zoom amount
        let zoom = 2;
        if(zoom<1){//zoom out, not in
            zoom = 1;
        }
        //compute centre, translate the canvas to 0 before zooming 
        ctx.translate(Fes.R.SCREEN_WIDTH/zoom,Fes.R.SCREEN_HEIGHT/zoom);
        ctx.scale(zoom,zoom);
        ctx.translate(-Fes.R.SCREEN_WIDTH/zoom, -Fes.R.SCREEN_HEIGHT/zoom);
        ctx.drawImage(Fes.R.varCanvas,0,0);



        ctx.restore();
        */
        //-----
    }
    

}


export { ScreenRenderer };