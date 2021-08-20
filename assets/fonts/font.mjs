
class Font {
	static imageCache = {};
	static width=300;
	static ch_width=20;
	static ch_height=20;

	static first_char = ' '.charCodeAt(0);
	static last_char = '~'.charCodeAt(0);//not actually the last char, but close enough

	//spacing between letters, given i as an index to a word, return the new position of the character at that index
	static kerning(i){
		return i*(Font.ch_width-2)*0.85;
	}
	static drawCharacter(chStr,x,y){
		const ch = chStr.charCodeAt(0);
		if(ch<Font.first_char||ch>Font.last_char){
			console.log("can't render text character:"+chStr);
			return;
		}
		const ctx = Fes.R.varCtx;
		const index = ch-Font.first_char;
		//TODO: bounds check index.
		const width = Font.width/Font.ch_width;
		let image = Font.getImgData();
		if(image){
			let xIdx = index % width;
			let yIdx = Math.floor(index / width);
			let sourceX = xIdx*Font.ch_width+1;
			let sourceY = yIdx*Font.ch_height;
			ctx.drawImage(
				image,
				sourceX,
				sourceY,
				Font.ch_width,
				Font.ch_height,
				x,y,
				Font.ch_width,
				Font.ch_height
			);
		}
	}
    //rendering methods
    static getImgData(){
		const fontName="font"
        if(Font.imageCache[fontName] == null){
            //start loading
            let img = new Image();
            Font.imageCache[fontName] = {
                image:img,
                isLoaded:false
            };
            img.onload = function(){
                Font.imageCache[fontName].isLoaded = true;
            };
            img.src = Font.imgUrl;
        }
        if(Font.imageCache[fontName].isLoaded){
            return Font.imageCache[fontName].image;
        }
		return null;
    }



	static imgUrl = "./assets/fonts/font-20x20.png";

}


export {
    Font
};