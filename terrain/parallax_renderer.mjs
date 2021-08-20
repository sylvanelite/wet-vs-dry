import { MainMenuEntity } from "../controllers/menu.mjs";

class ParallaxRenderer {
    static imageCache = {};
    static getImgData(imgName){
        const ecs = Fes.data.ecs;
        if(ParallaxRenderer.imageCache[imgName] == null){
            //start loading
            let img = new Image();
            ParallaxRenderer.imageCache[imgName] = {
                image:img,
                isLoaded:false
            };
            img.onload = function(){
                ParallaxRenderer.imageCache[imgName].isLoaded = true;
            };
            img.src = "./assets/layers/"+imgName+".png";
        }
        if(ParallaxRenderer.imageCache[imgName].isLoaded){
            return ParallaxRenderer.imageCache[imgName].image;
        }
    }
    static renderBG() {
        if(MainMenuEntity.isInMenu()){
            return;
        }
        let ctx = Fes.R.varCtx;
        //offset is from the layer's position in GIMP
        //based on the top-left of the world (not the screen)
        const images = [
            {name:"terrain",
                amountX:1.5,
                amountY:1.1,
            offsetX:-905,offsetY:-530},//y is higher due to parallax
            {name:"parallax1",
                amountX:1.2,
                amountY:1.2,
            offsetX:-406,offsetY:-265},
            {name:"parallax2",
                amountX:1.7,
                amountY:1.7,
            offsetX:6,offsetY:-33},
            {name:"parallax3",
                amountX:2,
                amountY:2,
            offsetX:160,offsetY:-3},
            {name:"island",
                amountX:1.1,
                amountY:1.1,
            offsetX:134,offsetY:179}
        ];
        for (const imgData of images){
            const img = ParallaxRenderer.getImgData(imgData.name);
            if(img){
                ctx.drawImage(img, 
                    Math.floor(imgData.offsetX-Fes.R.screenX*imgData.amountX),
                    Math.floor(imgData.offsetY-Fes.R.screenY*imgData.amountY));
            }
        }
    }
    static renderFG() {
        if(MainMenuEntity.isInMenu()){
            return;
        }
        let ctx = Fes.R.varCtx;
        const imgData = {name:"fg",
            amountX:1,
            amountY:2,
        offsetX:-308,offsetY:650};
        let frame= Fes.engine.frameCount%120;
        if(frame>30){
            imgData.name="fg_1";
        }
        if(frame>60){
            imgData.name="fg_2";
        }
        if(frame>90){
            imgData.name="fg_1";
        }
        const img = ParallaxRenderer.getImgData(imgData.name);
        //move the water across ever 2nd frame, up to 100 frames (50 forward, 50 back)
        let slideAmountX =  Math.sin(Fes.engine.frameCount/50)*50;
        let slideAmountY =  Math.sin(Fes.engine.frameCount/150)*25;
        imgData.offsetY-=Math.floor(slideAmountY/16)*16;
        imgData.offsetX+=Math.floor(slideAmountX/16)*16;
        if(img){
            ctx.drawImage(img, 
                Math.floor(imgData.offsetX-Fes.R.screenX*imgData.amountX),
                Math.floor(imgData.offsetY-Fes.R.screenY*imgData.amountY-12));
        }
        imgData.offsetY-=Math.floor(slideAmountY/32)*32;
        imgData.offsetX+=Math.floor(slideAmountX/32)*32;
        if(img){
            ctx.drawImage(img, 
                Math.floor(imgData.offsetX-Fes.R.screenX*imgData.amountX),
                Math.floor(imgData.offsetY-Fes.R.screenY*imgData.amountY));
        }
    }
    

}


export { ParallaxRenderer };