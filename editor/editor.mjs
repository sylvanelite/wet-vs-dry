import BaseCharacter from "../editor/data/character.mjs";
import Frame from "../editor/data/frame.mjs";
import Hitbox from "../editor/data/hitbox.mjs";


class Editor {
    constructor() {}
    init() {
        this.view = new Vue({
            el: "#vue",
            data: {
                isPlaying:false,
                onion:false,
                imgCache: null,
                message: "foo",
                selected: "idle",
                selectedFrame: -1,
                selectedHitbox: -1,
                iptFrameX: 0,
                iptFrameY: 0,
                iptFrameWidth: 0,
                iptFrameHeight: 0,
                iptFrameAnchorX: 0,
                iptFrameAnchorY: 0,
                iptHitboxX: 0,
                iptHitboxY: 0,
                iptHitboxSize: 0,
                fileHandle: null,
                character: new BaseCharacter(),
                pickerOpts: {
                    types: [{
                        description: 'Json',
                        accept: {
                            'json/*': ['.json']
                        }
                    }],
                    excludeAcceptAllOption: true,
                    multiple: false
                }
            },
            methods: {
                addFrame: function() {
                    let anim = this.character.animations[this.selected];
                    let frame = new Frame();
                    frame.x = parseInt(this.iptFrameX,10);
                    frame.y = parseInt(this.iptFrameY,10);
                    frame.width = parseInt(this.iptFrameWidth,10);
                    frame.height = parseInt(this.iptFrameHeight,10);
                    frame.anchorX = parseInt(this.iptFrameAnchorX,10);
                    frame.anchorY = parseInt(this.iptFrameAnchorY,10);
                    anim.push(frame);
                },
                removeFrame: function(i) {
                    let conf = confirm("delete frame?");
                    if (conf) {
                        this.character.animations[this.selected].splice(i, 1);
                    }
                    this.selectFrame(i); //select whichever row is now in that spot, if i is now > len, this will fix i
                },
                selectAction: function(action) {
                    this.selected = action;
                    this.selectedFrame = -1;
                    this.selectedHitbox = -1;
                },
                selectFrame: function(frameNo) {
                    this.selectedFrame = frameNo;
                    let maxFrame = this.character.animations[this.selected].length;
                    if (frameNo >= maxFrame) {
                        this.selectedFrame = maxFrame - 1;
                    }
                    if (frameNo < 0) {
                        this.selectedFrame = -1; //nothing selected == -1
                    }
                    //also attempt to pick a hitbox if there is one
                    this.selectHitbox(0);
                },
                selectHitbox: function(hitboxNo) {
                    this.selectedHitbox = hitboxNo;
                    let frame = this.character.animations[this.selected];
                    if (this.selectedFrame < 0) { //no chosen frame
                        this.selectedHitbox = -1;
                        return;
                    }
                    let maxHitbox = frame[this.selectedFrame].hitboxes.length;
                    if (hitboxNo >= maxHitbox) {
                        this.selectedHitbox = maxHitbox - 1;
                    }
                    if (hitboxNo < 0) {
                        this.selectedHitbox = -1; //nothing selected == -1
                    }
                },
                addHitbox: function() {
                    let frame = this.character.animations[this.selected];
                    let hitboxes = frame[this.selectedFrame].hitboxes;
                    let hitbox = new Hitbox();
                    hitbox.x = parseInt(this.iptHitboxX,10);
                    hitbox.y = parseInt(this.iptHitboxY,10);
                    hitbox.size = parseInt(this.iptHitboxSize,10);
                    hitboxes.push(hitbox);
                    //clear out the form
                    this.iptHitboxX = 0;
                    this.iptHitboxY = 0;
                    this.iptHitboxSize = 0;
                },
                removeHitbox: function(i) {
                    let conf = confirm("delete hitbox?");
                    if (conf) {
                        this.character.animations[this.selected][this.selectedFrame].hitboxes.splice(i, 1);
                    }
                    this.selectHitbox(i); //select whichever row is now in that spot, if i is now > len, this will fix i
                },
                selectSprite: async function(evt) {
                    if (!evt.target.files.length) {
                        return;
                    }
                    let file = evt.target.files[0];
                    const toBase64 = file => new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = error => reject(error);
                    });
                    this.character.sprite_sheet = await toBase64(file);
                    this.imgCache = null;
                },
                moveSpriteFrame: function(e) {
                    if (!e.target.isdragging) {
                        return;
                    }
                    let elemRect = e.target.getBoundingClientRect();
                    //x y from the top of the canvas elem
                    let relativeX = e.clientX - elemRect.left;
                    let relativeY = e.clientY - elemRect.top;
                    let frame = this.getFrameOnSpriteCanvas(relativeX,relativeY);
                    if(!frame){
                        return;
                    }
                    //adujst so the frame is centred on the anchor point
                    frame.x = relativeX - frame.anchorX;
                    frame.y = relativeY - frame.anchorY;
                    frame.x = Math.floor(frame.x);
                    frame.y = Math.floor(frame.y);
                },
                getFrameOnSpriteCanvas: function(cnvX,cnvY){
                    for (const [animName, frames] of Object.entries(this.character.animations)) {
                        for (const [idx, frame] of frames.entries()) {
                            if( cnvX>frame.x&&cnvX<frame.x+frame.width &&
                                cnvY>frame.y&&cnvY<frame.y+frame.height ){
                                    return frame;
                            }
                        }
                    }
                    
                },
                openJsonFile: async function() {
                    [this.fileHandle] = await window.showOpenFilePicker(this.pickerOpts);
                    this.fileData = await this.fileHandle.getFile();
                    let fileText = await this.fileData.text();
                    let fileJson = JSON.parse(fileText);
                    this.selectFrame(-1);
                    this.character.applyJsonToCh(fileJson);
                },
                saveJsonFile: async function() {
                    let data = JSON.stringify(this.character);
                    if (!this.fileHandle) {
                        this.fileHandle = await window.showSaveFilePicker(this.pickerOpts);
                    }
                    const writableStream = await this.fileHandle.createWritable();
                    await writableStream.write(data);
                    await writableStream.close();
                },
                getImgData(){
                    if(!this.character.sprite_sheet){
                        return null;
                    }
                    if(this.imgCache == null){
                        //start loading
                        let img = new Image();
                        let self = this;
                        this.imgCache = {
                            image:img,
                            isLoaded:false
                        };
                        img.onload = function(){
                            self.imgCache.isLoaded = true;
                        };
                        img.src = this.character.sprite_sheet;
                    }
                    if(this.imgCache.isLoaded){
                        return this.imgCache.image;
                    }
                },
                drawSprite(ctx,canvas,animation,frameIdx){
                    let frame = this.character.animations[animation][frameIdx];
                    let img = this.getImgData();
                    if(img){
                        ctx.drawImage(img,
                            frame.x,frame.y,
                            frame.width,frame.height,
                            canvas.width/2,canvas.height/2,
                            frame.width,frame.height);
                    }
                },
                drawHitboxes(ctx,canvas,animation,frameIdx){
                    let frame = this.character.animations[animation][frameIdx];
                    let startX = canvas.width/2;
                    let startY = canvas.height/2;
                    for (const [idx, hitbox] of frame.hitboxes.entries()) {
                        ctx.strokeStyle = "1px solid black";
                        ctx.beginPath();
                        ctx.arc(startX+hitbox.x+0.5, 
                                startY+hitbox.y+0.5, 
                                hitbox.size,0, 2 * Math.PI);
                        ctx.stroke();
                        let angleRad = hitbox.angle *0.0174533;
                        ctx.beginPath();   
                        ctx.moveTo(startX+hitbox.x+0.5, 
                                   startY+hitbox.y+0.5);
                        ctx.lineTo(startX+hitbox.x+0.5 + hitbox.size*Math.cos(angleRad), 
                                   startY+hitbox.y+0.5 + hitbox.size*Math.sin(angleRad));   
                        ctx.stroke(); 
                    }
                },
                drawSpriteSheet(){
                    let canvas =  document.getElementById("cnvSpriteSheet");
                    let ctx = canvas.getContext("2d");
                    let img = this.getImgData();
                    ctx.clearRect(0,0,canvas.width,canvas.height);
                    if(img){
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img,0,0);
                    }
                    for (const [animName, frames] of Object.entries(this.character.animations)) {
                        for (const [idx, frame] of frames.entries()) {
                            let elem = document.querySelector('.sprite-overlay-'+animName);
                            let style = getComputedStyle(elem);
                            let colour = style.backgroundColor;
                            ctx.fillStyle=colour;
                            ctx.fillRect(frame.x+0.5, frame.y+0.5,
                                           frame.width,frame.height);
                            ctx.strokeStyle="1px solid black";
                            ctx.strokeRect(frame.x+0.5, frame.y+0.5,
                                           frame.width,frame.height);
                            ctx.beginPath();   
                            ctx.moveTo(frame.x+frame.anchorX-2.5, frame.y+frame.anchorY+0.5);
                            ctx.lineTo(frame.x+frame.anchorX+2.5, frame.y+frame.anchorY+0.5);   
                            ctx.stroke(); 
                            ctx.beginPath();   
                            ctx.moveTo(frame.x+frame.anchorX+0.5, frame.y+frame.anchorY-2.5);
                            ctx.lineTo(frame.x+frame.anchorX+0.5, frame.y+frame.anchorY+2.5);   
                            ctx.stroke(); 
                        }
                   }
                },
                draw(){
                    let canvas = document.getElementById("canvas");
                    let ctx = canvas.getContext("2d");
                    ctx.clearRect(0,0,canvas.width,canvas.height);
                    if(this.onion){
                        if(this.selectedFrame-1>=0){
                            ctx.globalAlpha =0.5;
                            this.drawSprite(ctx,
                                canvas,
                                this.selected,
                                this.selectedFrame-1);
                            this.drawHitboxes(ctx,
                                canvas,
                                this.selected,
                                this.selectedFrame-1);
                                ctx.globalAlpha =1;
                        }
                    }
                    if(this.selectedFrame>-1){
                        this.drawSprite(ctx,
                            canvas,
                            this.selected,
                            this.selectedFrame);
                        this.drawHitboxes(ctx,
                            canvas,
                            this.selected,
                            this.selectedFrame);
                            if(this.onion){
                                if(this.selectedFrame+1>=0&&
                                    this.selectedFrame+1<this.character.animations[this.selected].length){
                                        ctx.globalAlpha =0.5;
                                    this.drawSprite(ctx,
                                        canvas,
                                        this.selected,
                                        this.selectedFrame+1);
                                    this.drawHitboxes(ctx,
                                        canvas,
                                        this.selected,
                                        this.selectedFrame+1);
                                        ctx.globalAlpha =1;
                                }
                            }
                    }

                    this.drawSpriteSheet();
                }
            }
        });
        let drawLoop = function(){
            window.editor.view.draw();
            window.requestAnimationFrame(drawLoop);
        };
        drawLoop();
        let playLoop = function(){
            if(window.editor.view.isPlaying){
                let curFrame = window.editor.view.selectedFrame;
                window.editor.view.selectFrame(curFrame+1);
                let nextFrame = window.editor.view.selectedFrame;
                if(curFrame == nextFrame){//will be no change in frame # if hit max frame
                    window.editor.view.selectFrame(0);//loop around if hit end
                }
            }
        };
        setInterval(playLoop,100);
    }
}
export default Editor;