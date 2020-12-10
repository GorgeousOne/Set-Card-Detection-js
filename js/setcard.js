class SetCard {

	constructor(shapeType, shapes = undefined) {
		this.shapeType = shapeType;
		this.shapes = shapes === undefined ? [] : shapes;
	}

	shapeCount() {
		return this.shapes.length;
	}

	mid() {
		return this.shapes[0].minRect.center;
	}
}