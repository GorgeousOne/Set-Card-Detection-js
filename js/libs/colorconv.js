/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {number}  bgrColor       The blue green and red value in an array
 * @return  {Array}                  The HSL representation
 */
function rgbToHsl(bgrColor) {

	let red = bgrColor[0] / 255;
	let green = bgrColor[1] / 255;
	let blue = bgrColor[2] / 255;

	var max = Math.max(red, green, blue);
	var min = Math.min(red, green, blue);
	var hue, sat, light = (max + min) / 2;

	if (max === min) {
		hue = sat = 0; // achromatic

	} else {
		var range = max - min;
		sat = light > 0.5 ? range / (2 - max - min) : range / (max + min);
		switch (max) {
			case red:
				hue = (green - blue) / range + (green < blue ? 6 : 0);
				break;
			case green:
				hue = (blue - red) / range + 2;
				break;
			case blue:
				hue = (red - green) / range + 4;
				break;
		}
		hue /= 6;
	}

	return [hue, sat, light];
}

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToBgr(h, s, l){
	var r, g, b;

	if(s === 0){
		r = g = b = l; // achromatic
	}else{
		var hue2rgb = function hue2rgb(p, q, t){
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return [Math.round(b * 255), Math.round(g * 255), Math.round(r * 255), 255];
}