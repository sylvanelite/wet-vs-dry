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
        
        //https://stackoverflow.com/questions/7615009/disable-interpolation-when-scaling-a-canvas
        //testing zoom. NOTE: this needs to be done before the UI is drawn (stocks) but after all objects are rendered
        //var imgData = ctx.getImageData(0, 0, Fes.R.SCREEN_WIDTH, Fes.R.SCREEN_HEIGHT);
        
        ctx.save();
        let zoom = 2;
        //compute zoom amount
        //zoom in more if the player is closer to the middle of the desired screen viewport
        //i.e. if they are the middle, max zoom. if they are at the edge, min zoom
        let maxZoom = 2;
        let minZoom = 1;
        const screenMidpointX = Fes.R.screenX + Fes.R.SCREEN_WIDTH / 2;
        const screenMidpointY = Fes.R.screenY + Fes.R.SCREEN_HEIGHT / 2;
        const deltaX = Fes.data.ecs.components.position.x[Fes.data.player]-screenMidpointX;
        const deltaY = Fes.data.ecs.components.position.y[Fes.data.player]-screenMidpointY;
        const dist = Math.hypot(deltaX,deltaY);
        const screenHypot = Math.hypot(Fes.R.SCREEN_WIDTH / 2,Fes.R.SCREEN_HEIGHT / 2);
        const zoomPercent = 2-dist/screenHypot*maxZoom;
        zoom = zoomPercent;
        if(zoom<minZoom){//zoom out, not in
            zoom = 1;
        }
        if(zoom>maxZoom){
            zoom = 2;
        }
        //compute centre, translate the canvas to 0 before zooming 
        ctx.translate(Math.floor(Fes.R.SCREEN_WIDTH/zoom),Math.floor(Fes.R.SCREEN_HEIGHT/zoom));
        ctx.scale(zoom,zoom);
        ctx.translate(-Math.floor(Fes.R.SCREEN_WIDTH/zoom), -Math.floor(Fes.R.SCREEN_HEIGHT/zoom));
        ctx.drawImage(Fes.R.varCanvas,0,0);



        ctx.restore();
        
        //-----
    }
    

}


export { ScreenRenderer };