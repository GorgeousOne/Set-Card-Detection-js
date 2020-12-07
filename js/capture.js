let  fileSelector = document.getElementById("real-file");
let fancyButton = document.getElementById("custom-button");

let imageBox = document.getElementById("img-box");
let imageView = document.getElementById("image-view");

fancyButton.addEventListener("click", function() {
	fileSelector.click();
});


fileSelector.addEventListener("change", function() {

	if (fileSelector.value) {

		showImageView();

		let file = fileSelector.files[0];
		let reader = new FileReader();

		reader.addEventListener("load", function () {
			imageView.src = reader.result;
		});

		if (file) {
			reader.readAsDataURL(file)
		}
	}
});

function showImageView() {

	fancyButton.style.display= "none";

	imageBox.style.display = "block";
	imageView.style.display = "block";

	document.body.style.backgroundColor = "#161616";
	imageView.src = fileSelector.value;

}