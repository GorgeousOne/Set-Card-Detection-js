
class SetShape {

	constructor(contour, bbox, mineRect, shapeType = undefined, childContour = undefined, parentContour = undefined) {

		if (shapeType === undefined) {
			shapeType = new ShapeType();
		}

		this.shapeType = shapeType;

		this.contour = contour;
		this.bbox = bbox;
		this.minRect = mineRect;
		this.minExtent = Math.min(mineRect.size.width, mineRect.size.height);
		this.maxExtent = Math.max(mineRect.size.width, mineRect.size.height);

		this.childContour = childContour;
		this.parentContour = parentContour;
	}
}