function resize(gl) {
	// Lookup the size the browser is displaying the canvas in CSS pixels
	// and compute a size needed to make our drawingbuffer match it in
	// device pixels.
	gl.canvas.width = window.innerWidth-16;
	gl.canvas.height = window.innerHeight-120;
	gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
}


window.addEventListener("load", () => {

	let gl;

	let triProg;

	let numVert = 1000;

	let timeScale = 1;

	let timeVar;


	let canvas = document.getElementById("gl-canvas");
	gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {alert("WebGL isn't available");}
	resize(gl);

	let buttons = document.getElementsByClassName("option");

	for (b of buttons) {
		b.addEventListener("click", (elem) => {
			elem.target.classList.toggle("active");
			toggleWave(elem.target.dataset.opt);
		});
	}

	console.log(gl);
	window.addEventListener("resize", () => {
		resize(gl);
	});

	// Three vertices
	let trivertices = [];
	for (let i = 0; i < numVert; i++) {
		trivertices.push(-1 + i * 2 / numVert, 1);
	}

	let colors = [
		vec4(0.470588235, 909803922.0, 0.552941176, 1.0),
		vec4(0.509803922, 0.666666667, 1.0, 1.0),
		vec4(0.941176471, 0.443137255, 0.470588235, 1.0)
	];

	// Configure WebGL
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.clearColor(0.160784, 0.176471, 0.243137, 1.0);

	// Load shaders and initialize attribute buffers
	triProg = initShaders(gl, "vertex-shader", "fragment-shader");
	gl.useProgram(triProg);

	// Load the data into the GPU
	let bufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(trivertices), gl.STATIC_DRAW);

	// Associate our shader variables with our data buffer
	let vPosition = gl.getAttribLocation(triProg, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	let colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, colors[0], gl.STATIC_DRAW);

	let vColor = gl.getUniformLocation(triProg, "vColor");
	const colorIndex = 1;
	gl.uniform4f(vColor, colors[colorIndex][0], colors[colorIndex][1], colors[colorIndex][2], colors[colorIndex][3]);
	gl.enableVertexAttribArray(vColor);
	let yScale = gl.getUniformLocation(triProg, "yScale");
	gl.uniform1f(yScale, 0.5);
	let xScale = gl.getUniformLocation(triProg, "xScale");
	gl.uniform1f(xScale, 1);
	timeVar = gl.getUniformLocation(triProg, "time");
	gl.uniform1f(timeVar, 0);

	gl.lineWidth(3)
	render();


	// function resize(){
	//     let canvas = document.getElementById("gl-canvas");
	// 	numVert = window.innerWidth;
	// 	canvas.width = window.innerWidth-16;
	// 	canvas.height = window.innerHeight-120;
	// 	gl.resizeCanvasToDisplaySize(canvas);
	// }




	function render(time) {
		gl.uniform1f(timeVar, time * timeScale / 1000 / Math.PI);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.LINE_STRIP, 0, numVert);
		window.requestAnimationFrame(render);
	}

	function toggleWave(id) {
		switch (id) {
			case "sin":
				break;
		}
	}

	window.requestAnimationFrame(render);
});
