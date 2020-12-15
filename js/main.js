// if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
// 	document.getElementById("body").style.cursor = "pointer"
// }

let fileInput = document.getElementById("realFile");
let takePicButton = document.getElementById("pictureButton");
let loadExampleButton = document.getElementById("exampleButton");

let imageView = document.getElementById("imageView");
let canvas = document.getElementById("canvasOutput");

takePicButton.addEventListener("click", function () {
	fileInput.click();
});

loadExampleButton.addEventListener("click", function () {

	imageView.src = "res/test" + (10 + Math.floor(Math.random() * 6)) + ".jpg";
	showImageView();
});

fileInput.addEventListener("change", function () {

	if (fileInput.value) {
		showImageView();
		imageView.src = URL.createObjectURL(fileInput.files[0]);
	}
});

function showImageView() {
	takePicButton.style.display = "none";
	loadExampleButton.style.display = "none";
	canvas.style.display = "block";
	document.body.style.backgroundColor = "#16161d";
}

function showSnackBar(text) {

	let snackbar = document.getElementById("snackbar");
	snackbar.innerText = text;
	snackbar.className = "show";
	setTimeout(function () {
		// snackbar.className = snackbar.className.replace("show", "");
		snackbar.className = "";
	}, 3000);
}

let scaledImg;
let analyseImg;
let isAnalysisVisible = false;

imageView.addEventListener("load", function () {

	let img = cv.imread(imageView);
	scaledImg = resizeImg(img);

	let cards = detectSetCards(scaledImg);

	if (cards.length === 0) {
		showSnackBar("Could not find any cards :(");

	} else {

		let sets = findSets(cards);

		if (sets.length === 0) {
			showSnackBar("Could not find any sets :(");
		}

		console.log(sets.length, "found sets");
		console.log(sets);

		analyseImg = scaledImg.clone();
		displaySets(sets, scaledImg);
		displayShapes(cards, analyseImg);
	}

	cv.imshow("canvasOutput", scaledImg);
});

canvas.addEventListener('click', function () {
	switchView();
}, true);

// document.body.addEventListener('touchstart', function () {
// 	switchView();
// }, true);

function switchView() {
	// if (canvas.style.display !== "block") {
	// 	return;
	// }

	if (isAnalysisVisible) {
		cv.imshow("canvasOutput", scaledImg);
		isAnalysisVisible = false;
	}else {
		cv.imshow("canvasOutput", analyseImg);
		isAnalysisVisible = true;
	}
}

function resizeImg(img) {

	let imgSize = img.size();
	let imgWidth = imgSize.width;
	let imgHeight = imgSize.height;

	let maxFactor = Math.floor(Math.max(imgWidth, imgWidth) / 1000);  // or whatever
	let imgResized = new cv.Mat();

	if (maxFactor > 1) {
		cv.resize(img, imgResized, new cv.Size(
			Math.floor(imgWidth / maxFactor),
			Math.floor(imgHeight / maxFactor)));
		img.delete();
		return imgResized;

	} else
		return img;
}

function displayShapes(cards, image) {

	for (let card of cards) {

		for (let shape of card.shapes) {

			let mid = shape.minRect.center;
			cv.circle(image, mid, shape.minLength * 2 / 3, shape.meanContour, -1);
			cv.circle(image, mid, shape.minLength / 2, shape.meanInside, -1);

			let label =
				shape.shapeType.color[0] +
				shape.shapeType.shape[0].toUpperCase();

			let anchor = addVec(cloneVec(mid), {x: -20, y: 10});
			cv.putText(image, label, anchor, cv.FONT_HERSHEY_SIMPLEX,
				1, black, 1, cv.LINE_AA);
		}
	}
}

function displayCards(cards, image) {

	let colors = [];

	for (let i = 0; i < cards.length; i++) {
		colors.push(hslToBgr(i / cards.length, Math.random() * 0.3 + 0.7, 0.5));
	}

	for (let j = 0; j < cards.length; j++) {

		let card = cards[j];
		let matVec = new cv.MatVector();
		let rndColor = colors[j];

		for (let i = 0; i < card.shapes.length; i++) {
			matVec.push_back(card.shapes[i].contour);
			cv.drawContours(image, matVec, i, rndColor, 2, cv.LINE_8);
		}
		matVec.delete();
	}
}

function displaySets(sets, image) {

	let colors = [];

	for (let i = 0; i < sets.length; i++) {
		colors.push(hslToBgr(i / sets.length, Math.random() * 0.3 + 0.7, 0.5));
	}

	for (let j = 0; j < sets.length; j++) {

		let set = sets[j];
		let rndColor = colors[j];

		let mid0 = set[0].mid();
		let mid1 = set[1].mid();
		let mid2 = set[2].mid();

		let dist0 = lengthVec(subVec(cloneVec(mid0), mid1));
		let dist1 = lengthVec(subVec(cloneVec(mid1), mid2));
		let dist2 = lengthVec(subVec(cloneVec(mid2), mid0));

		if (dist0 < dist1) {
			drawLineBetween(set[0], set[1], image, rndColor, 3);

			if (dist1 < dist2) {
				drawLineBetween(set[1], set[2], image, rndColor, 3);
			} else {
				drawLineBetween(set[2], set[0], image, rndColor, 3);
			}

		} else {
			drawLineBetween(set[1], set[2], image, rndColor, 3);

			if (dist0 < dist2) {
				drawLineBetween(set[0], set[1], image, rndColor, 3);
			} else {
				drawLineBetween(set[2], set[0], image, rndColor, 3);
			}
		}
	}
}

function drawLineBetween(card1, card2, image, color, width) {

	let mid1 = card1.mid();
	let mid2 = card2.mid();

	cv.circle(image, mid1, 2 * width, color, -1, cv.LINE_AA);
	cv.circle(image, mid2, 2 * width, color, -1, cv.LINE_AA);
	cv.line(image, mid1, mid2, color, width, cv.LINE_AA);
}