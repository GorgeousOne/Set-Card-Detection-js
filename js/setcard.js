class SetCard {

	constructor(shapeType, shapes = undefined) {
		this.shapeType = shapeType;
		this.shapes = shapes === undefined ? [] : shapes;
	}

	shapeCount() {
		return len(this.shapes);
	}
}