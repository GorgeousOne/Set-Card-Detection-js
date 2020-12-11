class SetCard {

	constructor(shapeType, shapes = undefined) {
		this.shapeType = shapeType;
		this.shapes = shapes === undefined ? [] : shapes;
	}

	shapeCount() {
		return this.shapes.length;
	}

	mid() {
		let center = new cv.Point();

		for (let shape of this.shapes) {
			addVec(center, shape.minRect.center);
		}

		multVec(center, 1 / this.shapes.length)
		return center;
	}
}