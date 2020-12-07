
class ShapeType {

	constructor(shape = undefined, color = undefined, shading = undefined) {
		this.shape = shape;
		this.color = color;
		this.shading = shading;
	}

	// equals (self, other) {
	// 	return this.shape === other.shape && this.color === other.color && this.shading === other.shading;
	// }

	toString(self) {
		return " ".join([this.color, this.shading, this.shape]);
	}
}