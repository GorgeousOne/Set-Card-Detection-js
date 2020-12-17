
let fileInput = document.getElementById("realFile");
let takePicButton = document.getElementById("pictureButton");
let loadExampleButton = document.getElementById("exampleButton");

let imageView = document.getElementById("imageView");
let canvas = document.getElementById("canvasOutput");
let returnButton = document.getElementById("returnButton");

window.mobileCheck = function() {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

if (mobileCheck()) {
	returnButton.style.left = "10px";
	returnButton.style.bottom = "10px";
}

takePicButton.addEventListener("click", function () {
	fileInput.click();
});

loadExampleButton.addEventListener("click", function () {
	imageView.src = "res/test" + (10 + Math.floor(Math.random() * 6)) + ".jpg";
	toggleScreen();
});

fileInput.addEventListener("change", function () {

	if (fileInput.value) {
		toggleScreen();
		imageView.src = URL.createObjectURL(fileInput.files[0]);
	}
});

returnButton.addEventListener("click", function () {
	toggleScreen();
});

let isImgAnalysisVisible = false;

function toggleScreen() {

	if (isAnalysisVisible) {
		takePicButton.style.display = "block";
		loadExampleButton.style.display = "block";
		canvas.style.display = "none";
		returnButton.style.display = "none";
		document.body.style.backgroundColor = "#fff";

	}else {
		takePicButton.style.display = "none";
		loadExampleButton.style.display = "none";
		canvas.style.display = "block";
		returnButton.style.display = "block";
		document.body.style.backgroundColor = "#16161d";
	}

	isAnalysisVisible = !isAnalysisVisible;
}

function showSnackBar(text) {

	let snackbar = document.getElementById("snackbar");
	snackbar.innerText = text;
	snackbar.className = "show";
	setTimeout(function () {
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

function switchView() {

	if (analyseImg === undefined) {
		return;
	}

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