var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc;

var modelView;
var eye = [200,200,700];

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
}

function resize(gl) {
    if (gl.canvas.width !== gl.canvas.clientWidth ||
        gl.canvas.height !== gl.canvas.clientHeight) {

        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;
        aspect = gl.canvas.width / gl.canvas.height;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
}

window.onload = function() {

    for (const tabLink of document.getElementsByClassName("tabLink")) {
        tabLink.onclick = (e) => openProjection(e, tabLink.textContent);
    }

    document.getElementById("axonometricButton").click();

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
    requestAnimationFrame(render);

    resize(gl);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //
    // let projection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,30*VP_DISTANCE);
    //
    // gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));
    //
    // modelView = lookAt(eye, [0,0,0], [0,1,0]);

    //drawObject();
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
