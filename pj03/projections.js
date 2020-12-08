var gl;
var program;

var aspect;

var projection, modelView;
var mProjectionLoc, mModelViewLoc;

var zBuffer, culling;
var filled;
var objectToDraw;
var scale = 1; //TODO

var eye = [200,200,700]; //TODO

function projectionMatrix(projectionName) {
    if (projectionName === undefined) {
        for (const tabLink of document.getElementsByClassName("tabLink")) {
            if (tabLink.className.includes(" active")) {
                projectionName = tabLink.textContent;
                break;
            }
        }
    }
    switch (projectionName) {
        case "Orthogonal":
            return ortho(-scale*aspect,scale*aspect, -scale, scale,-10,10);
        case "Axonometric":
            return; //TODO
        case "Perspective":
            return; //TODO
    }
}

function openProjection(evt, projectionName) {

    // Get all elements with class="tabContent" and hide them
    for (const tabContent of document.getElementsByClassName("tabContent")) {
        tabContent.style.display = "none";
    }

    // Get all elements with class="tabLink" and remove the class "active"
    for (const tabLink of document.getElementsByClassName("tabLink")) {
        tabLink.className = tabLink.className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(projectionName).style.display = "block";
    evt.currentTarget.className += " active";

    projection = projectionMatrix(projectionName);
}

function resize(gl) {
    if (gl.canvas.width !== gl.canvas.clientWidth ||
        gl.canvas.height !== gl.canvas.clientHeight) {

        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;
        aspect = gl.canvas.width / gl.canvas.height;
        projection = projectionMatrix();
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
}

window.onload = function() {

    for (const tabLink of document.getElementsByClassName("tabLink")) {
        tabLink.onclick = (e) => openProjection(e, tabLink.textContent);
    }

    for (const objectRadio of document.getElementsByName("objects")) {
        objectRadio.onclick = (e) => objectToDraw = e.currentTarget.value;
    }

    document.getElementById("axonometricButton").click();
    document.getElementById("cube").click();
    document.getElementById("frontFacade").click();
    document.getElementById("dimetric").click();

    zBuffer = culling = false;
    filled = false;

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    resize(gl);
    aspect = gl.canvas.width / gl.canvas.height;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);
    sphereInit(gl);
    cylinderInit(gl);
    cubeInit(gl);
	paraboloidInit(gl);
	torusInit(gl,10);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    render();
}

function render() {

    function drawObject(objectToDraw) {
        switch (objectToDraw) {
            case "sphere":
                sphereDraw(gl, program, filled);
                break;
            case "cube":
                cubeDraw(gl, program, filled);
                break;
            case "torus":
                torusDraw(gl, program, filled);
                break;
            case "cylinder":
                cylinderDraw(gl, program, filled);
                break;
            case "paraboloid":
                paraboloidDraw(gl, program, filled);
                break;
        }
    }

    function selectedView() {
        //TODO
        // switch (radio option) {
        //      // return lookAt(eye, [0,0,0], [0,1,0]);
        // }
        return undefined;
    }

    requestAnimationFrame(render);

    resize(gl);

    if (zBuffer) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    modelView = mat4(); //TODO tempoprary
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));

    drawObject(objectToDraw);
}

window.onkeydown = (e) => {
    switch (e.key.toLowerCase()) {
        case 'w':
            //Wireframe
            break;
        case 'f':
            //Filled
            break;
        case 'z':
			//z-buffer
            break;
        case 'b':
			//culling
            break;
    }
}
