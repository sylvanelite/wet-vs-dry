import Howl  from "../lib/howler.mjs";

class Audio {

    static imageCache = {};
    
    static init (){
        let h = new Howl();
        console.log(h);
    }

}


export { Audio };