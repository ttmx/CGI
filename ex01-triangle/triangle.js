var gl;
var timeGl;

var insideProg;
var borderProg;

var currRotation = [0,1];
var rotationVec;

window.onload = function init() {
    var canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }

    // Three vertices
    var trivertices = [
        vec2(-0.5,-0.5),
        vec2(0.5,-0.5),
        vec2(0,0.433013)
    ];
    var qverts = [
        vec2(-0.5,-0.5),
        vec2(0.5,-0.5),
        vec2(0.5,-0.5),
        vec2(0.5,0.5),
        vec2(0.5,0.5),
        vec2(-0.5,0.5),
	    vec2(-0.5,0.5),
        vec2(-0.5,-0.5),
    ];

    var qvert0 = [
        vec2(-0.5,-0.5),
        vec2(0.5,-0.5),
        vec2(0.5,0.5),
        vec2(-0.5,0.5),
        vec2(-0.5,-0.5),
        vec2(0.5,0.5),
    ];

    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.160784, 0.176471, 0.243137, 1.0);

    // Load shaders and initialize attribute buffers
    insideProg = initShaders(gl, "vertex-shader", "fragment-shader");
    verticeProg = initShaders(gl, "vertex-shader", "border-shader");

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(qvert0), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(insideProg, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);

    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    timeGl = [gl.getUniformLocation(insideProg, "time"),
		gl.getUniformLocation(verticeProg,"time")];

	uRotationVector = [gl.getUniformLocation(insideProg, "uRotationVec"),
		gl.getUniformLocation(verticeProg, "uRotationVec")]
	gl.lineWidth(4);
    render();
}

function render(time) {
	let rot = time/1000*Math.PI;
	currRotation = [Math.sin(rot),Math.cos(rot)];
    gl.useProgram(insideProg);
	gl.uniform2fv(uRotationVector[0], currRotation);
	gl.uniform1f(timeGl[0], time);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.useProgram(verticeProg);
	gl.uniform2fv(uRotationVector[1], currRotation);
	gl.uniform1f(timeGl[1], time);
    gl.drawArrays(gl.LINE_LOOP, 0, 4);
	window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);
