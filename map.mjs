//import { ProcMapGen } from "./terrain/mapgen_procedural.mjs";
import { FileMapGen } from "./terrain/mapgen_file.mjs";

class Map {
    //stores the actual map data. Do not access this from other classes
    //instead use a getter/setter function
    static init(callback) {
        FileMapGen.load(callback);
    }
    //--getters & setters
    static setData(loadData) {
        //"loadData" is minimally:
        /*{
            height: <value>,
            width: <value>,
            data: [<1d-array of size width*height>]
        }*/
        let mapData = {
            width: loadData.width,
            height: loadData.height,
            binary: new Uint32Array(Math.ceil(loadData.width * loadData.height / 32))
        };
        for (let i = 0; i < loadData.data.length; i += 1) {
            if (loadData.data[i]) {
                let binIdx = Math.floor(i / 32);
                let binBitIdx = (i % 32);
                let binValue = mapData.binary[binIdx];
                binValue = Map.bitSet(binValue, binBitIdx);
                mapData.binary[binIdx] = binValue;
            }
        }
        Fes.data.map = mapData;
    }
    static getMapWidthInTiles() {
        return Fes.data.map.width;
    }
    static getMapHeightInTiles() {
        return Fes.data.map.height;
    }
    static getValueForTile(tileX, tileY) {
        let idx = (tileY * Fes.data.map.width) + tileX;
        let binIdx = Math.floor(idx / 32);
        let binBitIdx = (idx % 32);
        let binValue = Fes.data.map.binary[binIdx];
        let result = Map.bitTest(binValue, binBitIdx);
        return result;
    }
    //https://stackoverflow.com/questions/1436438/how-do-you-set-clear-and-toggle-a-single-bit-in-javascript
    static bitTest(num, bit) {
        return ((num >> bit) % 2 != 0)
    }
    static bitSet(num, bit) {
        return num | 1 << bit;
    }
    static bitClear(num, bit) {
        return num & ~(1 << bit);
    }
    static serialise() {
        //NOTE: does not seriliase or deserilase array dimensions, assumes those are already set
        return JSON.stringify(Array.from(Fes.data.map.binary));
    }
    static deserialise(str) {
        Fes.data.map.binary = new Uint32Array(JSON.parse(str));
    }
    //--private methods
    static bresenhamFloat(x0, y0, x1, y1) {
        //https://gamedev.stackexchange.com/questions/81267/how-do-i-generalise-bresenhams-line-algorithm-to-floating-point-endpoints/182143#182143
        var res = {
            x: x1,
            y: y1
        };

        let x = Math.floor(x0);
        let y = Math.floor(y0);
        let diffX = x1 - x0;
        let diffY = y1 - y0;
        let stepX = Math.sign(diffX);
        let stepY = Math.sign(diffY);
        let xOffset = x1 > x0 ?
            (Math.ceil(x0) - x0) :
            (x0 - Math.floor(x0));
        let yOffset = y1 > y0 ?
            (Math.ceil(y0) - y0) :
            (y0 - Math.floor(y0));
        let angle = Math.atan2(-diffY, diffX);
        let tMaxX = xOffset / Math.cos(angle);
        let tMaxY = yOffset / Math.sin(angle);
        let tDeltaX = 1.0 / Math.cos(angle);
        let tDeltaY = 1.0 / Math.sin(angle);
        let manhattanDistance = Math.abs(Math.floor(x1) - Math.floor(x0)) +
            Math.abs(Math.floor(y1) - Math.floor(y0));
        for (let t = 0; t <= manhattanDistance; ++t) {
            if (Map.place_free(x, y)) {
                res.x = x;
                res.y = y;
            } else {
                break;
            }
            //Only move in either X or Y coordinates, not both.
            if (Math.abs(tMaxX) < Math.abs(tMaxY)) {
                tMaxX += tDeltaX;
            x += stepX;
            } else {
                tMaxY += tDeltaY;
            y += stepY;
            }
        }
        return res;
    }
    static bresenham(x0, y0, x1, y1) {
        let res = {
            x: x1,
            y: y1,
            collision: Map.COLLISION_KIND.NONE
        };
        //bresenham should operate on tile coords
        let startTileX = Map.pointToTile(x0);
        let startTileY = Map.pointToTile(y0);
        let endTileX = Map.pointToTile(x1);
        let endTileY = Map.pointToTile(y1);
        if (startTileX == endTileX && startTileY == endTileY) {
            //moving within a single tile, can just check that one
            //either move to the target (no coliision), or stay at start point (collision)
            if (!Map.place_free(x1, y1)) { //must have started inside a collision cell
                res.x = x0;
                res.y = y0;
                res.collision = Map.COLLISION_KIND.INSIDE;
            }
            return res;
        }
        //https://stackoverflow.com/questions/4672279/bresenham-algorithm-in-javascript
        let dx = Math.abs(endTileX - startTileX);
        let dy = Math.abs(endTileY - startTileY);
        let sx = (startTileX < endTileX) ? 1 : -1;
        let sy = (startTileY < endTileY) ? 1 : -1;
        let err = dx - dy;
        //if we got here, break the end point into steps
        x1 = x0;
        y1 = y0;
        while (true) {
            if (x1 != x0 || y1 != y0) { //don't do collision check on 1st iteration
                const collisionCheck = Map.tileLineCollisiion(x0, y0, x1, y1);
                if (collisionCheck) {
                    res.collision = collisionCheck;
                    res.x=x0;
                    res.y=y0;
                    return res;
                }
                //update the collision line start point to the next cell
                x0 = x1;
                y0 = y1;
            }
            if ((startTileX === endTileX) && (startTileY === endTileY)) {
                break; //if got here, no collisions over entire line, return the desired endpoint
            }
            let e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                startTileX += sx;
                x1 += sx * Fes.R.TILE_SIZE;
            }
            if (e2 < dx) {
                err += dx;
                startTileY += sy;
                y1 += sy * Fes.R.TILE_SIZE;
            }
        }

        return res;
    }
    //https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
    static COLLISION_KIND = {
        NONE: 0, //use 0 so it can be used in an "if" statement 
        LEFT: 1,
        RIGHT: 2,
        TOP: 3,
        BOTTOM: 4,
        INSIDE: 5
    };
    static CCW(p1, p2, p3) {
        return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
    }
    static lineIntersect(source, dest) {
        let p1 = { x: source.x1, y: source.y1 };
        let p2 = { x: source.x2, y: source.y2 };
        let p3 = { x: dest.x1, y: dest.y1 };
        let p4 = { x: dest.x2, y: dest.y2 };
        return (Map.CCW(p1, p3, p4) != Map.CCW(p2, p3, p4)) && (Map.CCW(p1, p2, p3) != Map.CCW(p1, p2, p4));
    }
    static tileLineCollisiion(startX, startY, endX, endY) {
        if (!Map.place_free(endX, endY)) {
            const startTileX = Map.pointToTile(startX);
            const startTileY = Map.pointToTile(startY);
            const endTileX = Map.pointToTile(endX);
            const endTileY = Map.pointToTile(endY);
            if (startTileX == endTileX &&
                startTileY == endTileY) {
                return Map.COLLISION_KIND.INSIDE;
            }
            //convert the tile coords to screen coords for collision checks
            const collisionCellX = endTileX*Fes.R.TILE_SIZE;
            const collisionCellY = endTileY*Fes.R.TILE_SIZE;
            let collisionCellWidth = Fes.R.TILE_SIZE;
            let collisionCellHeight = Fes.R.TILE_SIZE;
            let source = {
                x1: startX,
                y1: startY,
                x2: endX,
                y2: endY
            };
            let destLeft = {
                x1: collisionCellX,
                y1: collisionCellY,
                x2: collisionCellX,
                y2: collisionCellY + collisionCellHeight
            };
            let destRight = {
                x1: collisionCellX + collisionCellWidth,
                y1: collisionCellY,
                x2: collisionCellX + collisionCellWidth,
                y2: collisionCellY + collisionCellHeight
            };
            let destTop = {
                x1: collisionCellX,
                y1: collisionCellY,
                x2: collisionCellX + collisionCellWidth,
                y2: collisionCellY
            };
            let destBottom = {
                x1: collisionCellX,
                y1: collisionCellY + collisionCellHeight,
                x2: collisionCellX + collisionCellWidth,
                y2: collisionCellY + collisionCellHeight
            };
            if (Map.lineIntersect(source, destRight)) {
                return Map.COLLISION_KIND.RIGHT;
            }
            if (Map.lineIntersect(source, destLeft)) {
                return Map.COLLISION_KIND.LEFT;
            }
            if (Map.lineIntersect(source, destTop)) {
                return Map.COLLISION_KIND.TOP;
            }
            if (Map.lineIntersect(source, destBottom)) {
                return Map.COLLISION_KIND.BOTTOM;
            }
        }
        return Map.COLLISION_KIND.NONE; //no collision
    }
    static getValueForXY(x, y) {
        return Map.getValueForTile(Map.pointToTile(x), Map.pointToTile(y));
    }
    //--public methods
    static destroy_tile_at_xy(x, y) {
        const tileX = Map.pointToTile(x);
        const tileY = Map.pointToTile(y);
        let idx = (tileY * Fes.data.map.width) + tileX;
        let binIdx = Math.floor(idx / 32);
        let binBitIdx = (idx % 32);
        let binValue = Fes.data.map.binary[binIdx];
        let result = Map.bitClear(binValue, binBitIdx);
        Fes.data.map.binary[binIdx] = result;
    }
    static create_tile_at_xy(x, y) {
        const tileX = Map.pointToTile(x);
        const tileY = Map.pointToTile(y);
        let idx = (tileY * Fes.data.map.width) + tileX;
        let binIdx = Math.floor(idx / 32);
        let binBitIdx = (idx % 32);
        let binValue = Fes.data.map.binary[binIdx];
        let result = Map.bitSet(binValue, binBitIdx);
        Fes.data.map.binary[binIdx] = result;
    }
    static place_free(x, y) {
        if (x < 0 || x > Fes.data.map.width * Fes.R.TILE_SIZE ||
            y < 0 || y > Fes.data.map.height * Fes.R.TILE_SIZE) {
            return false;
        }
        //collision check, per tile
        if (Map.getValueForXY(x, y)) {
            return false;
        }
        return true;
    }
    static move_contact_solid(entity, destX, destY) {
        let ecs = Fes.data.ecs;
        var res = Map.bresenham(ecs.components.position.x[entity], ecs.components.position.y[entity], destX, destY);
        ecs.components.position.x[entity] = res.x;
        ecs.components.position.y[entity] = res.y;
    }
    static move_contact_solid_angle(entity, angle_deg, distance) {
        let ecs = Fes.data.ecs;
        let angle_rad = angle_deg * 0.0174533;
        let xOff = Math.cos(angle_rad) * distance;
        let yOff = -1 * Math.sin(angle_rad) * distance;
        let destX = ecs.components.position.x[entity] + xOff;
        let destY = ecs.components.position.y[entity] + yOff;
        var res = Map.bresenhamFloat(ecs.components.position.x[entity], ecs.components.position.y[entity], destX, destY);
        ecs.components.position.x[entity] = res.x;
        ecs.components.position.y[entity] = res.y;
    }
    static pointToTile(p) { //used by pathfinding
        return Math.floor(p / Fes.R.TILE_SIZE);
    }
    //returns a hash of the map, to be used to detect if the map has changed
    static getChecksum() {
        let result = "";
        for (let i = 0; i < Fes.data.map.binary.length; i += 1) {
            result += Fes.data.map.binary[i];
        }
        return result;
    }

}


export {
    Map
};