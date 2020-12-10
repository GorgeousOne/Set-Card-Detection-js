let fileInput = document.getElementById("realFile");
let takePicButton = document.getElementById("pictureButton");
let loadExampleButton = document.getElementById("exampleButton");

let imageView = document.getElementById("imageView");
let canvas = document.getElementById("canvasOutput");

takePicButton.addEventListener("click", function () {
	fileInput.click();
});

loadExampleButton.addEventListener("click", function () {
	imageView.src = "res/test03.JPG";
	showImageView()
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

imageView.addEventListener("load", function () {

	let img = cv.imread(imageView);
	let scaledImg = resizeImg(img);
	let cards = detectSetCards(scaledImg);

	if (cards.length === 0) {
		console.log("No card found in this image");
	}else {
		console.log("found", cards.length, "cards");
		// displayCards(cards, scaledImg);
	}

	let sets = findSets(cards);
	console.log(sets.length, "found sets");
	console.log(sets);
	displaySets(sets, scaledImg);

	cv.imshow("canvasOutput", scaledImg);
	scaledImg.delete();
});



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

		cv.line(image, set[0].mid(), set[1].mid(), rndColor, 2);
		cv.line(image, set[1].mid(), set[2].mid(), rndColor, 2);
	}
}