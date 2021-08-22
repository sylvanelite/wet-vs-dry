import { Map } from "../map.mjs";
import { defineSystem } from "../ecs.js";
import { ParallaxRenderer } from "./parallax_renderer.mjs";

class MapRenderer {
    static spriteSheet = null;
    static imgCache = {
        image:null,
        isLoaded:false
    };
    static init(){
        const ecs = Fes.data.ecs;
        const self = ecs.createEntity();
        ecs.addComponent(self,"mapRenderer");

        fetch('./assets/cavesprite.json')
		.then(response => response.json())
		.then(MapRenderer.loadSprite);
    }
    static defineRenderSystems(ecs,s) {
        const queryViewport = ecs.createQuery("controlSourceLocal");
        const systemViewport = defineSystem(queryViewport, MapRenderer.setViewport);
        s.push(systemViewport);
        const query = ecs.createQuery("mapRenderer");
        const system = defineSystem(query, MapRenderer.render,
            MapRenderer.beforeRender);
        s.push(system);
    }
    static setViewport(entity) {
        const mapWidth = Map.getMapWidthInTiles();
        const mapHeight = Map.getMapHeightInTiles();
        /*
        const bounds = {
            left: 0,
            right: mapWidth * Fes.R.TILE_SIZE,
            top: 0,
            bottom: mapHeight * Fes.R.TILE_SIZE
        };*/
        const bounds = {
            left: 64,
            right: 640+128,
            top: 64,
            bottom: 480+128
        };
        Fes.R.screenX = Math.floor(Fes.data.ecs.components.position.x[entity] - Fes.R.SCREEN_WIDTH / 2);
        Fes.R.screenY = Math.floor(Fes.data.ecs.components.position.y[entity] - Fes.R.SCREEN_HEIGHT / 2);
        if( isNaN(Fes.R.screenX) ){
            Fes.R.screenX = 0;
            console.log("x is nan: "+Fes.data.ecs.components.position.x[entity]);
        }
        if( isNaN(Fes.R.screenY) ){
            Fes.R.screenY = 0;
            console.log("y is nan: "+Fes.data.ecs.components.position.y[entity]);
        }
        if (Fes.R.screenX < bounds.left) {
            Fes.R.screenX = bounds.left;
        }
        if (Fes.R.screenY < bounds.top) {
            Fes.R.screenY = bounds.top;
        }
        if(mapWidth&&mapHeight){
            if (Fes.R.screenX + Fes.R.SCREEN_WIDTH > bounds.right) {
                Fes.R.screenX = bounds.right - Fes.R.SCREEN_WIDTH;
            }
            if (Fes.R.screenY + Fes.R.SCREEN_HEIGHT > bounds.bottom) {
                Fes.R.screenY = bounds.bottom - Fes.R.SCREEN_HEIGHT;
            }
        }
    }
    static render() {
        let ctx = Fes.R.varCtx;
        //background
        ctx.fillStyle = "#312D45";
        ctx.fillRect(0, 0, Fes.R.SCREEN_WIDTH, Fes.R.SCREEN_HEIGHT);
        ParallaxRenderer.renderBG();
        //tiles
        ctx.strokeStyle = "#000000";
        const mapWidth = Map.getMapWidthInTiles();
        const mapHeight = Map.getMapHeightInTiles();
        let startX = Math.floor(Fes.R.screenX / Fes.R.TILE_SIZE - 1);
        let startY = Math.floor(Fes.R.screenY / Fes.R.TILE_SIZE - 1);
        let endX = Math.floor((startX + 2) + Fes.R.SCREEN_WIDTH / Fes.R.TILE_SIZE);
        let endY = Math.floor((startY + 2) + Fes.R.SCREEN_HEIGHT / Fes.R.TILE_SIZE);
        for (let y = Math.max(startY, 0); y < Math.min(mapHeight, endY); y += 1) {
            for (let x = Math.max(startX, 0); x < Math.min(mapWidth, endX); x += 1) {
                if (x * Fes.R.TILE_SIZE + Fes.R.TILE_SIZE >= Fes.R.screenX && x * Fes.R.TILE_SIZE <= Fes.R.screenX + Fes.R.SCREEN_WIDTH &&
                    y * Fes.R.TILE_SIZE + Fes.R.TILE_SIZE >= Fes.R.screenY && y * Fes.R.TILE_SIZE <= Fes.R.screenY + Fes.R.SCREEN_HEIGHT) {
                    const tile = Map.getValueForTile(x,y);
                    if (tile) {
                        if(MapRenderer.imgCache.isLoaded){
                            MapRenderer.imageRenderer(x,y);
                        }else{
                            ctx.beginPath();
                            ctx.rect(x * Fes.R.TILE_SIZE - Fes.R.screenX - 0.5, y * Fes.R.TILE_SIZE - Fes.R.screenY - 0.5, Fes.R.TILE_SIZE, Fes.R.TILE_SIZE);
                            ctx.stroke();
                            ctx.fillRect(x * Fes.R.TILE_SIZE - Fes.R.screenX - 0.5, y * Fes.R.TILE_SIZE - Fes.R.screenY - 0.5, Fes.R.TILE_SIZE, Fes.R.TILE_SIZE);
                        }
                    }
                }
            }
        }
        ParallaxRenderer.renderFG();
    }

    static loadSprite(data){
        MapRenderer.spriteSheet = data;
        //start loading
        let img = new Image();
        MapRenderer.imgCache.image = img;
        img.onload = function(){ MapRenderer.imgCache.isLoaded = true; };
        img.src = MapRenderer.spriteSheet.sprite;
    }
    static imageRenderer(x,y){
        let ctx = Fes.R.varCtx;
        let screenX = x * Fes.R.TILE_SIZE - Fes.R.screenX;
        let screenY = y * Fes.R.TILE_SIZE - Fes.R.screenY;
        let tileInfo = MapRenderer.spriteSheet[MapRenderer.getTileName(x,y)];
        const img = MapRenderer.imgCache.image;
        ctx.drawImage(img,
            Math.floor(tileInfo.frame.x),
            Math.floor(tileInfo.frame.y),
            Math.floor(tileInfo.frame.width),
            Math.floor(tileInfo.frame.height),
            Math.floor(screenX),
            Math.floor(screenY),
            Fes.R.TILE_SIZE,Fes.R.TILE_SIZE);
        //tile info is in the form:
        /*
        "terrain_fill_center_center": {
            "frame": {
                "x": 322,
                "y": 240,
                "width": 16,
                "height": 16
            },
            "sourceSize": {
                "width": 16,
                "height": 16
            },
            "rotated": false
        },
        */  
    }
    static getTileName(x,y){
       //pick a tile from the following
       let L = false;
       let R = false;
       let U = false;
       let D = false;
       if(x<=1||
            Map.getValueForTile(x-1,y)){
           L = true;
       }
       if(x>=Map.getMapWidthInTiles()-1||
            Map.getValueForTile(x+1,y)){
           R = true;
       }
       if(y<=1||
            Map.getValueForTile(x,y-1)){
           U = true;
       }
       if(y>=Map.getMapHeightInTiles()-1||
            Map.getValueForTile(x,y+1)){
           D = true;
       }

       if(!L && !R && !U && !D ){
           return "terrain_platform_center";
       }
       if( L &&  R && !U &&  D ){
            return "terrain_top_center";
       }
       if(!L && R && !U && D ){
            return "terrain_top_left";
       }
       if( L && !R && !U &&  D ){
           return "terrain_top_right";
       }
       if( L &&  R &&  U && !D ){
           return "terrain_bottom_center";
       }
       if(!L &&  R &&  U && !D ){
           return "terrain_bottom_left";
       }
       if( L && !R &&  U && !D ){
           return "terrain_bottom_right";
       }
       if( L && !R &&  U &&  D ){
           return "terrain_center_left";
       }
       if(!L &&  R &&  U &&  D ){
           return "terrain_center_right";
       }
       if( L &&  R && !U && !D ){
           return "terrain_platform_center";
       }
       if(!L &&  R && !U && !D ){
           return "terrain_platform_left";
       }
       if( L && !R && !U && !D ){
           return "terrain_platform_right";
       }
       //--corners
       let UL = false;
       let UR = false;
       let DL = false;
       let DR = false;
       if(x<=1||y<=1||
            Map.getValueForTile(x-1,y-1)){
           UL = true;
       }
       if(x<=1||y>=Map.getMapHeightInTiles()-1||
            Map.getValueForTile(x-1,y+1)){
           DL = true;
       }
       if(x>=Map.getMapWidthInTiles()-1||y<=1||
            Map.getValueForTile(x+1,y-1)){
           UR = true;
       }
       if(x>=Map.getMapWidthInTiles()-1||
          y>=Map.getMapHeightInTiles()-1||
            Map.getValueForTile(x+1,y+1)){
           DR = true;
       }
       if(!UR){
           return "terrain_corner_inner_bottom_left";
       }
       if(!UL){
           return "terrain_corner_inner_bottom_right";
       }
       if(!DR){
           return "terrain_corner_inner_top_left";
       }
       if(!DL){
           return "terrain_corner_inner_top_right";
       }

       return "terrain_fill_center_center";
        /*
                                           //surrounded on sides:
        terrain_top_center                 //LRD
        terrain_top_left                   //DR
        terrain_top_right                  //DL
        terrain_bottom_center              //LUR 
        terrain_bottom_left                //UR  
        terrain_bottom_right               //LU
        terrain_center_left                //UDL
        terrain_center_right               //UDR
        terrain_platform_center            //LR
        terrain_platform_left              //R only
        terrain_platform_right             //L only
        terrain_corner_inner_bottom_left   //LRUD + not diag UR
        terrain_corner_inner_bottom_right  //LRUD + not diag UL
        terrain_corner_inner_top_left      //...? + not diag DR
        terrain_corner_inner_top_right     //...? + not diag DL
        terrain_fill_bottom_center         //these are one space in
        terrain_fill_bottom_left 
        terrain_fill_bottom_right
        terrain_fill_center_center
        terrain_fill_center_left
        terrain_fill_center_right
        terrain_fill_top_center
        terrain_fill_top_left
        terrain_fill_top_right
        */
    }

    static RenderData = {
        screenShake:{
            x:0,
            y:0,
            duration:0,
            defaultDuration:60
        }
    };
    static beforeRender(){
        if(MapRenderer.RenderData.screenShake.duration>0){
            MapRenderer.RenderData.screenShake.duration-=1;
            //since this is a rendering effect, no need to sync over network, can use random()
            MapRenderer.RenderData.screenShake.x=Math.random()*5-Math.random()*5;
            MapRenderer.RenderData.screenShake.x=Math.random()*5-Math.random()*5;
            MapRenderer.RenderData.screenShake.y=0;
        }else{
            MapRenderer.RenderData.screenShake.x=0;
            MapRenderer.RenderData.screenShake.y=0;
        }


        
        Fes.R.screenX += MapRenderer.RenderData.screenShake.x
        Fes.R.screenY += MapRenderer.RenderData.screenShake.y;
        
    }
    static screenShake(){
        MapRenderer.RenderData.screenShake.duration = MapRenderer.RenderData.screenShake.defaultDuration;
    }
}


export { MapRenderer };