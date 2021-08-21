class Hitbox {
  constructor(){
    this.x=0;//relative xy to the player's coordinates
    this.y=0;
    this.size = 8;//size of the hitbox
    //this.shape = "circle"; //for now just assume circle  of "size"
    //data for damage calculations
    this.damage = 10;
    this.angle = 45;
    this.baseKnockback = 10;
    this.scaling = 1;
  }
}
export default Hitbox;

