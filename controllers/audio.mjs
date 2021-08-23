class Audio {

    static imageCache = {};
    
    static isSoundEnabled = true;
    //prevents calls to the audio class from playing new sounds
    //does not stop sounds currently in progress
    //used primarily to prevent the network update thread from playing sounds
    static enableSound(){
        Audio.isSoundEnabled = true;
    }
    static disableSound(){
        Audio.isSoundEnabled = false;
    }


    static SFX_KINDS={
        HIT:"hit",
        DEATH:"death"
        //TODO: more
    };
    static sfxBuffer = {

    };
    static playSFX(sfx,id){
        if(!Audio.isSoundEnabled){
            return;
        }
        if(!Audio.SFX_ENABLED){
            return;
        }
        if(Audio.sfxBuffer.hasOwnProperty(id)){
            let existingEffect = Audio.sfxBuffer[id];
            if(existingEffect.playing()){
                return;//wait for an existing sound to finish
            }
        }
        switch(sfx){
            case Audio.SFX_KINDS.HIT:
                let fxHit = Audio.SFX.HIT_EFFECTS[Math.floor(Math.random()*Audio.SFX.HIT_EFFECTS.length)];
                console.log(fxHit);
                fxHit.play();
                Audio.sfxBuffer[id] = fxHit;
                break;
            default:
                console.log("TODO: sound "+sfx);
        }
    }
    static SFX_ENABLED = true;

    static SFX = {
        HIT_EFFECTS:[
        //commented out effects are ~1 sec in length (too long)
        //new window.Howl({src:"./assets/audio/hits/hit01.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit02.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit03.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit04.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit05.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit06.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit07.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit08.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit09.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit10.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit11.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit12.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit13.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit14.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit15.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit16.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit17.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit18.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit19.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit20.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit21.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit22.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit23.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit24.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit25.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit26.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit27.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit28.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit29.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit30.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit31.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit32.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit33.mp3.flac"}),
        //new window.Howl({src:"./assets/audio/hits/hit34.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit35.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit36.mp3.flac"}),
        new window.Howl({src:"./assets/audio/hits/hit37.mp3.flac"})
        ]

    }

    static init (){
        window.Howler.volume(0.75);
    }

}


export { Audio };