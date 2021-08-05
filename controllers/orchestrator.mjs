import { defineSystem,types } from "../ecs.js";
import { Enemy } from "../interactable/enemy/enemy.mjs";
import { Map } from "../map.mjs";

class Orchestrator {
    //this entity should essentially be a singleton.
    //Orchestrator is for controlling when AI spawns, global game objectives, etc
    static init(owner) {
        const ecs = Fes.data.ecs;
        const self = ecs.createEntity();
        ecs.addComponent(self, "orchestrator");
        ecs.components.orchestrator.rnga[self] = 42;
        ecs.components.orchestrator.rngb[self] = 42;
        ecs.components.orchestrator.rngc[self] = 42;
        ecs.components.orchestrator.rngd[self] = 42;

        ecs.components.orchestrator.nextWave[self] = 60*10;//60 frames per sec, 10 sec = 10 sec

        return self;
    }
    static defineComponents(){        
        //TODO: defining components is relatively wateful
        //      get sync for free, but there will only be 1 entity for e.g. 10000 allocated components  
        Fes.data.ecs.defineComponent("orchestrator",{
            rnga:types.int32,//PRNG state
            rngb:types.int32,
            rngc:types.int32,
            rngd:types.int32,
            nextWave:types.int32
        });
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("orchestrator");
        const system = defineSystem(query, Orchestrator.update);
        s.push(system);
    }
    static prng(entity){
        const ecs = Fes.data.ecs;
        let a = ecs.components.orchestrator.rnga[entity];
        let b = ecs.components.orchestrator.rngb[entity];
        let c = ecs.components.orchestrator.rngc[entity];
        let d = ecs.components.orchestrator.rngd[entity];

        a |= 0; b |= 0; c |= 0; d |= 0;
        const t = a - (b << 23 | b >>> 9) | 0;
        a = b ^ (c << 16 | c >>> 16) | 0;
        b = c + (d << 11 | d >>> 21) | 0;
        b = c + d | 0;
        c = d + t | 0;
        d = a + t | 0;

        ecs.components.orchestrator.rnga[entity] = a;
        ecs.components.orchestrator.rngb[entity] = b;
        ecs.components.orchestrator.rngc[entity] = c;
        ecs.components.orchestrator.rngd[entity] = d;

        return (d >>> 0) / 4294967296;
    }
    static update(entity){
        const ecs = Fes.data.ecs;
        //re-seed the PRNG each frame. Probably not needed since the internal state is synced anyway
        let seed = Fes.engine.frameCount;
        ecs.components.orchestrator.rnga[entity] = seed;
        ecs.components.orchestrator.rngb[entity] = seed;
        ecs.components.orchestrator.rngc[entity] = seed;
        ecs.components.orchestrator.rngd[entity] = seed;

        if(Fes.data.networking&&Fes.data.networking.isStarted){
            Orchestrator.updateWaves(entity);
        }
    }
    static updateWaves(entity){
        const ecs = Fes.data.ecs;
        ecs.components.orchestrator.nextWave[entity]-=1;
        if(ecs.components.orchestrator.nextWave[entity]<=0){
            ecs.components.orchestrator.nextWave[entity] = Math.ceil(60*10+5*Orchestrator.prng(entity)-5*Orchestrator.prng(entity));
            const w = Map.getMapWidthInTiles()*Fes.R.TILE_SIZE;
            const h = Map.getMapHeightInTiles()*Fes.R.TILE_SIZE;
            for(let i=0;i<Orchestrator.prng(entity)*50;i+=1){
                Enemy.init({
                    x: w*Orchestrator.prng(entity),
                    y: h*Orchestrator.prng(entity)
                });
            }
        }

    }
}


export { Orchestrator };