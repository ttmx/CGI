let gl;

let triProg;

let numTri = 500;

window.onload = function init() {
    let canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

    // Three vertices
    let trivertices = [];
	for (let i = 0; i< numTri; i++){
		let initV = [Math.random() * 2 - 1,Math.random()*2 - 1];
		trivertices.push(vec2(initV[0],initV[1]));
		trivertices.push(vec2(initV[0]+(Math.random()-0.5)/10,
			initV[1]+(Math.random()-0.5)/10));
		trivertices.push(vec2(initV[0]+(Math.random()-0.5)/10,
			initV[1]+(Math.random()-0.5)/10));
	}

	let colors = [
		vec4(0.470588235,909803922.0,0.552941176,1.0),
		vec4(0.509803922,0.666666667,1.0,1.0),
		vec4(0.941176471,0.443137255,0.470588235,1.0)
	];
	let array = Array(numTri);
	colors = [].concat.apply([],array.fill(colors));
	console.log(flatten(colors));

    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
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
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

	let vColor = gl.getAttribLocation(triProg, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);


    render();
}

function render(time) {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numTri*3);
	window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);
