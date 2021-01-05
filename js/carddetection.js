
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

		// cv.drawContours(canvas, contours, i, white, 2, cv.LINE_8);
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

//deletes all shapes that are with one point inside another shape
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
	return uniqueShapes;
}

//Returns a copy of the contour with every point expanded outwards by the given pixels (negative pixels for inwards).
function growContour(contour, pixels) {

	let dataLength = contour.data32S.length;
	let newContour = new cv.Mat(dataLength/2, 2, cv.CV_32S);

	let prevPoint = getContourPoint(contour, 0);
	let point = getContourPoint(contour, 2);
	let nextPoint = getContourPoint(contour, 4);

	for (let i = 6; i < dataLength + 6; i += 2) {

		//predecessor and successor of a point are used to determine the direction to expand towards
		let dist = getDistVec(prevPoint, nextPoint);

		if (dist[0] !== 0 || dist[1] !== 0) {
			let facing = getNormalOrtho(dist);
			newContour.data32S[i % dataLength] = Math.floor(point[0] + pixels * facing[0]);
			newContour.data32S[(i + 1) % dataLength] = Math.floor(point[1] + pixels * facing[1]);
		}

		prevPoint = point;
		point = nextPoint;
		nextPoint = getContourPoint(contour, i % dataLength);
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

		if (rect.x < 0 || rect.x + rect.width >= imgWidth ||
			rect.y < 0 || rect.y + rect.height >= imgHeight) {
			shapes.splice(i, 1);
			matVec.delete();
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

		let hslOutside = rgbToHsl(shape.meanOutside);
		let hslInside = rgbToHsl(shape.meanInside);

		roi.delete();
		mask.delete();
		matVec.delete();

		//delete shapes whose surrounding is darker than the shading
		if (hslInside[2] - hslOutside[2] > 0.1) {
			shapes.splice(i, 1);
		}
	}

	fixWhiteBalance(shapes);

	for (let shape of shapes) {
		shape.shapeType.color = findShapeColor(rgbToHsl(shape.meanContour));
		shape.shapeType.shading = findShading(rgbToHsl(shape.meanInside), rgbToHsl(shape.meanOutside));
	}
}

//removes any bad white balance from the contour colors by looking at the average white background of the cards
function fixWhiteBalance(shapes) {
	let avgR = 0;
	let avgG = 0;
	let avgB = 0;

	for (let shape of shapes) {
		let unbalancedWhite = shape.meanOutside;
		avgR += unbalancedWhite[0];
		avgG += unbalancedWhite[1];
		avgB += unbalancedWhite[2];
	}

	let shapeCount = shapes.length;
	avgR /= shapeCount;
	avgG /= shapeCount;
	avgB /= shapeCount;

	//the gamma corrected version doesn't seem to make any difference for the hue of colors
	// let avgGray =  0.2989 * avgR + 0.5870 * avgG + 0.1140 * avgB;
	let avgGray =  (avgR + avgG + avgB) / 3;

	let diffR = avgR - avgGray;
	let diffG = avgG - avgGray;
	let diffB = avgB - avgGray;

	// console.log(Math.round(avgR), "r", Math.round(diffR));
	// console.log(Math.round(avgG), "g", Math.round(diffG));
	// console.log(Math.round(avgB), "b", Math.round(diffB));

	for (let shape of shapes) {
		let correctedContour = [...shape.meanContour];
		correctedContour[0] -= diffR;
		correctedContour[1] -= diffG;
		correctedContour[2] -= diffB;
		shape.meanContour = correctedContour;
	}
}

function findShapeColor(hlsColor) {
	let hue = hlsColor[0] * 360;

	if (hue >= 340 || hue <= 15) {
		return "red"
	} else if (hue >= 240 && hue <= 300) {
		return "purple";
	} else if (hue >= 60 && hue <= 180) {
		return "green";
	} else {
		//white balance fix should make this irrelevant
		return "purple"
	}
}

function findShading(hslColorInside, hslColorOutside) {

	let fallOff = hslColorOutside[2] - hslColorInside[2];

	if (fallOff < 0.04) {
		return "open";
	} else if (fallOff < 0.21) {
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
