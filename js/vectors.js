
function cloneVec(vec) {
	return Object.assign({}, vec);
}

function lengthVec(vec) {
	return Math.sqrt(vec.x ** 2 + vec.y ** 2);
}

function normVec(vec) {
	length = lengthVec(vec);
	vec.x /= length;
	vec.y /= length;
	return vec
}


function subVec(vec, other) {
	vec.x -= other.x;
	vec.y -= other.y;
	return vec
}

function addVec(vec, other) {
	vec.x += other.x;
	vec.y += other.y;
	return vec
}

function multVec(vec, scalar) {
	vec.x *= scalar;
	vec.y *= scalar;
	return vec
}
