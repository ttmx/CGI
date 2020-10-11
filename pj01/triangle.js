function resize(gl) {
	gl.canvas.width = window.innerWidth-16;
	gl.canvas.height = window.innerHeight-120;
	gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
}


window.addEventListener("load", () => {

	let gl;

	let waveProg;
	let glassProg;

	let numVert = window.innerWidth-16;
	let numGrid = 4;

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

	window.addEventListener("resize", () => {
		resize(gl);
	});

	let waveVertices = [];
	for (let i = 0; i < numVert; i++) {
		waveVertices.push(-1 + i * 2 / numVert, 1);
	}


	let glassVertices = [];
		glassVertices.push(0,-1);
		glassVertices.push(0,1);
		glassVertices.push(-1,0);
		glassVertices.push(1,0);
	for (let i = 0; i < numGrid; i++){
		glassVertices.push(i/numGrid,-1);
		glassVertices.push(i/numGrid,1);
		glassVertices.push(-i/numGrid,-1);
		glassVertices.push(-i/numGrid,1);
		glassVertices.push(-1,i/numGrid);
		glassVertices.push(1,i/numGrid);
		glassVertices.push(-1,-i/numGrid);
		glassVertices.push(1,-i/numGrid);
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
	waveProg = initShaders(gl, "vertex-shader", "fragment-shader");
	glassProg = initShaders(gl, "static-vert-shader", "fragment-shader");
	gl.useProgram(waveProg);

	// Load the data into the GPU
	let bufferId = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(waveVertices), gl.STATIC_DRAW);

	// Associate our shader variables with our data buffer
	let vPosition = gl.getAttribLocation(waveProg, "vPosition");
	gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);


	let vColor = gl.getUniformLocation(waveProg, "vColor");
	let glassColor = gl.getUniformLocation(glassProg, "vColor");
	let colorIndex = 1;
	gl.uniform4f(vColor, colors[colorIndex][0], colors[colorIndex][1], colors[colorIndex][2], colors[colorIndex][3]);
	gl.enableVertexAttribArray(vColor);


	let yScale = gl.getUniformLocation(waveProg, "yScale");
	gl.uniform1f(yScale, 0.5);

	let xScale = gl.getUniformLocation(waveProg, "xScale");
	gl.uniform1f(xScale, 1);

	timeVar = gl.getUniformLocation(waveProg, "time");
	gl.uniform1f(timeVar, 0);

	gl.useProgram(glassProg);

	let glassVertBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, glassVertBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(glassVertices), gl.STATIC_DRAW);

	colorIndex = 0;
	gl.uniform4f(glassColor, colors[colorIndex][0], colors[colorIndex][1], colors[colorIndex][2], colors[colorIndex][3]);

	gl.lineWidth(3);

	function render(time) {
		gl.clear(gl.COLOR_BUFFER_BIT);
		renderWave(time);
		renderGlass();
		window.requestAnimationFrame(render);
	}

	function renderGlass(){
		gl.useProgram(glassProg);
		gl.bindBuffer(gl.ARRAY_BUFFER, glassVertBuffer);
		gl.vertexAttribPointer(glassColor, 2, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.LINES, 0, numGrid*8 + 4);
	}

	function renderWave(time){
		gl.useProgram(waveProg);
		gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
		gl.vertexAttribPointer(glassColor, 2, gl.FLOAT, false, 0, 0);
		gl.uniform1f(timeVar, time * timeScale / 1000 / Math.PI);
		gl.drawArrays(gl.LINE_STRIP, 0, numVert);
	}

	function toggleWave(id) {
		switch (id) {
			case "sin":
				break;
		}
	}

	window.requestAnimationFrame(render);
});
