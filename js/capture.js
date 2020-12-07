let  fileInput = document.getElementById("real-file");
let fancyButton = document.getElementById("custom-button");

let imageBox = document.getElementById("img-box");
let imageView = document.getElementById("image-view");
let canvas = document.getElementById("canvas-output");

fancyButton.addEventListener("click", function() {
	fileInput.click();
});


fileInput.addEventListener("change", function() {

	if (fileInput.value) {

		showImageView();
		imageView.src = URL.createObjectURL(fileInput.files[0]);


		// let file = fileInput.files[0];
		// let reader = new FileReader();

		// reader.addEventListener("load", function () {
		// 	imageView.src = reader.result;
		// });
		//
		// if (file) {
		// 	reader.readAsDataURL(file)
		// }
	}
});

imageView.onload = function () {

	let mat = cv.imread(imageView);
	cv.imshow('canvas-output', mat);
};

function showImageView() {
	fancyButton.style.display= "none";
	imageBox.style.display = "block";
	// imageView.style.display = "block";
	canvas.style.display = "block";
	document.body.style.backgroundColor = "#16161d";
}