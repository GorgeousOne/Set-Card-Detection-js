
if (hasGetUserMedia()) {

	let vidConstraints = {
		video: true,
	};

	navigator.mediaDevices.getUserMedia(vidConstraints).then(stream => {
		document.getElementById("video").srcObject = stream;
	}).catch(console.error);

} else {
	alert("getUserMedia() is not supported by your browser");
}

function hasGetUserMedia() {
	return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

let screenshotButton = document.getElementById("screenshot-button");
let img = document.getElementById("img");
let video = document.getElementById("video");
let canvas = document.createElement("canvas");

screenshotButton.onclick = video.onclick = function () {
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	canvas.getContext("2d").drawImage(video, 0, 0);
	img.src = canvas.toDataURL("image/webp");
};

function handleSuccess(stream) {
	screenshotButton.disabled = false;
	video.srcObject = stream;
}