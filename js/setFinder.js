
function findSets(cards) {
	let sets = [];

	for (let i = 0; i < cards.length - 2; ++i) {
		for (let k = i + 1; k < cards.length - 1; k++) {
			let card1 = cards[i];
			let card2 = cards[k];
			let setRule = getSetRule(card1, card2);

			for (let m = k + 1; m < cards.length; m++) {
				let card3 = cards[m];
				let setRule2 = getSetRule(card3, card1);
				let setRule3 = getSetRule(card3, card2);

				if (doRulesMatch(setRule, setRule2) && doRulesMatch(setRule, setRule3)) {
					// console.log("SET!!!!", i, k, m);
					sets.push([card1, card2, card3]);
					break;
				}
			}
		}
	}
	return sets;
}

function getSetRule(card1, card2) {
	let shapeType1 = card1.shapeType;
	let shapeType2 = card2.shapeType;

	return [
		card1.shapeCount() === card2.shapeCount(),
		shapeType1.shape === shapeType2.shape,
		shapeType1.color === shapeType2.color,
		shapeType1.shading === shapeType2.shading,
	];
}

function doRulesMatch(setRule1, setRule2) {
	for (let i = 0; i < setRule1.length; ++i) {
		if (setRule1[i] !== setRule2[i]) {
			return false;
		}
	}
	return true;
}