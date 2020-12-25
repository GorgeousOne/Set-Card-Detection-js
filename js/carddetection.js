
function detectSetCards(image) {

	let grayImg = getImgBlurredGray(image);
	let contours = findContours(grayImg);

	let imgSize = image.size();
	let imgWidth = imgSize.width;
	let imgHeight = imgSize.height;
	let imgMinLength = Math.min(imgWidth, imgHeight);

	let possibleShapes = findPossibleShapes(contours, imgMinLength, image);
	findShapeColorsAndShading(possibleShapes, image);

	let actualShapes = filterActualShapes(possibleShapes);
	let cards = findSetCards(actualShapes, image);

	grayImg.delete();
	contours.delete();
	return cards
}

function getImgBlurredGray(img, kernelSize = 5) {

	let blurredImg = new cv.Mat();
	let grayImg = new cv.Mat();

	cv.GaussianBlur(img, blurredImg, new cv.Size(kernelSize, kernelSize), cv.BORDER_DEFAULT);
	cv.cvtColor(blurredImg, grayImg, cv.COLOR_BGR2GRAY);

	blurredImg.delete();
	return grayImg;
}

function findContours(imgGray) {

	let imgThreshed = new cv.Mat();
	let contours = new cv.MatVector();
	let hierarchy = new cv.Mat();

	cv.adaptiveThreshold(imgGray, imgThreshed, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 7, 2);
	cv.findContours(imgThreshed, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

	imgThreshed.delete();
	hierarchy.delete();
	return contours;
}

function findPossibleShapes(contours, imgMinLength, canvas) {

	let minContourPoints = imgMinLength * 0.04;
	let minBoundsSize = imgMinLength * 0.03;
	let minMinRectSize = imgMinLength * 0.025;
	let maxMinRectSize = imgMinLength * 0.19;
	let minExtent = 0.55;
	let maxExtent = 0.90;

	let possibleShapes = [];

	for (let i = 0; i < contours.size(); i++) {

		let contour = contours.get(i);
		let contourLength = contour.data32S.length;

		// ignore short contours
		if (contourLength < minContourPoints) {
			continue;
		}

		let boundingRect = cv.boundingRect(contour);

		// ignore small dots
		if (boundingRect.width < minBoundsSize && boundingRect.height < minBoundsSize) {
			// cv.drawContours(canvas, contours, i, [0, 0, 0, 255], 1, cv.LINE_8);
			continue;
		}

		let minRect = cv.minAreaRect(contour);
		let rectWidth = minRect.size.width;
		let rectHeight = minRect.size.height;

		if (rectWidth < minMinRectSize || rectHeight < minMinRectSize) {
			//purple - minrect too thin
			// cv.drawContours(canvas, contours, i, [128, 0, 128, 255], 1, cv.LINE_8);
			continue;
		}

		if (rectWidth > maxMinRectSize && rectHeight > maxMinRectSize) {
			//blue - minrect too large
			// cv.drawContours(canvas, contours, i, [0, 0, 255, 255], 1, cv.LINE_8);
			continue;
		}

		if (!ratioFits(minRect)) {
			//green - minrect ratio unproportional
			// cv.drawContours(canvas, contours, i, [0, 128, 0, 255], 1, cv.LINE_8);
			continue;
		}

		let area = cv.contourArea(contour);
		let shapeExtent = area / (rectWidth * rectHeight);

		if (shapeExtent < minExtent) {
			//orange - shape extent too small
			// cv.drawContours(canvas, contours, i, [255, 128, 0, 255], 1, cv.LINE_8);
			continue;
		}

		if (shapeExtent > maxExtent) {
			//red - shape extent too big
			// cv.drawContours(canvas, contours, i, [255, 0, 0, 255], 1, cv.LINE_8);
			continue;
		}

		// cv.drawContours(canvas, contours, i, [255, 255, 255, 255], 2, cv.LINE_8);
		let shape = new SetShape(contour, minRect);
		shape.shapeType.shape = findShapeType(shapeExtent);
		shape.parentContour = growContour(shape.contour, shape.minLength * 0.2);
		shape.childContour = growContour(shape.contour, shape.minLength * -0.1);

		possibleShapes.push(shape);
	}

	return possibleShapes;
}

function ratioFits(rect) {
	let minRatio = 1.3;
	let maxRatio = 3.2;
	let ratio = getGreaterAspectRatio(rect);
	return ratio > minRatio && ratio < maxRatio;
}

function getGreaterAspectRatio(minRect) {
	let width = minRect.size.width;
	let height = minRect.size.height;
	return width > height ? (width / height) : (height / width);
}

function findShapeType(boundsExtent) {
	return (boundsExtent < 0.666) ? "diamond" : (boundsExtent < 0.81) ? "squiggle" : "oval";
}

function filterActualShapes(shapes) {

	let uniqueShapes = [];

	for (let shape of shapes) {

		let isUnique = true;

		for (let other of shapes) {

			if (shape === other) {
				continue;
			}

			let pointX = shape.contour.data32S[0];
			let pointY = shape.contour.data32S[1];

			if (cv.pointPolygonTest(other.contour, new cv.Point(pointX, pointY), false) > 0) {
				isUnique = false;
				break;
			}
		}

		if (isUnique) {
			uniqueShapes.push(shape);
		}
	}

	// for (let shape of uniqueShapes) {
	// 	shape.parentContour = growContour(shape.contour, shape.minLength * 0.2);
	// 	shape.childContour = growContour(shape.contour, shape.minLength * -0.1);
	// }

	return uniqueShapes;
}

//Returns a copy of the contour with every point expanded outwards by the given pixels (inwards for negative value).
function growContour(contour, pixels) {

	let newContour = contour.clone();

	let prevPoint = getContourPoint(contour, 0);
	let point = getContourPoint(contour, 2);
	let nextPoint = getContourPoint(contour, 4);

	let contourLength = contour.data32S.length;
	for (let i = 6; i < contourLength + 6; i += 2) {

		//predecessor and successor of a point are used to determine the direction to expand towards
		let dist = getDistVec(prevPoint, nextPoint);

		if (dist[0] !== 0 || dist[1] !== 0) {
			let facing = getNormalOrtho(dist);
			newContour.data32S[i % contourLength] = Math.floor(point[0] + facing[0] * pixels);
			newContour.data32S[(i + 1) % contourLength] = Math.floor(point[1] + facing[1] * pixels);
		}

		prevPoint = point;
		point = nextPoint;
		nextPoint = getContourPoint(contour, i % contourLength);
	}

	return newContour;
}

function getContourPoint(contour, doubledIndex) {
	return [
		contour.data32S[doubledIndex],
		contour.data32S[doubledIndex + 1]
	];
}

function getDistVec(p0, p1) {
	return [
		p1[0] - p0[0],
		p1[1] - p0[1]
	];
}

function getNormalOrtho(p) {
	let length = Math.sqrt(p[0] ** 2 + p[1] ** 2);
	return [
		p[1] / length,
		-p[0] / length
	];
}

let white = [255, 255, 255, 255];
let black = [0, 0, 0, 255];

function findShapeColorsAndShading(shapes, coloredImg) {

	let imgSize = coloredImg.size();
	let imgWidth = imgSize.width;
	let imgHeight = imgSize.height;

	for (let i = shapes.length-1; i >= 0; i--) {
		let shape = shapes[i];

		let matVec = new cv.MatVector();
		matVec.push_back(shape.childContour);
		matVec.push_back(shape.contour);
		matVec.push_back(shape.parentContour);

		let rect = cv.boundingRect(shape.parentContour);
		let offset = new cv.Point(-rect.x, -rect.y);

		if (rect.x < 0 || rect.x > imgWidth ||
			rect.y < 0 || rect.y > imgHeight) {
			shapes.splice(i, 1);
			continue;
		}

		let roi = coloredImg.roi(rect);
		let roiSize = roi.size();
		let mask = new cv.Mat.zeros(roiSize.height, roiSize.width, cv.CV_8U);

		cv.drawContours(mask, matVec, 0, white, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		shape.meanInside = cv.mean(roi, mask);

		cv.drawContours(mask, matVec, 1, white, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		cv.drawContours(mask, matVec, 0, black, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		shape.meanContour = cv.mean(roi, mask);

		cv.drawContours(mask, matVec, 2, white, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		cv.drawContours(mask, matVec, 1, black, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		shape.meanOutside = cv.mean(roi, mask);

		//delete shapes whose surrounding is very dark,
		if (rgbToHsl(shape.meanOutside)[2] < 0.4) {
			shapes.splice(i, 1);
			continue;
		}

		shape.shapeType.color = findShapeColor(rgbToHsl(shape.meanContour));
		shape.shapeType.shading = findShading(rgbToHsl(shape.meanInside), rgbToHsl(shape.meanOutside));

		roi.delete();
		mask.delete();

		// cv.drawContours(coloredImg, matVec, 1, hslToBgr(Math.random(), Math.random() * 0.3 + 0.7, 0.5), -1, cv.LINE_8);
		// cv.drawContours(coloredImg, matVec, 2, getColorByName(shape.shapeType.color), 2, cv.LINE_8);
		// cv.drawContours(coloredImg, matVec, 1, shape.meanContour, 2, cv.LINE_8);
		// cv.drawContours(coloredImg, matVec, 0, shape.meanInside, 2, cv.LINE_8);
		// cv.drawContours(coloredImg, matVec, 2, getColorByName(shape.shapeType.color), 2, cv.LINE_8);

		// if (shape.shapeType.shading === "open") {
		// 	cv.drawContours(coloredImg, matVec, 0, white, 2, cv.LINE_8);
		// } else if (shape.shapeType.shading === "solid") {
		// 	cv.drawContours(coloredImg, matVec, 0, black, 2, cv.LINE_8);
		// }

		matVec.delete();
	}
}

function findShapeColor(hlsColor) {
	let hue = hlsColor[0] * 360;

	if (hue >= 345 || hue <= 20) {
		return "red"
	} else if (hue >= 230 && hue <= 340) {
		return "purple";
	} else if (hue >= 30 && hue <= 180) {
		return "green";
	} else {
		//idk i dont want to think about a better way on how to deal with bad images
		return "purple"
	}
}

function findShading(hslColorInside, hslColorOutside) {

	let lightInside = hslColorInside[2] * 100;
	let lightOutside = hslColorOutside[2] * 100;
	let fallOff = Math.abs(lightOutside - lightInside);

	if (fallOff < 4) {
		return "open";
	} else if (fallOff < 21) {
		return "striped";
	} else {
		return "solid";
	}
}

function findSetCards(shapes, canvas) {

	let linkedShapes = [];
	let foundCards = [];

	for (let i = 0; i < shapes.length; i++) {

		let shape = shapes[i];
		let isShapeLinked = linkedShapes.includes(shape);

		// let mid = shape.minRect.center;
		// cv.circle(canvas, mid, 1, white, 2);
		// cv.circle(canvas, mid, 1.75 * shape.minLength, white, 1);

		for (let k = i + 1; k < shapes.length; k++) {
			let other = shapes[k];

			if (!other.shapeType.equals(shape.shapeType)) {
				continue;
			}

			let midDistSquared = distSquared(shape.minRect.center, other.minRect.center);
			// cv.circle(canvas, mid, Math.sqrt(midDistSquared), [255, 0, 0, 255], 1)

			if (Math.sqrt(midDistSquared) < (1.75 * Math.max(shape.minLength, other.minLength))) {
				linkedShapes.push(other);
				addShapesToCards(foundCards, shape, other);
				isShapeLinked = true;
			}
		}

		if (!isShapeLinked) {
			foundCards.push(new SetCard(shape.shapeType, [shape]));
		}
	}
	return foundCards;
}

function distSquared(p0, p1) {
	return (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2;
}

function addShapesToCards(cards, shape, otherShape) {

	for (let card of cards) {

		if (card.shapes.includes(shape)) {
			card.shapes.push(otherShape);
			return;
		} else if (card.shapes.includes(otherShape)) {
			card.shapes.push(shape);
			return;
		}
	}
	cards.push(new SetCard(shape.shapeType, [shape, otherShape]));
}
