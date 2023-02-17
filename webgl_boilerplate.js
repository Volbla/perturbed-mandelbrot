const vsSource = await fetch("sVertex.glsl").then(response => response.text());
const fsSource = await fetch("sFragment.glsl").then(response => response.text());


export function makeProgram(gl) {
	const program = gl.createProgram();

	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);
	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
		return null;
	}

	gl.useProgram(program);
	return program;
}


function loadShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}


export function makeVertexBuffer(gl, floatArray, glLocation, drawMethod, divisor){
	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, floatArray, drawMethod);
	gl.vertexAttribPointer(glLocation, 2, gl.FLOAT, false, 0, 0);
	gl.vertexAttribDivisor(glLocation, divisor);
	gl.enableVertexAttribArray(glLocation);

	return buffer;
}
