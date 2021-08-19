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
        let ctx = Fes.R.varCtx;
        //offset is from the layer's position in GIMP
        //based on the top-left of the world (not the screen)
        const images = [
            {name:"terrain",
                amountX:1.5,
                amountY:1.1,
            offsetX:-905,offsetY:-550},//y is higher due to parallax
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
                    imgData.offsetX-Fes.R.screenX*imgData.amountX,
                    imgData.offsetY-Fes.R.screenY*imgData.amountY);
            }
        }
    }
    static renderFG() {
        let ctx = Fes.R.varCtx;
        const images = [
            {name:"fg",
                amountX:1,
                amountY:2,
            offsetX:-308,offsetY:546},
        ];
        for (const imgData of images){
            const img = ParallaxRenderer.getImgData(imgData.name);
            if(img){
                ctx.drawImage(img, 
                    imgData.offsetX-Fes.R.screenX*imgData.amountX,
                    imgData.offsetY-Fes.R.screenY*imgData.amountY);
            }
        }
    }
    

}


export { ParallaxRenderer };