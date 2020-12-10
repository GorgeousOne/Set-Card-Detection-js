class ShapeType {

	constructor(shape = undefined, color = undefined, shading = undefined) {
		this.shape = shape;
		this.color = color;
		this.shading = shading;
	}

	equals(other) {
		return this.shape === other.shape &&
			this.color === other.color &&
			this.shading === other.shading;
	}

	toString() {
		return this.color.concat(" ", this.shading, " ", this.shape);
	}
}