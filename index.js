const init = () => {
	document.querySelectorAll('#parts button').forEach(element => element.addEventListener('click', pickPart));
	document.querySelectorAll('.trigger').forEach(element => element.addEventListener('click', (event) => start(event.target.dataset.color)));
	initGrid();
	document.querySelector('#clearResults').addEventListener('click', () => document.querySelector('#output').innerHTML = '');
	document.querySelector('#pause').addEventListener('click', () => {
		if (document.querySelector('#pause').dataset.pause === "true") {
			start();
		} else {
			document.querySelector('#pause').dataset.pause = "true";
			document.querySelector('#pause').innerHTML = 'Continue';
		}
	});
	document.querySelector('#save').addEventListener('click', save);
	document.querySelector('#loadLocal').addEventListener('click', () => load(true));
	document.querySelector('#loadText').addEventListener('click', () => load(false));
	document.querySelector('#ramp').click();
};

const states = {
	ramp:	[
		'left',
		'right',
	],
	bit:	[
		'left',
		'right',
	],
	gearBit:	[
		'left',
		'right',
	],
};

const pickPart = (event) => {
	const el = event.target;
	document.querySelector('#parts').dataset.newPart = el.dataset.partSelect;
	document.querySelectorAll('#parts button').forEach(element => element.removeAttribute('class'));
	el.setAttribute('class', 'active');
	document.querySelectorAll('.peg').forEach(element => {
		element.removeEventListener('click', setPart, true);
		element.addEventListener('click', setPart, true);
	});
};

const setPart = (event) => {
	const el = event.target;
	const part = el.dataset.part;
	const newPart = document.querySelector('#parts').dataset.newPart;

	if (el.className === 'gear') {
		if (part) {
			el.removeAttribute('data-part');
		} else {
			el.dataset.part = 'gear';
			if (el.previousElementSibling.dataset.part === 'gearBit'
				&& el.nextElementSibling.dataset.part === 'gearBit') {
				el.nextElementSibling.dataset.state = el.previousElementSibling.dataset.state;
			}
		}
	} else {
		const state = el.dataset.state;

		if (part && part === newPart) {
			if (state) {
				let nextState = states[part][states[part].indexOf(state) + 1];
				let gearGroup = [el];
				if (newPart === 'gearBit') {
					gearGroup = getGearGroup([el]);
				}
				if (gearGroup.length > 1) {
					nextState = nextState || states[part][0];
					orientGearGroup(el, nextState);
				} else if (nextState) {
					el.dataset.state = nextState ;
				} else {
					el.removeAttribute('data-part');
					el.removeAttribute('data-state');
				}
			} else {
				el.removeAttribute('data-part');
			}
		} else {
			el.dataset.part = newPart;
			if (states[newPart]?.length) {
				el.dataset.state = states[newPart][0];
			} else {
				el.removeAttribute('data-state');
			}
		}
	}
};

const activatePeg = async (row, col, color, inDirection) => {
	const rowPegs = document.querySelectorAll(`tbody tr:nth-child(${row}) td`);
	const thisPeg = rowPegs[col-1];

	if (thisPeg) {
		let nextCol;
		let comingFrom;

		thisPeg.dataset.ball = color;
		await new Promise((r) => setTimeout(r, 100));
		if (document.querySelector('#pause').dataset.pause === 'true') {
			document.querySelector('#pause').dataset.row = row;
			document.querySelector('#pause').dataset.col = col;
			document.querySelector('#pause').dataset.color = color;
			document.querySelector('#pause').dataset.inDirection = inDirection;
			return;
		}
		thisPeg.removeAttribute('data-ball');
		document.querySelector('#pause').removeAttribute('continue');

		switch (thisPeg.dataset.part) {
			case 'ramp':
				if (thisPeg.dataset.state === 'left') {
					comingFrom = 'right';
					nextCol = col - 1;
				} else if (thisPeg.dataset.state === 'right') {
					comingFrom = 'left';
					nextCol = col + 1;
				}
				break;
			case 'crossover':
				if (inDirection === 'left') {
					comingFrom = 'left';
					nextCol = col + 1;
				} else if (inDirection === 'right') {
					comingFrom = 'right';
					nextCol = col - 1;
				}
				break;
			case 'bit':
				if (thisPeg.dataset.state === 'left') {
					comingFrom = 'right';
					nextCol = col - 1;
					thisPeg.dataset.state = 'right';
				} else if (thisPeg.dataset.state === 'right') {
					comingFrom = 'left';
					nextCol = col + 1;
					thisPeg.dataset.state = 'left';
				}
				break;
			case 'interceptor':
				thisPeg.dataset.ball = color;
				break;
			case 'gearBit':
				if (thisPeg.dataset.state === 'left') {
					comingFrom = 'right';
					nextCol = col - 1;
					orientGearGroup(thisPeg, 'right');
				} else if (thisPeg.dataset.state === 'right') {
					comingFrom = 'left';
					nextCol = col + 1;
					orientGearGroup(thisPeg, 'left');
				}
				break;
			default:
					error();
					return;
		}
		if ((row === totalRows && col === (totalColumns + 1)/2)
			|| (row === totalRows - 1 && nextCol !== (totalColumns + 1)/2)) {
			addToOutput(color, nextCol < (totalColumns/2) ? 'blue' : 'red');
		} else {
			activatePeg(row + 1, nextCol, color, comingFrom);
		}
	} else {
		error();
	}
};

const addToOutput = (color, nextColor) => {
	const newBall = document.createElement('span');
	newBall.setAttribute('class', color);
	document.querySelector('#output').append(newBall);
	start(nextColor);
};

const error = (error = null) => {
	document.querySelector('#pause').setAttribute('disabled', '');
	alert('you really dropped the ball');
};

const start = (color = null) => {
	const pauseEl = document.querySelector('#pause');
	if (pauseEl.dataset.pause === "true") {
		pauseEl.removeAttribute('data-pause');
		pauseEl.setAttribute('disabled', '');
		pauseEl.innerHTML = 'pause';
		activatePeg(parseInt(pauseEl.dataset.row, 10), parseInt(pauseEl.dataset.col, 10), pauseEl.dataset.color, pauseEl.dataset.inDirection);
	} else {
		document.querySelector('#pause').removeAttribute('disabled');
		const hopper = document.querySelector(`.hopper[data-color="${color}"]`);
		if (hopper.value > 0) {
			hopper.value -= 1;
			if (color === 'blue') {
				activatePeg(1, 4, color, 'left');
			} else if (color === 'red') {
				activatePeg(1, 8, color, 'right');
			}
		}
	}
};


const getGearGroup = (gearGroup = []) => {
	const addNeighbors = (gearGroup = []) => {
		const getNeighbors = [
			(el) => el.parentElement.previousElementSibling?.querySelectorAll('td')[el.cellIndex],
			(el) => el.nextElementSibling,
			(el) => el.parentElement.nextElementSibling?.querySelectorAll('td')[el.cellIndex],
			(el) => el.previousElementSibling,
		];
		const parts = ['gearBit','gear'];
		const neighbors = [];
		gearGroup.forEach(element => getNeighbors.forEach(element$ => neighbors.push(element$(element))));

		const newGearGroup = [];
		neighbors.forEach(element => {
			if (parts.includes(element?.dataset?.part) && !gearGroup.includes(element)) {
				newGearGroup.push(element);
			}
		});
		return newGearGroup.concat(gearGroup);
	}
	const newGearGroup = addNeighbors(gearGroup);
	const oldGearGroup = [...gearGroup];

	if (newGearGroup.length > gearGroup.length) {
		gearGroup = getGearGroup(newGearGroup);
	}
	return gearGroup;
};

const orientGearGroup = (el, state) => {
	getGearGroup([el])
		.filter(element => element.className === 'peg')
		.forEach(element => element.dataset.state = state);
};

const initGrid = () => {
	document.querySelectorAll('.gear').forEach(element => {
		element.removeEventListener('click', setPart, true);
		element.addEventListener('click', setPart, true);
	});
};

const save = () => {
	const saved = [];
	document.querySelectorAll('tbody tr').forEach(element => {
		const savedCells = [];
		element.querySelectorAll('td').forEach(element => {
			savedCells.push(JSON.stringify(element.dataset));
		});
		saved.push(savedCells);
	})
	const savedText = btoa(JSON.stringify(saved));
	document.querySelector('#saved').value = savedText;

	const localNameSave = document.querySelector('#localNameSave').value;
	if (localStorage && localNameSave) {
		localStorage.setItem(localNameSave, savedText);
	}
};

const load = (local) => {
	let savedText;
	if (local) {
		if (localStorage) {
			savedText = localStorage.getItem(document.querySelector('#localNameLoad').value);
		} else {
			alert('localStorage not available');
		}
	} else {
		savedText = document.querySelector('#savedText').value.trim();
	}
	const saved = [];
	JSON.parse(atob(savedText)).forEach(element => {
		let savedCells =[];
		element.forEach(element => savedCells.push(JSON.parse(element)));
		saved.push(savedCells);
	});
	document.querySelectorAll('tbody tr').forEach((element, index) => {
		const thisRow = saved[index];
		element.querySelectorAll('td').forEach((element, index) => {
			if(thisRow[index].part) {
				element.dataset.part = thisRow[index].part;
			}
			if (thisRow[index].state) {
				element.dataset.state = thisRow[index].state;
			}
		});
	});
};
