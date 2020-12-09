var gl;
var program;

var aspect;

var projection, modelView;
var mProjectionLoc, mModelViewLoc;

var objectToDraw;
var scale = 1; //TODO
let settings = {};
var needToRender = true;

// I just realised I don't seem to have filled mode working on the paraboloid, but gonna stop for today

function updateProjectionMatrix(projectionName) {
    switch (projectionName) {
        case "Orthogonal":
        case "Axonometric":
            if (aspect >= 1) {
                projection = ortho(-scale * aspect, scale * aspect, -scale, scale, -10, 10);
            } else {
                projection = ortho(-scale, scale, -scale / aspect, scale / aspect, -10, 10);
            }
            break;
        case "Perspective":
            projection = perspective(settings.perspective.fov, aspect, 0.5, 20);
            break;
    }
    updateViewMatrix();
}

function updateViewMatrix() {
    needToRender = true;
    let eye;
    let at = [0, 0, 0];
    let up = [0, 1, 0];
    switch (settings.general.projection) {
        case "Axonometric":
            let rotationMatrix = mult(rotateY(-settings.axo.theta), rotateX(-settings.axo.gamma));
            eye = mult(rotationMatrix, [0, 0, 1, 0]);
            up = mult(rotationMatrix, [0, 1, 0, 0]);
            eye.pop();
            up.pop();
            break;
        case "Orthogonal":
            switch (settings.orth.view) {
                case "topView":
                    eye = [0, 1, 0];
                    up = [0, 0, -1];
                    break;
                case "frontFacade":
                    eye = [0, 0, 1];
                    break;
                case "rightFacade":
                    eye = [1, 0, 0];
                    break;
            }
            break;
        case "Perspective":
            eye = [0, 0, settings.perspective.d];
            break;
        default:
            console.log("You picked " + settings.general.projection + " wrong bro");
            break;
    }
    modelView = lookAt(eye, at, up);
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

    settings.general.projection = projectionName;
    updateProjectionMatrix(settings.general.projection);
}

function resize(gl) {
    if (gl.canvas.width !== gl.canvas.clientWidth ||
        gl.canvas.height !== gl.canvas.clientHeight) {

        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;
        return true;
    }
    return false;
}

window.onload = function () {

    for (const tabLink of document.getElementsByClassName("tabLink")) {
        tabLink.onclick = (e) => openProjection(e, tabLink.textContent);
    }

    for (const objectRadio of document.getElementsByName("objects")) {
        objectRadio.onclick = (e) => {
            objectToDraw = e.currentTarget.value;
            needToRender = true;
        }
    }

    for (const orthogonalRadio of document.getElementsByName("orthogonalRadio")) {
        orthogonalRadio.onclick = (e) => {
            settings.orth.view = e.currentTarget.value;
            updateViewMatrix();
        }
    }

    for (const axonometricRadio of document.getElementsByName("axonometricRadio")) {
        axonometricRadio.onclick = (e) => {
            if (e.currentTarget.value === "freeform") {
                document.getElementById("gamma").disabled = false;
                document.getElementById("theta").disabled = false;
            } else {
                document.getElementById("gamma").disabled = true;
                document.getElementById("theta").disabled = true;
            }

            function updateAxonometricAngles(gamma, theta) {
                document.getElementById("gamma").value = gamma;
                document.getElementById("theta").value = theta;
                settings.axo.gamma = gamma;
                settings.axo.theta = theta;
            }

            function toDecimalDegrees(degrees, minutes) {
                return degrees + minutes * (1 / 60);
            }

            function toDegrees(radians) {
                return radians * (180 / Math.PI);
            }

            function toTheta(a, b) {
                return toDegrees(Math.atan(Math.sqrt(Math.tan(radians(a)) / Math.tan(radians(b)))) + Math.PI / 2);
            }

            function toGamma(a, b) {
                return toDegrees(Math.asin(Math.sqrt(Math.tan(radians(a)) * Math.tan(radians(b)))));
            }

            switch (e.currentTarget.value) {
                case "trimetric":
                    let a = toDecimalDegrees(54, 16);
                    let b = toDecimalDegrees(23, 16);
                    updateAxonometricAngles(toGamma(a, b), toTheta(a, b));
                    break;
                case "dimetric":
                    updateAxonometricAngles(toGamma(42, 7), toTheta(42, 7));
                    break;
                case "isometric":
                    updateAxonometricAngles(toGamma(30, 30), toTheta(30, 30));
                    break;
            }
            updateViewMatrix();
        }
    }

    for (const axonometricSlider of document.getElementsByClassName("axonometricSlider")) {
        axonometricSlider.oninput = (e) => {
            settings.axo[axonometricSlider.id] = e.currentTarget.value;
            updateViewMatrix();
        }
    }

    for (const perspectiveSlider of document.getElementsByClassName("perspectiveSlider")) {
        perspectiveSlider.oninput = (e) => {
            settings.perspective[perspectiveSlider.id] = e.currentTarget.value;
            updateProjectionMatrix(settings.general.projection);
        }
    }

    settings.axo = {
        'gamma': 50,
        'theta': 50
    }

    settings.orth = {}

    settings.perspective = {
        'fov': 70,
        'd': 1.5
    }

    settings.general = {
        'projection': "Axonometric",
        'zbuffer': false,
        'culling': false,
        'filled': false
    }

    document.getElementById("axonometricButton").click();
    document.getElementById("cube").click();
    document.getElementById("frontFacade").click();
    document.getElementById("dimetric").click();

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    resize(gl);
    aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    updateProjectionMatrix(settings.general.projection);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);
    sphereInit(gl);
    cylinderInit(gl);
    cubeInit(gl);
    paraboloidInit(gl);
    torusInit(gl, 10);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
	vEyeLoc = gl.getUniformLocation(program,"viewPos");

    checkRender();
}

function checkRender() {
    if (resize(gl)) {
        needToRender = true;
        aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        updateProjectionMatrix(settings.general.projection);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    if (needToRender) {
        needToRender = false;
        render();
    }
    requestAnimationFrame(checkRender);
}

function render() {

    function drawObject(objectToDraw) {
        switch (objectToDraw) {
            case "sphere":
                sphereDraw(gl, program, settings.general.filled);
                break;
            case "cube":
                cubeDraw(gl, program, settings.general.filled);
                break;
            case "torus":
                torusDraw(gl, program, settings.general.filled);
                break;
            case "cylinder":
                cylinderDraw(gl, program, settings.general.filled);
                break;
            case "paraboloid":
                paraboloidDraw(gl, program, settings.general.filled);
                break;
        }
    }

    if (settings.general.zbuffer) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    if (settings.general.culling) {
        gl.cullFace(gl.BACK);
    }

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
	// gl.uniformVec3fv(vEyeLoc,false,eye); TODO talk about approach to lighting

    drawObject(objectToDraw);
}

window.onkeydown = (e) => {
    needToRender = true;
    switch (e.key.toLowerCase()) {
        case 'w':
            //Wireframe
            settings.general.filled = false;
            break;
        case 'f':
            //Filled
            settings.general.filled = true;
            break;
        case 'z':
            //z-buffer
            if (settings.general.zbuffer) {
                gl.disable(gl.DEPTH_TEST);
                document.getElementById("zBufferStatus").textContent = "Off";
            } else {
                gl.enable(gl.DEPTH_TEST);
                document.getElementById("zBufferStatus").textContent = "On";
            }
            settings.general.zbuffer = !settings.general.zbuffer;
            break;
        case 'b':
            //culling
            if (settings.general.culling) {
                gl.disable(gl.CULL_FACE);
                document.getElementById("cullingStatus").textContent = "Off";
            } else {
                gl.enable(gl.CULL_FACE);
                document.getElementById("cullingStatus").textContent = "On";
            }
            settings.general.culling = !settings.general.culling;
            break;
    }
}
