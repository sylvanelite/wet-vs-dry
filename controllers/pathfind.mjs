
import { defineSystem,types } from "../ecs.js";
import { Map } from "../map.mjs";

class Pathfind{
    static PATH_KIND ={
        LINE:0,         //move directly to the target (ignore terrain)
        A_STAR:1,       //A* search over terrain
        A_STAR_WALL:2   // prefer sticking to walls
    }
    static EasyStar     = new EasyStar.js();
    static EasyStarWall = new EasyStar.js();

    static addToEntity(entity){
        const ecs = Fes.data.ecs;
        ecs.addComponent(entity,"pathfind");
        ecs.components.pathfind.targetx[entity] = ecs.components.position.x[entity];
        ecs.components.pathfind.targety[entity] = ecs.components.position.y[entity];
        ecs.components.pathfind.stepx[entity] = ecs.components.position.x[entity];
        ecs.components.pathfind.stepy[entity] = ecs.components.position.y[entity];
        ecs.components.pathfind.kind[entity] = Pathfind.PATH_KIND.LINE;
    }
    static defineComponents(){        
        Fes.data.ecs.defineComponent("pathfind",{
            targetx:types.float64,//set by the entity for its desired endpoint
            targety:types.float64,
            stepx:types.float64,  //set by this controller for the next step
            stepy:types.float64,  
            kind:types.int8,      //which pathfinding algorithm to use
        });
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("pathfind");
        const system = defineSystem(query, Pathfind.updatePathfind,Pathfind.beforePathfind);
        s.push(system);
    }
    static beforePathfind(){
        //update the pathfinding instance with any map changes.
        //TODO: this could have bad performance, grid only needs to change if the map has updated?
        //      additionally setup params don't need to be done every loop
        let checksum = Map.getChecksum();
        if(checksum!=Pathfind.EasyStar.checksum){
            Pathfind.EasyStar.checksum = checksum;
            let grid = [];
            const mapWidth = Map.getMapWidthInTiles();
            const mapHeight = Map.getMapHeightInTiles();
            for (let y =0;y<mapHeight; y += 1) {
                let row = [];
                for (let x =0;x<mapWidth;x+=1) {
                    const tile = Map.getValueForTile(x,y);
                    row.push((tile?1:0));//tile returns true/false, but grid uses strict equality, convert to int for safety
                }
                grid.push(row);
            }
            //Pathfind.EasyStar.enableDiagonals();
            Pathfind.EasyStar.setAcceptableTiles([0]);
            Pathfind.EasyStar.setGrid(grid);
            Pathfind.EasyStar.enableSync();//run synchroniously because we frames to stay in lockstep

            //fill non-edge cells with higher cost
            Pathfind.EasyStarWall.setAcceptableTiles([0]);
            Pathfind.EasyStarWall.setGrid(grid);
            Pathfind.EasyStarWall.enableSync();//run synchroniously because we frames to stay in lockstep
            for (let y =1;y<mapHeight-1; y += 1) {
                for (let x =1;x<mapWidth-1;x+=1) {
                    const tileU = Map.getValueForTile(x,y-1);
                    const tileD = Map.getValueForTile(x,y+1);
                    const tileL = Map.getValueForTile(x-1,y);
                    const tileR = Map.getValueForTile(x+1,y);
                    const tile  = Map.getValueForTile(x,y);
                    if(!tileU&&!tileD&&!tileL&&!tileR&&!tile){
                        Pathfind.EasyStarWall.setAdditionalPointCost(x,y,999);
                    }
                }
            }
        }
    }
    static updatePathfind(entity){
        const ecs = Fes.data.ecs;
        const kind = ecs.components.pathfind.kind[entity];
        switch(kind){
            case Pathfind.PATH_KIND.LINE:
                Pathfind.updatePathfindLine(entity);
                break;
            case Pathfind.PATH_KIND.A_STAR:
                Pathfind.updatePathfindAStar(entity);
                break;
            case Pathfind.PATH_KIND.A_STAR_WALL:
                Pathfind.updatePathfindAStarWall(entity);
                break;
            default:
                console.log("pathfinding invalid for entity:"+entity);
        }
    }
    static updatePathfindLine(entity){
        const ecs = Fes.data.ecs;
        ecs.components.pathfind.stepx[entity] = ecs.components.pathfind.targetx[entity];
        ecs.components.pathfind.stepy[entity] = ecs.components.pathfind.targety[entity];
    }
    static updatePathfindAStar(entity){
        const ecs = Fes.data.ecs;
        let startX = ecs.components.position.x[entity];
        let startY = ecs.components.position.y[entity]-ecs.components.size.height[entity]/2;//feet will be at bottom of tile, move aim up
        let endX   = ecs.components.pathfind.targetx[entity];
        let endY   = ecs.components.pathfind.targety[entity];
        const w = Map.getMapWidthInTiles()*Fes.R.TILE_SIZE;
        const h = Map.getMapHeightInTiles()*Fes.R.TILE_SIZE;
        if(startX<0||startX>=w||endX<0||endX>=w||
           startY<0||startY>=h||endY<0||endY>=h){
            console.log("out of boundsA",startX, startY, endX, endY);
            //easystar crashes if out of bounds, set the obj to be linear moving into the grid
            ecs.components.pathfind.stepx[entity] = ecs.components.pathfind.targetx[entity];
			ecs.components.pathfind.stepy[entity] = ecs.components.pathfind.targety[entity];
            return;
        }
        //pathfinding is done on tiles, need to convert 
        startX = Map.pointToTile(startX);
        startY = Map.pointToTile(startY);
        endX   = Map.pointToTile(endX);
        endY   = Map.pointToTile(endY);
        Pathfind.EasyStar.findPath(startX, startY, endX, endY, function(path){
            //callback
            if(!path){//no path found, move linearly
                ecs.components.pathfind.stepx[entity] = ecs.components.pathfind.targetx[entity];
                ecs.components.pathfind.stepy[entity] = ecs.components.pathfind.targety[entity];
                return;
            }
            if(!path.length){//reached end of path
                return;
            }
            path.shift();//1st point is the start point, don't need since we're already there
            const nextPoint = path.shift();
            const pathX = nextPoint.x;
            const pathY = nextPoint.y;
            ecs.components.pathfind.stepx[entity] = pathX*Fes.R.TILE_SIZE+Fes.R.TILE_SIZE/2;
			ecs.components.pathfind.stepy[entity] = pathY*Fes.R.TILE_SIZE+Fes.R.TILE_SIZE;
            //step targets are rounded to a tile, if we're there, give the exact coords
            if(pathX==endX){
                ecs.components.pathfind.stepx[entity] = ecs.components.pathfind.targetx[entity];
            }
            if(pathY==endY){
                ecs.components.pathfind.stepy[entity] = ecs.components.pathfind.targety[entity];
            }

        });
        Pathfind.EasyStar.calculate();
    }
    static updatePathfindAStarWall(entity){
        const ecs = Fes.data.ecs;
        let startX = ecs.components.position.x[entity];
        let startY = ecs.components.position.y[entity]-ecs.components.size.height[entity]/2;//feet will be at bottom of tile, move aim up
        let endX   = ecs.components.pathfind.targetx[entity];
        let endY   = ecs.components.pathfind.targety[entity];
        //pathfinding is done on tiles, need to convert 
        startX = Map.pointToTile(startX);
        startY = Map.pointToTile(startY);
        endX   = Map.pointToTile(endX);
        endY   = Map.pointToTile(endY);
        const w = Map.getMapWidthInTiles()*Fes.R.TILE_SIZE;
        const h = Map.getMapHeightInTiles()*Fes.R.TILE_SIZE;
        if(startX<0||startX>=w||endX<0||endX>=w||
           startY<0||startY>=h||endY<0||endY>=h){
            console.log("out of boundsB",startX, startY, endX, endY);
            //easystar crashes if out of bounds, set the obj to be linear moving into the grid
            ecs.components.pathfind.stepx[entity] = ecs.components.pathfind.targetx[entity];
			ecs.components.pathfind.stepy[entity] = ecs.components.pathfind.targety[entity];
            return;
        }
        Pathfind.EasyStarWall.findPath(startX, startY, endX, endY, function(path){
            //callback
            if(!path){//no path found, move linearly
                ecs.components.pathfind.stepx[entity] = ecs.components.pathfind.targetx[entity];
                ecs.components.pathfind.stepy[entity] = ecs.components.pathfind.targety[entity];
                return;
            }
            if(!path.length){//Treached end of path
                return;
            }
            path.shift();//1st point is the start point, don't need since we're already there
            const nextPoint = path.shift();
            const pathX = nextPoint.x;
            const pathY = nextPoint.y;
            ecs.components.pathfind.stepx[entity] = pathX*Fes.R.TILE_SIZE+Fes.R.TILE_SIZE/2;
			ecs.components.pathfind.stepy[entity] = pathY*Fes.R.TILE_SIZE+Fes.R.TILE_SIZE;
            //step targets are rounded to a tile, if we're there, give the exact coords
            if(pathX==endX){
                ecs.components.pathfind.stepx[entity] = ecs.components.pathfind.targetx[entity];
            }
            if(pathY==endY){
                ecs.components.pathfind.stepy[entity] = ecs.components.pathfind.targety[entity];
            }

        });
        Pathfind.EasyStarWall.calculate();
    }
    
}


export { Pathfind };