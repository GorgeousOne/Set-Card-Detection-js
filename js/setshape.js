
class SetShape {

	constructor(contour, mineRect, shapeType = undefined, childContour = undefined, parentContour = undefined) {

		this.shapeType = shapeType === undefined ? new ShapeType() : shapeType;

		this.minRect = mineRect;
		this.minLength = Math.min(mineRect.size.width, mineRect.size.height);

		this.contour = contour;
		this.childContour = childContour;
		this.parentContour = parentContour;
	}
}