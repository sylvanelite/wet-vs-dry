import {defineSystem,types} from "../../ecs.js";
import {Collision} from "../../controllers/collision.mjs";

class Judge {

    static MODE={
        GREEN:0,
        YELLOW:1,
        RED:2,
        BLACK:3
    };
    static MAX_HP=100;
    
    static init(data){
        const ecs = Fes.data.ecs;
        const self = ecs.createEntity();
        ecs.addComponent(self,"position");
        ecs.components.position.x[self] = data.x;
        ecs.components.position.y[self] = data.y;
        ecs.addComponent(self,"size");
        ecs.components.size.width[self] = 64;
        ecs.components.size.height[self] = 64;
        ecs.addComponent(self,"judge");
        ecs.components.judge.hp[self] = Judge.MAX_HP;
        ecs.components.judge.mode[self] = Judge.MODE.GREEN;
        ecs.components.judge.targetX[self] = data.x;
        ecs.components.judge.targetY[self] = data.y;
        for(const prop of data.properties){
            if(prop.name == "targetX"||prop.name == "targetY"){
                console.log(prop.name, parseFloat(prop.value));
                ecs.components.judge[prop.name][self] = parseFloat(prop.value);
            }
        }
        return self;
    }

    static defineRenderSystems(ecs,s){
        const query = ecs.createQuery("judge");
        const system = defineSystem(query, Judge.render);
        s.push(system);
    }
    static defineSystems(ecs,s){
        const query = ecs.createQuery("judge");
        const system = defineSystem(query, Judge.update);
        const queryArena = ecs.createQuery("judgeArena");
        const systemArena = defineSystem(queryArena, Judge.updateArena);
        s.push(system);
        s.push(systemArena);
    }
    static defineComponents(){        
        Fes.data.ecs.defineComponent("judge",{
            hp:types.float,
            targetX:types.float,
            targetY:types.float,
            mode:types.int8
        });
        Fes.data.ecs.defineComponent("judgeArena",{
            judgeId:types.int32,
        });
    }
    
	static update(entity){
        const ecs = Fes.data.ecs;
        //TODO: check for state and change
        switch(ecs.components.judge.mode[entity]){
            case Judge.MODE.GREEN:
                Judge.updateGreen(entity);
                break;
            case Judge.MODE.YELLOW:
                Judge.updateYellow(entity);
                break;
            case Judge.MODE.RED:
                Judge.updateRed(entity);
                break;
            case Judge.MODE.BLACK:
                break;//nothing to do for black (inactive), maye just check if outside rect?
        }
	}
    static updateGreen(entity){
        const ecs = Fes.data.ecs;
        //if mode == green or yellow, regen
        Judge.hpRegen(entity);
        //if mode == green && number of players in range > 1, mode = yellow 
        let players = Judge.playersInRange(entity);
        if(players.length>1){
            ecs.components.judge.mode[entity] = Judge.MODE.YELLOW;
            return;
        } 
    }
    static updateYellow(entity){
        const ecs = Fes.data.ecs;
        //if mode == green or yellow, regen
        Judge.hpRegen(entity);
        //if mode == yellow && number of players in range <= 1, mode = green 
        let players = Judge.playersInRange(entity);
        if(players.length<=1){
            ecs.components.judge.mode[entity] = Judge.MODE.GREEN;
            return;
        } 
        let closePlayers = Judge.playersInCloseRange(entity);
        if(closePlayers.length>1){
            ecs.components.judge.mode[entity] = Judge.MODE.RED;
            //TODO: different kinds of judge battles (bot, pvp, etc)
            //this is PvP
            let offset=0;
            for(const playerEntity of closePlayers){
                //track players that have gone into an arena, by giving them a component that stores the judge's arena
                //NOTE: for this to work properly, judges must not be destroyed. (e.g. if ring collapses)
                ecs.addComponent(playerEntity,"judgeArena");
                ecs.components.judgeArena.judgeId[playerEntity] = entity;
                ecs.components.position.x[playerEntity] = ecs.components.judge.targetX[entity]+offset;
                ecs.components.position.y[playerEntity] = ecs.components.judge.targetY[entity]-400;
                offset+=128;//TODO: if there's more than 2 players in range? modulo map width? divide width to sections?
            }
            return;
        } 

    }
    static updateRed(entity){
        const ecs = Fes.data.ecs;
        /*
        if mode == red 
            if is bot crate: (players defeated bots) // TODO: crate
                if bot count == 0, give each player reward and set mode = black
            if is pvp crate: (player defeated another player)
                if player count == 1, give player reward and set mode = black
            if player count < 1, set mode = green (players lost to bot, or draw?)
        */
        let arenaPlayers = Judge.playersInArena(entity);
        if(arenaPlayers.length==1){//TODO: && mode is not vs bots/boss (1 player vs enemies)
            //TODO: give rewards to the person in arenaPlayers & teleport back
            ecs.components.judge.mode[entity] = Judge.MODE.BLACK;
        }
        if(arenaPlayers.length<1){
            //game was draw, or player lost set mode = green
            ecs.components.judge.hp[entity] = Judge.MAX_HP;
            ecs.components.judge.mode[entity] = Judge.MODE.GREEN;
        }
    }
    static hpRegen(entity){
        //hp += regen rate * distance to edge of map
        const ecs = Fes.data.ecs;
        let regenRate = 0.1;//TODO: distance calculation
        ecs.components.judge.hp[entity] += regenRate;
        if(ecs.components.judge.hp[entity]>Judge.MAX_HP){
            ecs.components.judge.hp[entity] = Judge.MAX_HP;
        }
    }

    static longRangeRect(entity){
        const ecs = Fes.data.ecs;
        return {
            x:ecs.components.position.x[entity],//midpoint
            y:ecs.components.position.y[entity],//bottom
            width:300,
            height:160
        };
    }
    static closeRangeRect(entity){
        const ecs = Fes.data.ecs;
        return {
            x:ecs.components.position.x[entity],
            y:ecs.components.position.y[entity],
            width:150,
            height:72
        };
    }
    static playersInRange(entity){
        const ecs = Fes.data.ecs;
        let result = [];
        //TODO: define better bounds
        const rangeRect = Judge.longRangeRect(entity);
        const query = ecs.createQuery("player");
        for(let archetype of query.archetypes) {
            for(let playerEntity of archetype.entities) {
                const playerRect = {
                    x:ecs.components.position.x[playerEntity],
                    y:ecs.components.position.y[playerEntity],
                    width:ecs.components.size.width[playerEntity],
                    height:ecs.components.size.height[playerEntity]
                };
                if(Collision.rectRectCollision(playerRect,rangeRect)){
                    result.push(playerEntity);
                }
            }
        }
        return result;
    }
    static playersInCloseRange(entity){
        const ecs = Fes.data.ecs;
        let result = [];
        //TODO: define better bounds
        const rangeRect = Judge.closeRangeRect(entity);
        const query = ecs.createQuery("player");
        for(let archetype of query.archetypes) {
            for(let playerEntity of archetype.entities) {
                const playerRect = {
                    x:ecs.components.position.x[playerEntity],
                    y:ecs.components.position.y[playerEntity],
                    width:ecs.components.size.width[playerEntity],
                    height:ecs.components.size.height[playerEntity]
                };
                if(Collision.rectRectCollision(playerRect,rangeRect)){
                    result.push(playerEntity);
                }
            }
        }
        return result;
        
    }
    static playersInArena(entity){
        const ecs = Fes.data.ecs;
        let result = [];
        //TODO: define better bounds, and make sure they sync with the tiled map
        const rangeRect = {
            x:ecs.components.judge.targetX[entity],//middle 
            y:ecs.components.judge.targetY[entity],//bottom
            width:1600,//note: should be used in tiled to draw bounds
            height:800
        };
        const query = ecs.createQuery("player");
        for(let archetype of query.archetypes) {
            for(let playerEntity of archetype.entities) {
                const playerRect = {
                    x:ecs.components.position.x[playerEntity],
                    y:ecs.components.position.y[playerEntity],
                    width:ecs.components.size.width[playerEntity],
                    height:ecs.components.size.height[playerEntity]
                };
                if(Collision.rectRectCollision(playerRect,rangeRect)){
                    result.push(playerEntity);
                }
            }
        }
        return result;
    }

    static updateArena(entity){
        //NOTE: entity is a player, not the judge
        const ecs = Fes.data.ecs;
        const judgeEntity = ecs.components.judgeArena.judgeId[entity];
        //check for death
        let arenaPlayers = Judge.playersInArena(judgeEntity);
        //if the player has been kocked out of the arena, or the judge has ended the battle
        if(!arenaPlayers.includes(entity ) || ecs.components.judge.mode[judgeEntity] != Judge.MODE.RED){
            //TODO: better respawn logic
            //for now, just move them back to the judge's location
            ecs.components.position.x[entity] = ecs.components.position.x[judgeEntity]+128;
            ecs.components.position.y[entity] = ecs.components.position.y[judgeEntity]-32;
            //TODO: KO and respawn. (move them back into map)
            ecs.removeComponent(entity,"judgeArena");
        }
        //How arenas work:
        /*
        in the judge's update loop:
        if mode == red
        the judge will check the number of players in the arena's hitbox.
        judge will automatically end the battle if the required number of players are left (usually 1)
        (this means that battles are effectivly 1-stock)
        when ending the battle, the judge will give rewards, if any

        in the player's update loop:
        if outside the arena, treat this a a death, get no rewards
        go back to the map and do a respawn

        //player update handles deaths
        //judge updates handles whoever's left
        */


    }
    //collision is detected in CBTStateMachine functions
    static takeHit(judgeEntity,playerEntity,hitbox){
        const ecs = Fes.data.ecs;
        //if mode == green or yellow, hitting reduces hp

        //TODO: actual damage calcs
        if(ecs.components.judge.mode[judgeEntity] == Judge.MODE.GREEN||
            ecs.components.judge.mode[judgeEntity] == Judge.MODE.YELLOW){
            ecs.components.judge.hp[judgeEntity]-=5;
            if(ecs.components.judge.hp[judgeEntity]<=0){
                ecs.components.judge.hp[judgeEntity] = 0;
                //TODO: since the player is destorying the judge with this hit, give rewards to that player
                ecs.components.judge.mode[judgeEntity] = Judge.MODE.BLACK;
            }
        }
        
    }
    
	static render(entity){
        const ecs = Fes.data.ecs;
		let ctx = Fes.R.varCtx;
        
        ctx.fillStyle = "#00880088";
        const longRangeRect = Judge.longRangeRect(entity);
        const closeRangeRect = Judge.closeRangeRect(entity);
        ctx.fillRect(longRangeRect.x-Fes.R.screenX-longRangeRect.width/2-0.5, 
            longRangeRect.y-longRangeRect.height-Fes.R.screenY-0.5, 
            longRangeRect.width,longRangeRect.height);
        ctx.fillRect(closeRangeRect.x-Fes.R.screenX-closeRangeRect.width/2-0.5, 
            closeRangeRect.y-closeRangeRect.height-Fes.R.screenY-0.5, 
            closeRangeRect.width,closeRangeRect.height);
        switch(ecs.components.judge.mode[entity]){
            case Judge.MODE.GREEN:
                ctx.fillStyle = "#00FF00";
                break;
            case Judge.MODE.YELLOW:
                ctx.fillStyle = "#FFFF00";
                break;
            case Judge.MODE.RED:
                ctx.fillStyle = "#FF0000";
                break;
            case Judge.MODE.BLACK:
                ctx.fillStyle = "#000000";
            }
		ctx.strokeStyle = "#000000";
		ctx.beginPath();
        let w = ecs.components.size.width[entity];
        let h = ecs.components.size.height[entity];
		ctx.rect(ecs.components.position.x[entity]-Fes.R.screenX-w/2-0.5, 
                 ecs.components.position.y[entity]-h-Fes.R.screenY-0.5, 
			   w,h);
        ctx.fillRect(ecs.components.position.x[entity]-Fes.R.screenX-w/2-0.5, 
                ecs.components.position.y[entity]-h-Fes.R.screenY-0.5, 
                w,h);
		ctx.stroke();




	}
}
export { Judge };