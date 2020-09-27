let gl;

let triProg;

let numTri = 500;

window.onload = function init() {
    let canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    // Three vertices
    let trivertices = [
    ];
	for (let i = 0; i< numTri; i++){
		let initV = [Math.random() * 2 - 1,Math.random()*2 - 1];
		trivertices.push(vec2(initV[0],initV[1]));
		trivertices.push(vec2(initV[0]+(Math.random()-0.5)/10,
			initV[1]+(Math.random()-0.5)/10));
		trivertices.push(vec2(initV[0]+(Math.random()-0.5)/10,
			initV[1]+(Math.random()-0.5)/10));
	}


    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.160784, 0.176471, 0.243137, 1.0);

    // Load shaders and initialize attribute buffers
    triProg = initShaders(gl, "vertex-shader", "fragment-shader");

    // Load the data into the GPU
    let bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(trivertices), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    let vPosition = gl.getAttribLocation(triProg, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    render();
}

function render(time) {
    gl.useProgram(triProg);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, numTri*6);
	window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);
