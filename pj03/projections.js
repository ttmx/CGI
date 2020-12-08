var gl;
var program;

var aspect;

var projection, modelView;
var mProjectionLoc, mModelViewLoc;

var objectToDraw;
var scale = 1; //TODO
let settings = {};

// I just realised I don't seem to have filled mode working on the paraboloid, but gonna stop for today

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
            if (aspect >= 1) {
                return ortho(-scale * aspect, scale * aspect, -scale, scale, -10, 10);
            } else {
                return ortho(-scale, scale, -scale / aspect, scale / aspect, -10, 10);
            }
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
    settings.general.projection = projectionName;

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

window.onload = function () {

    for (const tabLink of document.getElementsByClassName("tabLink")) {
        tabLink.onclick = (e) => openProjection(e, tabLink.textContent);
    }

    for (const objectRadio of document.getElementsByName("objects")) {
        objectRadio.onclick = (e) => objectToDraw = e.currentTarget.value;
    }

    for (const orthRadio of document.getElementsByName("orthogonalRadio")) {
        orthRadio.onclick = (e) => settings.orth.view = e.currentTarget.value;
    }

    for (const axoRadio of document.getElementsByName("axonometricRadio")) {
        axoRadio.onclick = (e) => {
            settings.axo.view = e.currentTarget.value;
            if (settings.axo.view === "freeform") {
                document.getElementById("gamma").disabled = false;
                document.getElementById("theta").disabled = false;
            } else {
                document.getElementById("gamma").disabled = true;
                document.getElementById("theta").disabled = true;
            }

            function changeTheGama(g, t) {
                document.getElementById("gamma").value = g;
                document.getElementById("theta").value = t;
                settings.axo.gamma = g;
                settings.axo.theta = t;
            }

            switch (e.currentTarget.value) {
                //Duvido muito seriamente que seja assim que queremos
                //mas good enough for UI poc TODO
                //also pretty sure A/B isnt the same as gama/theta mas nao indo as aulas nao sei converter um valor no outro, woops
                case "trimetric":
                    changeTheGama(54.16, 23.16);
                    break;
                case "dimetric":
                    changeTheGama(42, 7);
                    break;
                case "isometric":
                    changeTheGama(30, 30);
                    break;
            }
        }
    }

    settings.axo = {
        'gamma': 50,
        'theta': 50
    }

    settings.orth = {}

    settings.general = {
        'projection': "axonometric",
        'zbuffer': false,
        'culling': false,
        'filled': false
    }


    document.getElementById("gamma").onclick = (e) => settings.axo.gamma = e.currentTarget.value;
    document.getElementById("theta").onclick = (e) => settings.axo.theta = e.currentTarget.value;

    document.getElementById("axonometricButton").click();
    document.getElementById("cube").click();
    document.getElementById("frontFacade").click();
    document.getElementById("dimetric").click();

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
    torusInit(gl, 10);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    render();
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

    function selectedView() {
        let eye;
        let at = [0, 0, 0];
        let up = [0, 1, 0];
        switch (settings.general.projection) {
            case "Axonometric":
                eye = [200, 200, 700];
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
                break;
            default:
                console.log("You picked " + settings.general.projection + " wrong bro");
                break;
        }
        return lookAt(eye, at, up);
    }

    requestAnimationFrame(render);

    resize(gl);

    if (settings.general.zbuffer) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    modelView = selectedView(); //TODO temporary
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));

    drawObject(objectToDraw);
}

window.onkeydown = (e) => {
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
            settings.general.zbuffer = !settings.general.zbuffer;
            break;
        case 'b':
            //culling
            settings.general.culling = !settings.general.culling;
            break;
    }
}
