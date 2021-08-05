import {Map} from "../map.mjs";
import {MapRenderer} from "./map_renderer.mjs";

class MapGen {
    static getSeedForString (str){
        let seed = 42;
        for(let i=0;i<str.length;i+=1){
            let charCode = str.charCodeAt(i);
            // use a pairing functtion to combine numbers
            //https://math.stackexchange.com/questions/23503/create-unique-number-from-2-numbers
            seed=Math.floor((0.5*(charCode+seed)*(charCode+seed+1)+seed))%1000000;
        }
        return seed;
    }
}

export { MapGen };