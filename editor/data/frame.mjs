class Frame {
  constructor(){
    this.hitboxes = [];
    this.width=64;   //width of sprite frame
    this.height=64;  
    this.x=0;        //x of sprite frame relative to the source image
    this.y=0;
    this.anchorX=32; //point on the sprite that should match the ch's origin
    this.anchorY=32;
    /*
    //TODO: other props
    this.isIntangible = false;
    this.superArmour = 0;
    this.isCharge = false;
    this.isReflect = false;
    this.createsObject = "";
    this.moveOwner = {x:0,y:0};
    */
  }
}
export default Frame;

