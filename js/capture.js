let fileInput = document.getElementById("real-file");
let fancyButton = document.getElementById("custom-button");

// let imageBox = document.getElementById("img-container");
let imageView = document.getElementById("imageView");
let canvas = document.getElementById("canvasOutput");

fancyButton.addEventListener("click", function () {
	fileInput.click();
});

//imageView.addEventListener("load", function () {

// if (fileInput.value) {
// 	showImageView();
// 	imageView.src = URL.createObjectURL(fileInput.files[0]);

// let file = fileInput.files[0];
// let reader = new FileReader();
// reader.addEventListener("load", function () {
// 	imageView.src = reader.result;
// });
// if (file) {
// 	reader.readAsDataURL(file)
// }
// }
// });

imageView.addEventListener("load", function () {

	let img = cv.imread(imageView);
	startDetection(img);
});

function showImageView() {
	fancyButton.style.display = "none";
	// imageBox.style.display = "block";
	//imageView.style.display = "block";
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

	let matVec = new cv.MatVector();

	//didnt find a clear method for MatVector :(
	for (let i = 0; i < actualShapes.length; i++) {
		let shape = actualShapes[i];
		matVec.push_back(shape.parentContour);
		cv.drawContours(scaledImg, matVec, i, [255, 0, 0, 255], 2, cv.LINE_8);
	}

	matVec.delete();


	cv.imshow('canvasOutput', scaledImg);

	contours.delete();
	img.delete();
	// scaledImg.delete();
	grayImg.delete();
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
			cv.drawContours(canvas, contours, i, [0, 0, 0, 255], 1, cv.LINE_8);
			continue;
		}

		let minRect = cv.minAreaRect(contour);
		let rectWidth = minRect.size.width;
		let rectHeight = minRect.size.height;

		if (rectWidth < minMinRectSize || rectHeight < minMinRectSize) {
			//purple - minrect too thin
			cv.drawContours(canvas, contours, i, [128, 0, 128, 255], 1, cv.LINE_8);
			continue;
		}

		if (rectWidth > maxMinRectSize && rectHeight > maxMinRectSize) {
			//blue - minrect too large
			cv.drawContours(canvas, contours, i, [0, 0, 255, 255], 1, cv.LINE_8);
			continue;
		}

		if (!ratioFits(minRect)) {
			//green - minrect ratio unproportional
			cv.drawContours(canvas, contours, i, [0, 128, 0, 255], 1, cv.LINE_8);
			continue;
		}

		let area = cv.contourArea(contour);
		let shapeExtent = area / (rectWidth * rectHeight);

		if (shapeExtent < minExtent) {
			//orange - shape extent too small
			cv.drawContours(canvas, contours, i, [255, 128, 0, 255], 1, cv.LINE_8);
			continue;
		}

		if (shapeExtent > maxExtent) {
			//red - shape extent too big
			cv.drawContours(canvas, contours, i, [255, 0, 0, 255], 1, cv.LINE_8);
			return;
		}

		// cv.drawContours(canvas, contours, i, [255, 255, 255, 255], 2, cv.LINE_8);

		let shape = new SetShape(contour, boundingRect, minRect);
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
	return (boundsOccupation < 0.65) ? "diamond" : (boundsOccupation < 0.81) ? "squiggle" : "oval";
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
			console.log("found another one");

			for (let shape of uniqueShapes) {
				shape.parentContour = growContour(shape.contour, shape.minExtent * 0.08);
				if ("childContour" in shape) {
					shape.childContour = growContour(shape.contour, -shape.minExtent * 0.08);
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
		nextPoint = getContourPoint(contour, i % contourLength)
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