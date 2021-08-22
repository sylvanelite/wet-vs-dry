import { defineSystem,types } from "../ecs.js";
import { Collision } from "./collision.mjs";
import { MainMenuEntity } from "./menu.mjs";
import { MapRenderer } from "../terrain/map_renderer.mjs";
import { ParallaxRenderer } from  "../terrain/parallax_renderer.mjs";

class Stocks {

    static imageCache = {};

    static getImgData(imgName){
        const ecs = Fes.data.ecs;
        if(Stocks.imageCache[imgName] == null){
            //start loading
            let img = new Image();
            Stocks.imageCache[imgName] = {
                image:img,
                isLoaded:false
            };
            img.onload = function(){
                Stocks.imageCache[imgName].isLoaded = true;
            };
            img.src = "./assets/"+imgName+".png";
        }
        if(Stocks.imageCache[imgName].isLoaded){
            return Stocks.imageCache[imgName].image;
        }
    }

    static StockState = {
        numberAlive:0,
        renderPosition:0,
        isRunning:true,//flag when hitting the victory screen to preven it from changing
        isPlayerVicotry:false
    };
    static OK_BUTTON = {
        text:"Ok",
        x:380,y:300,
        width:100,
        height:64
    };
    //outside of this box is the death zone
    static ARENA_BOUNDS = {
        //rect collision (x is centered, y is the objects floor)
        x:(896)/2+128,//w and h are "bounds" from map.json
        y:(480)+128,
        width:896,
        height:480
    };
    static addToEntity(entity) {
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity, "stocks");
        ecs.components.stocks.stockCount[entity] = 3;
        return self;
    }
    static defineComponents(){        
        Fes.data.ecs.defineComponent("stocks",{
            stockCount:types.int32
        });
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("stocks");
        const system = defineSystem(query, Stocks.update,
            Stocks.beforeUpdate,
            Stocks.afterUpdate);
        s.push(system);
    }
    static defineRenderSystems(ecs, s) {
        const query = ecs.createQuery("stocks");
        const system = defineSystem(query, Stocks.render,
            Stocks.beforeRenderUpdate);
        s.push(system);
    }
    static beforeUpdate(){
        //keep track of the running total of stocks each frame
        Stocks.StockState.numberAlive = 0;
    }
    static afterUpdate(){
        const ecs = Fes.data.ecs;
        if(Stocks.isGameOver()){
            //"ok" button to restart the game, check mouse handling
            if(Stocks.isMouseOverRect(Stocks.OK_BUTTON)){
                if(Fes.engine.controls.Mouse_Left_Pressed){
                    window.location.reload();
                }
            }
            if(Stocks.StockState.isRunning){
                //prevent stocks from changing after the victory screen is displayed
                Stocks.StockState.isRunning = false;
                Stocks.StockState.isPlayerVicotry = (ecs.components.stocks.stockCount[Fes.data.player]>0);
            }
        }
    }
    static beforeRenderUpdate(){
        Stocks.StockState.renderPosition = 0;
        
        //re-render the parallax FG layer so it appears above the players, but with transparancy
        const ctx = Fes.R.varCtx;
        if(!MainMenuEntity.isInMenu()){
            ctx.globalAlpha = 0.5;
            ParallaxRenderer.renderFG();
            ctx.globalAlpha = 1;
        }
        //render death explosions
        const hitFrameRate = 0.1;
        for(const hit of Stocks.hitData.hits){
            
            //direction (default is bottom)
            if(hit.modifier=="_left"){
                hit.x = Fes.R.screenX+hit.size/2;
            }
            if(hit.modifier=="_right"){
                hit.x = Fes.R.screenX+Fes.R.SCREEN_WIDTH-hit.size/2;
            }
            if(hit.modifier=="_top"){
                hit.y = Fes.R.screenY+hit.size;
            }
            if(hit.modifier==""){
                hit.y = Fes.R.screenY+Fes.R.SCREEN_HEIGHT;
            }
            hit.duration-=hitFrameRate;
            const img = Stocks.getImgData("fx/explode"+hit.modifier);
            if(img){
                const frameWidth = hit.size;
                const frameHeight = hit.size;
                const imgFrameX = hit.frame * frameWidth;
                const imgFrameY = 0;
                ctx.drawImage(img,
                    Math.floor(imgFrameX),
                    Math.floor(imgFrameY),
                    Math.floor(frameWidth),
                    Math.floor(frameHeight),
                    Math.floor(hit.x- Fes.R.screenX-frameWidth/2),
                    Math.floor(hit.y- Fes.R.screenY-frameHeight),
                    Math.floor(frameWidth),
                    Math.floor(frameHeight));
            }
        }
        //remove hitboxes that are done
        for(let i=Stocks.hitData.hits.length-1;i>=0;i-=1){
            if(Stocks.hitData.hits[i].duration<=0){
                Stocks.hitData.hits.splice(i,1);
            }
        }
    }
    static hitData = {
        hits:[]
    };
    static renderExplosion(hit){
        hit.duration=3;
        hit.frame = Math.floor(Math.random()*4);
        hit.size = 128;
        hit.modifier = "";
        //direction (default is bottom)
        if(hit.x<=Stocks.ARENA_BOUNDS.x-Stocks.ARENA_BOUNDS.width/2){
            hit.modifier="_left";
        }
        if(hit.x>=Stocks.ARENA_BOUNDS.x+Stocks.ARENA_BOUNDS.width/2){
            hit.modifier="_right";
        }
        if(hit.y<=Stocks.ARENA_BOUNDS.y-Stocks.ARENA_BOUNDS.height){
            hit.modifier="_top";
        }
        console.log(hit);
        Stocks.hitData.hits.push(hit);
    }
    static isGameOver(){
        //don't check for game over if the main menu is open
        if(MainMenuEntity.isInMenu()){
            return false;
        }
        if(Stocks.StockState.numberAlive<=1){
            //check for game over
            return true;
        }
        return false;
    }
    static isPlayerEntity(entity){
        //multiplayer mode, need to return true/false based on if you're the host or not
        if(Fes.data.networking){
            if(Fes.data.networking.isHost){
                return (Fes.data.player === entity);
            }else{
                return (Fes.data.player !== entity);
            }
        }
        //single player mode, just return true/false if it's the local player or not
        return (Fes.data.player === entity);
    }
    static update(entity){
        if(!Stocks.StockState.isRunning){
            return;
        }
        const ecs = Fes.data.ecs;
        //keep track of the number of alive players
        if(ecs.components.stocks.stockCount[entity]>0){
            Stocks.StockState.numberAlive += 1;
        }
        //check for out-of-bounds players
        const obj = {
            x:ecs.components.position.x[entity],
            y:ecs.components.position.y[entity],
            width:ecs.components.size.width[entity],
            height:ecs.components.size.height[entity]
        };
        if(!Collision.rectRectCollision(obj,Stocks.ARENA_BOUNDS)){
            //outside bounds, KO
            ecs.components.stocks.stockCount[entity]-=1;
            ecs.components.cbtState.percent[entity] = 0;//reset the player's percent
            ecs.components.knockback.kbMagnitude[entity] = 0;//reset the player's knockback & stun
            ecs.components.knockback.kbStunFrames[entity] = 0;
            //set x spawn points
            let xSpawn = 600;
            if(Stocks.isPlayerEntity(entity)){
                xSpawn = 288;
            }
            Stocks.renderExplosion({
                x:ecs.components.position.x[entity],
                y:ecs.components.position.y[entity]
            });
            MapRenderer.screenShake();
            ecs.components.position.x[entity] = xSpawn;
            ecs.components.position.y[entity] = 320;
        }
    }
    static render(entity){
        const ctx = Fes.R.varCtx;
        const ecs = Fes.data.ecs;
        if(MainMenuEntity.isInMenu()){
            return;
        }
        //render on the right for everyone except the local player
        //should only be 1-1 so this might be ok
        let renderX = Fes.R.SCREEN_WIDTH-128;
        const renderY =  Fes.R.SCREEN_HEIGHT-64;
        let renderYOffset = Stocks.StockState.renderPosition;
        if(Stocks.isPlayerEntity(entity)){
            renderX = 64;
            renderYOffset = 0;
        }
        for(var i=0;i<ecs.components.stocks.stockCount[entity];i+=1){
            const img = Stocks.getImgData("stocks/stock");
            if(img){
                ctx.drawImage(img,renderX+i*34,renderY+renderYOffset);
            }
        }
        if(!Stocks.isPlayerEntity(entity)){
            Stocks.StockState.renderPosition-=36;
        }
        
        if(Stocks.isGameOver()){
            //render "victory" screen
            let menuX = 250;
            let menuY = 32;
            ctx.fillStyle = '#c4c4c4';
            ctx.fillRect(menuX-25, menuY-25, 330, 330);
            //host sees all entrants
            Fes.R.drawText("Game Over:", menuX,menuY );
            let victory = Stocks.StockState.isPlayerVicotry;
            if(victory){
                Fes.R.drawText("Victory!", menuX,menuY+32 );
            }else{
                Fes.R.drawText("Defeat", menuX,menuY+32 );
            }

            ctx.fillStyle = '#c4c4c4';
            if(Stocks.isMouseOverRect(Stocks.OK_BUTTON)){
                ctx.fillStyle = '#00FF00';
            }
            ctx.fillRect(Stocks.OK_BUTTON.x-Stocks.OK_BUTTON.width/2, Stocks.OK_BUTTON.y-Stocks.OK_BUTTON.height,  Stocks.OK_BUTTON.width, Stocks.OK_BUTTON.height);
            ctx.strokeStyle = "#000000";
            ctx.beginPath();
            ctx.rect(Stocks.OK_BUTTON.x-Stocks.OK_BUTTON.width/2-0.5, Stocks.OK_BUTTON.y-Stocks.OK_BUTTON.height-0.5,  Stocks.OK_BUTTON.width, Stocks.OK_BUTTON.height);
            ctx.stroke();
            Fes.R.drawText(Stocks.OK_BUTTON.text, Stocks.OK_BUTTON.x-(Stocks.OK_BUTTON.text.length*16)/2, Stocks.OK_BUTTON.y-Stocks.OK_BUTTON.height/2-8 );

        }
    }

    
	static isMouseOverRect(display){
		let mousePos = {
			x:Fes.engine.controls.Mouse_Screen_X-1,
			y:Fes.engine.controls.Mouse_Screen_Y-1,
			width:2,
			height:2
		};
		return Stocks.collisionCheck(display,mousePos);//TODO: collisionCheck
	}
    static collisionCheck (objA,objB){
        //rect collision (x is centered, y is the objects floor)
        if (objA.x-objA.width/2 < objB.x+objB.width/2 && objA.x+objA.width/2 > objB.x-objB.width/2 &&
          objA.y-objA.height < objB.y && objA.y > objB.y-objB.height){
              return true;
          }
        return false;
    }
}


export { Stocks };