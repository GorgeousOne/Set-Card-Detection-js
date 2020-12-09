/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {number}  bgrColor       The blue green and red value in an array
 * @return  {Array}                  The HSL representation
 */
function bgrToHsl(bgrColor) {

	let blue = bgrColor[0] / 255;
	let green = bgrColor[1] / 255;
	let red = bgrColor[2] / 255;

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

function rgbToHls(bgrColor) {

	let blue = bgrColor[0];
	let green = bgrColor[1];
	let red = bgrColor[2];

	let max = Math.max(red, green, blue);
	let min = Math.min(red, green, blue);
	let sum = (max + min);
	let range = (max - min);
	let light = sum / 2.0;

	if (min === max)
		return [0.0, light, 0.0];

	let sat;

	if (light <= 0.5) {
		sat = range / sum;

	} else {
		sat = range / (2.0 - sum);
		rc = (max - red) / range;
		gc = (max - green) / range;
		bc = (max - blue) / range;
	}

	let hue;

	if (red === max) {
		hue = bc - gc;
	} else if (green === max) {
		hue = 2.0 + rc - bc;
	} else {
		hue = 4.0 + gc - rc;
	}

	hue = (hue / 6.0) % 1.0;
	return [hue, light, sat];
}