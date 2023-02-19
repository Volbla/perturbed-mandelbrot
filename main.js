import {makeProgram, makeVertexBuffer} from './webgl_boilerplate.js';

const canvas = document.getElementsByTagName("canvas")[0];
const gl = canvas.getContext("webgl2", {depth: false, alpha: false, antialias: true});


function main() {
	if (gl === null) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}

	const program = makeProgram(gl);
	if (program === null) return;
	// The square canvas
	const corners = new Float32Array([-1,-1 , -1,1 , 1,-1 , 1,1]);
	makeVertexBuffer(gl, corners, gl.getAttribLocation(program, 'Position'), gl.STATIC_DRAW, 0);

	const glLocations = {
		resolution: gl.getUniformLocation(program, 'Resolution'),
		zoom: gl.getUniformLocation(program, 'Zoom'),
		reference: gl.getUniformLocation(program, 'Reference'),
		centerOffset: gl.getUniformLocation(program, 'CenterOffset'),
		series: gl.getUniformLocation(program, 'Series'),
		time: gl.getUniformLocation(program, 'Time'),
	};

	function draw(){
		gl?.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	// Currently not using Time for anything.
	const FPS = 20;
	var time = 0, keepDrawing = false;
	function loopDraw(){
		if (keepDrawing) {
			gl?.uniform1f(glLocations.time, time);
			draw();
			time += 1/FPS;
			setTimeout(loopDraw, 1000/FPS);
		}
	}


	var zoom = -2.8;
	let reference
	// Random point i've picked. The second variant is closer to exactly a 270 long cycle.
	//  = [-0.74776, -0.069597];
	 = [-0.7468532881, -0.06969976977];

	// IQ's first example point. Second is closer to an 8-cycle and appears in a larger bulb.
	// Third is closer to a 24-cycle.
	// = [-1.1900443, 0.3043895];
	// = [-1.185611193, 0.3030408866];
	// = [-1.190008119, 0.3043943174];

	gl.uniform1f(glLocations.zoom, zoom);
	gl.uniform2fv(glLocations.reference, reference);


	window.addEventListener("resize", () => {
		setCanvasSize((width, height) => {
			gl.viewport(0, 0, width, height);
			gl.uniform2f(glLocations.resolution, width, height);
		});
		requestAnimationFrame(draw);
	});

	canvas.addEventListener("wheel", evt => {
		evt.preventDefault();
		zoom += 0.2 * Math.sign(evt.deltaY);
		gl.uniform1f(glLocations.zoom, zoom);
		console.log(zoom);
		requestAnimationFrame(draw);
	});

	var centerOffset = [0,0];
	var delx, dely;
	canvas.addEventListener("mousedown", evt => {
		evt.preventDefault();
		if (evt.button == 0)
			delx = evt.offsetX, dely = evt.offsetY;

		if (evt.button == 2) {
			const w = canvas.width, h = canvas.height;
			const x = (2 * evt.offsetX - w) / h * 10**(zoom) - centerOffset[0];
			const y = (2 * (h - evt.offsetY) - h) / h * 10**(zoom) - centerOffset[1];

			const maybeReference = newReference(reference[0]+x, reference[1]+y);
			if (maybeReference === null) {
				console.log("diverges");
				return
			}

			centerOffset = cAdd(centerOffset, cSub(maybeReference, reference));
			reference = maybeReference;
			console.log(reference);
			gl.uniform2fv(glLocations.reference, reference);
			gl.uniform2fv(glLocations.centerOffset, centerOffset);
			draw();
		}
	});

	canvas.addEventListener("contextmenu", evt => evt.preventDefault());

	canvas.addEventListener("mouseup", evt => {
		if (evt.button != 0) return

		delx = (evt.offsetX - delx) * 2 / canvas.height * 10**(zoom);
		dely = (evt.offsetY - dely) * 2 / canvas.height * 10**(zoom);
		centerOffset[0] += delx;
		centerOffset[1] -= dely;
		gl.uniform2fv(glLocations.centerOffset, centerOffset);
		draw();
	});

	canvas.addEventListener("dblclick", evt => {
		if (evt.button != 0) return
		console.log("double click");

		const w = canvas.width, h = canvas.height;
		const x = (2 * evt.offsetX - w) / h * 10**(zoom);
		const y = (2 * (h - evt.offsetY) - h) / h * 10**(zoom);

		centerOffset[0] -= x;
		centerOffset[1] -= y;
		gl.uniform2fv(glLocations.centerOffset, centerOffset);
		draw();
	});

	window.dispatchEvent(new Event("resize"));
}


function setCanvasSize(updateGLFunction){
	const h = window.innerHeight - 16,
		w = window.innerWidth - 16;
	// const w = 800, h = 600;

	const cWidth = Math.min(4/3 * h, w);
	const cHeight = 3/4 * cWidth;

	canvas.width = cWidth;
	canvas.height = cHeight;

	updateGLFunction(cWidth, cHeight);
}


function newReference(clickx, clicky) {
	const c = [clickx, clicky];
	const passed = new Set(c.toString());

	let z = mandelIter([0,0], c);
	while (!passed.has(z.toString())) {
		passed.add(z.toString());
		z = mandelIter(z,c);
		if (normSquared(z) > 4) return null
	}
	const z0 = z.toString()
	let zBest = z;
	do {
		z = mandelIter(z,c)
		if (normSquared(cSub(z,c)) < normSquared(cSub(zBest,c)))
			zBest = z;
	} while(z.toString() != z0)
	return zBest;
}


// I don't know how to make this work.
function seriesApproximation(center, updateGLFunction) {
	let zn = [0,0], a = [0,0], b = [0,0], c = [0,0], twoZn

	for (let i=0; i<(1200); i++) {
		twoZn = cDouble(zn);
		c = cAdd(cMul(twoZn,c), cDouble(cMul(a,b)));
		b = cAdd(cMul(twoZn,b), cMul(a,a));
		a = cAdd(cMul(twoZn,a), [1,0]);

		zn = cAdd(cMul(zn,zn), center);
	}

	// console.log(z, a, b, c);
	updateGLFunction(zn.concat(a, b, c));
}


function cDouble(a) {
	return [2*a[0], 2*a[1]];
}

function cAdd(a, b) {
	return [a[0]+b[0], a[1]+b[1]];
}

function cSub(a, b) {
	return [a[0]-b[0], a[1]-b[1]];
}

function cMul(a, b){
    return [a[0]*b[0] - a[1]*b[1], a[0]*b[1] + a[1]*b[0]];
}

function mandelIter(z, c) {
	return cAdd(cMul(z,z), c);
}

function normSquared(a) {
	return a[0]**2 + a[1]**2;
}


main();
