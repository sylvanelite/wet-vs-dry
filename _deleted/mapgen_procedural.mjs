import { Map } from "../map.mjs";
import { MapGen } from "./mapgen.mjs";
import { FileMapGen } from "./mapgen_file.mjs";
import { Cave } from "./data/cavegen.mjs"
import { MapRenderer } from "./map_renderer.mjs";

class ProcMapGen {
	static generateTerrain(seed){
		console.log(seed);
        let a = seed;
        let b = seed;
        let c = seed;
        let d = seed;
		let prng = function(){
			a |= 0; b |= 0; c |= 0; d |= 0;
			const t = a - (b << 23 | b >>> 9) | 0;
			a = b ^ (c << 16 | c >>> 16) | 0;
			b = c + (d << 11 | d >>> 21) | 0;
			b = c + d | 0;
			c = d + t | 0;
			d = a + t | 0;
			return (d >>> 0) / 4294967296;
		}
		const cave = Cave.generate;
		const width = 50;
		const height = 50;
		const grid = Cave.zeros([ width, height ]);
		grid.width = width;
		grid.height = height;
		// Fill the grid with random points,
		// returning an "iterate" method.
		const iterate = cave(grid, {
			density: 0.5, 
			threshold: 5, 
			hood: 1, 
			fill: true,
			rng:prng
		});
		iterate(4);
        Map.setData(grid);
	}
	static generateObjects(){
		let objects = [{
				"name":"player",
				"x":96, "y":240
			}, {
				"name":"networking",
				"x":0, "y":0
			},{
				"name":"orchestrator",
				"x":0, "y":0
		}];
		for(let obj of objects){
			FileMapGen.createObejct(obj);
		}
	}
    static load(callback){
		let seed = MapGen.getSeedForString(Fes.engine.instanceName);
		ProcMapGen.generateTerrain(seed);
		ProcMapGen.generateObjects();
        MapRenderer.init();
		callback();
    }
}

export { ProcMapGen };