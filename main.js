import {makeProgram, makeVertexBuffer} from "./webgl_boilerplate.js";

const canvas = document.getElementsByTagName("canvas")[0];
const gl = canvas.getContext("webgl2", {depth: false, alpha: false, antialias: true});
var canvasWidth, canvasHeight;
const ITER = 2500;


function main() {
	if (gl === null) {
		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
		return;
	}

	const program = makeProgram(gl);
	if (program === null) return;
	// The square canvas
	const corners = new Float32Array([-1,-1 , -1,1 , 1,-1 , 1,1]);
	makeVertexBuffer(gl, corners, gl.getAttribLocation(program, "Position"), gl.STATIC_DRAW, 0);

	const glLocations = {
		resolution: gl.getUniformLocation(program, "Resolution"),
		scale: gl.getUniformLocation(program, "Scale"),
		reference: gl.getUniformLocation(program, "Reference"),
		centerOffset: gl.getUniformLocation(program, "CenterOffset"),

		series: gl.getUniformLocation(program, "Series"),
		skipped: gl.getUniformLocation(program, "IterationsSkipped")
	};

	function draw(){
		gl?.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}


	let startX, startY, pixelSize;
	let scaleExp = -6.8;
	let scale = 10**scaleExp;
	let reference
	// = [-0.7468532881, -0.06969976977];
	= [ -0.7469007923551378, -0.06817003134927321 ];
	// = [-1.190008119, 0.3043943174];
	let centerOffset
	// = [0,0];
	= [ 5.1353547413618254e-8, 5.6598606195276924e-8 ];


	window.addEventListener("resize", () => {
		setCanvasSize(glLocations.resolution);
		pixelSize = 2 / canvasHeight * scale;
		requestAnimationFrame(draw);
	});

	let scrolling = false;
	canvas.addEventListener("wheel", evt => {
		evt.preventDefault();
		scaleExp += 0.2 * Math.sign(evt.deltaY);
		scrolling = true;
	});
	setInterval(() => {
		if (!scrolling) return;

		scale = 10**scaleExp;
		pixelSize = 2 / canvasHeight * scale;
		gl.uniform1f(glLocations.scale, scale);
		requestAnimationFrame(draw);

		console.log(scaleExp);
		scrolling = false;
	})

	canvas.addEventListener("mousedown", evt => {
		evt.preventDefault();

		if (evt.button == 0)	// Left click
			startX = evt.offsetX, startY = evt.offsetY;

		if (evt.button == 2) {	// Right click
			const newX = pixelRealValue(evt.offsetX, scale) - centerOffset[0] + reference[0],
				newY = pixelImagValue(evt.offsetY, scale) - centerOffset[1] + reference[1];

			const maybeNewReference = findNewReference([newX, newY]);
			if (maybeNewReference === null) return

			centerOffset = cAdd(centerOffset, cSub(maybeNewReference, reference));
			gl.uniform2fv(glLocations.centerOffset, centerOffset);
			reference = maybeNewReference;
			gl.uniform2fv(glLocations.reference, reference);
			requestAnimationFrame(draw);

			console.log(reference);
			console.log(centerOffset);
		}
	});

	canvas.addEventListener("mouseup", evt => {
		if (evt.button != 0) return
		if (evt.offsetX == startX && evt.offsetY == startY) return

		centerOffset[0] += (evt.offsetX - startX) * pixelSize;
		centerOffset[1] -= (evt.offsetY - startY) * pixelSize;
		gl.uniform2fv(glLocations.centerOffset, centerOffset);
		requestAnimationFrame(draw);

		console.log(centerOffset);
	});

	canvas.addEventListener("dblclick", evt => {
		if (evt.button == 0) {	// Left click
			centerOffset[0] -= pixelRealValue(evt.offsetX, scale);
			centerOffset[1] -= pixelImagValue(evt.offsetY, scale);
			gl.uniform2fv(glLocations.centerOffset, centerOffset);
			requestAnimationFrame(draw);

			console.log(centerOffset);
		}
	});

	canvas.addEventListener("contextmenu", evt => evt.preventDefault());


	gl.uniform1f(glLocations.scale, scale);
	gl.uniform2fv(glLocations.reference, reference);
	gl.uniform2fv(glLocations.centerOffset, centerOffset);
	window.dispatchEvent(new Event("resize"));
}


function setCanvasSize(loc){
	const h = window.innerHeight - 16,
		w = window.innerWidth - 16;
	// const w = 800, h = 600;

	canvasWidth = Math.min(4/3 * h, w);
	canvasHeight = 3/4 * canvasWidth;

	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	gl?.viewport(0, 0, canvasWidth, canvasHeight);
	gl?.uniform2f(loc, canvasWidth, canvasHeight);
}


function findNewReference(c) {
	const passed = new Set(c.toString());

	let z = mandelIter([0,0], c);
	while (!passed.has(z.toString())) {
		passed.add(z.toString());
		z = mandelIter(z,c);
		if (normSquared(z) > 4) {
			console.log("diverges");
			return null;
		}
	}
	const z0 = z.toString();
	let zBest = z,
		loopLength = 0;
	do {
		z = mandelIter(z,c)
		if (normSquared(cSub(z, c)) < normSquared(cSub(zBest, c)))
			zBest = z;
		loopLength++;
	} while(z.toString() != z0)

	console.log(loopLength);

	return zBest;
}


function seriesApproximation(reference, scale, locSeries, locSkipped) {
	let z = [0,0], A = [0,0], B = [0,0], C = [0,0], twoZ, i

	for (i=0; i<ITER; i++) {
		twoZ = cDouble(z);

		C = cAdd(cMul(twoZ,C), cDouble(cMul(A,B)));	//2zC + 2AB
		B = cAdd(cMul(twoZ,B), cMul(A,A));			//2zB + A**2
		A = cAdd(cMul(twoZ,A), [1,0]);				//2zA + 1
		z = cAdd(cMul(z,z), reference);

		if (i>=2 && scale*normSquared(C)/normSquared(B) > 10**-6) {
			console.log(i);
			break;}
	}

	gl?.uniform2fv(locSeries, A.concat(B, C, z));
	gl?.uniform1i(locSkipped, i);
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

function pixelRealValue(x, scale) {
	const w = canvasWidth, h = canvasHeight;
	return (2*x - w) / h * scale;
}

function pixelImagValue(y, scale) {
	const h = canvasHeight;
	return (2*(h - y) - h) / h * scale;
}


main();
