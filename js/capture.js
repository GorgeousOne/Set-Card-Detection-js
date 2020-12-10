let fileInput = document.getElementById("realFile");
let fancyButton = document.getElementById("customButton");

let imageView = document.getElementById("imageView");
let canvas = document.getElementById("canvasOutput");

fancyButton.addEventListener("click", function () {
	fileInput.click();
});

fileInput.addEventListener("change", function () {

	console.log("SOMETHIGN");
	// if (fileInput.value) {

		showImageView();
		imageView.src = URL.createObjectURL(fileInput.files[0]);
		// let file = fileInput.files[0];
		// let reader = new FileReader();
		// reader.addEventListener("load", function () {
		// 	imageView.src = reader.result;
		// });
		// if (file) {
		// 	reader.readAsDataURL(file);
		// }
	// }
});

imageView.addEventListener("load", function () {

	let img = cv.imread(imageView);
	startDetection(img);
});

function showImageView() {
	fancyButton.style.display = "none";
	// imageView.style.display = "block";
	canvas.style.display = "block";
	document.body.style.backgroundColor = "#16161d";
}

function startDetection(img) {

	let scaledImg = getImgResized(img);

	let grayImg = getImgBlurredGray(scaledImg);
	let contours = findContours(grayImg);

	let imgSize = scaledImg.size();
	let imgWidth = imgSize.width;
	let imgHeight = imgSize.height;
	let imgMinExtent = Math.min(imgWidth, imgHeight);

	let possibleShapes = findPossibleShapes(contours, imgMinExtent, scaledImg);
	let actualShapes = findActualShapes(possibleShapes);

	findShapesColorsShading(actualShapes, scaledImg);
	let cards = findSetCards(actualShapes, scaledImg);

	let colors = [];

	for (let i = 0; i < cards.length; i++) {
		colors.push(hslToRgb(i / cards.length, Math.random() * 0.3 + 0.7, 0.5));
	}

	for (let j = 0; j < cards.length; j++) {

		let card = cards[j];
		let matVec = new cv.MatVector();
		let rndColor = colors[j];

		for (let i = 0; i < card.shapes.length; i++) {
			matVec.push_back(card.shapes[i].contour);
			cv.drawContours(scaledImg, matVec, i, rndColor, 2, cv.LINE_8);
		}
		matVec.delete();
	}

	cv.imshow('canvasOutput', scaledImg);

	contours.delete();
	scaledImg.delete();
	img.delete();
	grayImg.delete();
}

function getColorByName(colorName) {
	switch (colorName) {
		case "red":
			return [255, 0, 0, 255];
		case "green":
			return [0, 128, 0, 255];
		case "purple":
			return [128, 0, 255, 255];
		default:
			console.log("what color is this?", colorName);
			return undefined;
	}
}

function getImgResized(img) {

	let imgSize = img.size();
	let imgWidth = imgSize.width;
	let imgHeight = imgSize.height;

	let maxFactor = Math.floor(Math.max(imgWidth, imgWidth) / 1000);  // or whatever
	let imgResized = new cv.Mat();

	if (maxFactor > 1) {
		cv.resize(img, imgResized, new cv.Size(
			Math.floor(imgWidth / maxFactor),
			Math.floor(imgHeight / maxFactor)));
		return imgResized;

	} else
		return img;
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

function findPossibleShapes(contours, imgMinExtent, canvas) {

	let minContourPoints = imgMinExtent * 0.04;

	let minBoundsSize = imgMinExtent * 0.03;
	let minMinRectSize = imgMinExtent * 0.025;
	let maxMinRectSize = imgMinExtent * 0.19;
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
			return;
		}

		// cv.drawContours(canvas, contours, i, [255, 255, 255, 255], 2, cv.LINE_8);
		let shape = new SetShape(contour, minRect);
		shape.shapeType.shape = findShapeType(shapeExtent);
		possibleShapes.push(shape);
	}

	return possibleShapes;
}

function ratioFits(rect) {
	let minRatio = 1.3;
	let maxRatio = 3.2;
	let ratio = getGreaterAspectRatio(rect);
	return minRatio < ratio < maxRatio;
}

function getGreaterAspectRatio(minRect) {
	let width = minRect.size.width;
	let height = minRect.size.height;
	return width > height ? (width / height) : (height / width);
}

function findShapeType(boundsOccupation) {
	return (boundsOccupation < 0.666) ? "diamond" : (boundsOccupation < 0.81) ? "squiggle" : "oval";
}

function findActualShapes(shapes) {

	let uniqueShapes = [];

	for (let shape of shapes) {

		if (shape.childContour !== undefined) {
			continue;
		}

		let isUnique = true;

		for (let other of shapes) {

			if (shape === other) {
				continue;
			}

			let pointX = shape.contour.data32S[0];
			let pointY = shape.contour.data32S[1];

			if (cv.pointPolygonTest(other.contour, new cv.Point(pointX, pointY), false) > 0) {

				other.childContour = shape.contour;
				isUnique = false;
				break;
			}
		}

		if (isUnique) {
			uniqueShapes.push(shape);

			for (let shape of uniqueShapes) {
				shape.parentContour = growContour(shape.contour, shape.minExtent * 0.2);
				if ("childContour" in shape) {
					shape.childContour = growContour(shape.contour, shape.minExtent * -0.1);
				}
			}
		}
	}

	console.log("found " + uniqueShapes.length + " uniques");
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

function findShapesColorsShading(shapes, coloredImg) {

	for (let shape of shapes) {

		let matVec = new cv.MatVector();
		matVec.push_back(shape.childContour);
		matVec.push_back(shape.contour);
		matVec.push_back(shape.parentContour);

		let rect = cv.boundingRect(shape.parentContour);
		let offset = new cv.Point(-rect.x, -rect.y);

		let roi = coloredImg.roi(rect);
		let roiSize = roi.size();
		let mask = new cv.Mat.zeros(roiSize.height, roiSize.width, cv.CV_8U);

		// cv.drawContours(mask, matVec, 0, white, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		// cv.imshow('canvasOutput', mask);
		// return;

		cv.drawContours(mask, matVec, 0, white, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		let meanInside = cv.mean(roi, mask);

		cv.drawContours(mask, matVec, 1, white, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		cv.drawContours(mask, matVec, 0, black, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		let meanContour = cv.mean(roi, mask);

		cv.drawContours(mask, matVec, 2, white, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		cv.drawContours(mask, matVec, 1, black, -1, cv.LINE_8, new cv.Mat(), 0, offset);
		let meanOutside = cv.mean(roi, mask);

		shape.shapeType.color = findShapeColor(rgbToHsl(meanContour));
		shape.shapeType.shading = findShading(rgbToHsl(meanInside), rgbToHsl(meanOutside));

		roi.delete();
		mask.delete();

		// cv.drawContours(coloredImg, matVec, 2, meanOutside, 2, cv.LINE_8);
		// cv.drawContours(coloredImg, matVec, 2, getColorByName(shape.shapeType.color), 2, cv.LINE_8);
		// cv.drawContours(coloredImg, matVec, 1, meanContour, 2, cv.LINE_8);
		// cv.drawContours(coloredImg, matVec, 0, meanInside, 2, cv.LINE_8);
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

	if (hue >= 350 || hue <= 20) {
		return "red";
	} else if (hue >= 230 && hue <= 340) {
		return "purple";
	} else if (hue >= 30 && hue <= 160) {
		return "green";
	} else {
		console.log("no color found for", Math.floor(hue));
		return "other";
	}
}

function findShading(hslColorInside, hslColorOutside) {

	let lightInside = hslColorInside[2] * 100;
	let lightOutside = hslColorOutside[2] * 100;
	let fallOff = Math.abs(lightOutside - lightInside);
	// console.log(Math.floor(lightInside), Math.floor(lightOutside), Math.floor(fallOff));

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

		// console.log(shape.shapeType.toString() + ":");
		// let mid = shape.minRect.center;
		// cv.circle(canvas, mid, 1, white, 2);
		// cv.circle(canvas, mid, 1.75 * shape.minExtent, white, 1);

		let isShapeLinked = linkedShapes.includes(shape);

		for (let k = i + 1; k < shapes.length; k++) {
			let other = shapes[k];

			if (!other.shapeType.equals(shape.shapeType)) {
				continue;
			}

			let midDistSquared = distSquared(shape.minRect.center, other.minRect.center);
			// cv.circle(canvas, mid, Math.sqrt(midDistSquared), [255, 0, 0, 255], 1)

			if (Math.sqrt(midDistSquared) < (1.75 * Math.max(shape.minExtent, other.minExtent))) {
				linkedShapes.push(other);
				addCard(foundCards, shape, other);
				isShapeLinked = true;

				// console.log("  ->", shape.shapeType.toString());
				// cv.circle(canvas, mid, Math.sqrt(midDistSquared), [0, 128, 255, 255], 1);
			}
		}

		if (!isShapeLinked) {
			// console.log("  *none*");
			foundCards.push(new SetCard(shape.shapeType, [shape]));
		}
	}
	// console.log(foundCards.length, " cards found");
	return foundCards;
}

function distSquared(p0, p1) {
	return (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2;
}

function addCard(cards, shape, otherShape) {

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