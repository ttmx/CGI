var gl;
var program;

var aspect;

var projection, modelView, normals;
var mProjectionLoc, mModelViewLoc, mNormalsLoc;
var mLightingLoc, mPerspectiveProjectionLoc;

var objectToDraw;
var zoomScale = 1;
let settings = {};
let uniforms = {};
var needToRender = true;
var dragging = false;

function updateProjectionMatrix(projectionName) {
    switch (projectionName) {
        case "Orthogonal":
        case "Axonometric":
            if (aspect >= 1) {
                projection = ortho(-zoomScale * aspect, zoomScale * aspect, -zoomScale, zoomScale, -10, 10);
            } else {
                projection = ortho(-zoomScale, zoomScale, -zoomScale / aspect, zoomScale / aspect, -10, 10);
            }
            break;
        case "Perspective":
            let fovy = 2 * Math.atan(zoomScale / settings.perspective.d) * 180 / Math.PI;
            projection = perspective(fovy, aspect, 0.1, zoomScale * 20);
            break;
    }
    updateViewMatrix();
}

function updateViewMatrix() {
    needToRender = true;
    let eye;
    let at = [0, 0, 0];
    let up = [0, 1, 0];
    let rotationMatrix;
    switch (settings.general.projection) {
        case "Axonometric":
            rotationMatrix = mult(rotateY(-settings.axo.theta), rotateX(-settings.axo.gamma));
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
            rotationMatrix = mult(rotate(-settings.perspective.rot.x, settings.perspective.up),
                rotate(-settings.perspective.rot.y, cross(settings.perspective.up, settings.perspective.eye)));

            settings.perspective.rot.x = 0;
            settings.perspective.rot.y = 0;

            eye = scale(settings.perspective.d, normalize(settings.perspective.eye));
            up = normalize(settings.perspective.up);
            eye[3] = 0;
            up[3] = 0;
            eye = mult(rotationMatrix, eye);
            up = mult(rotationMatrix, up);
            eye.pop();
            up.pop();
            settings.perspective.eye = eye;
            settings.perspective.up = up;
            break;
        default:
            console.log("You picked " + settings.general.projection + " wrong bro");
            break;
    }
    modelView = lookAt(eye, at, up);
    normals = normalMatrix(modelView);
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

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));

    settings.axo = {
        gamma: 50,
        theta: 50
    }

    settings.orth = {};

    settings.perspective = {
        d: 1.5,
        eye: [0, 0, 1],
        up: [0, 1, 0],
        rot: {
            x: 0,
            y: 0
        }
    }

    settings.general = {
        projection: "Axonometric",
        zBuffer: false,
        culling: false,
        filled: false,
        lighting: false
    }

    settings.lighting = {
        Pos: [],
        lightAmbColor: [],
        lightDifColor: [],
        lightSpeColor: [],
        shininess: null,
        Ka: null,
        Kd: null,
        Ks: null
    };

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
                return toDegrees(Math.atan(Math.sqrt(Math.tan(radians(a)) / Math.tan(radians(b)))) - Math.PI / 2);
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

    for (const materialSetting of ["Amb", "Dif", "Spe", "Shininess"]) {
        let lightSlider = document.getElementById("material".concat(materialSetting, "Slider"));
        lightSlider.oninput = (e) => {
            needToRender = true;
            settings.lighting[lightSlider.name] = e.currentTarget.value;
        }
        lightSlider.dispatchEvent(new Event('input'));
    }

    for (const lightSlider of document.getElementsByClassName("lightPosSlider")) {
        function toIndex(char) {
            switch (char.toLowerCase()) {
                case "x":
                    return 0;
                case "y":
                    return 1;
                case "z":
                    return 2;
            }
        }

        lightSlider.oninput = (e) => {
            needToRender = true;
            settings.lighting.Pos[toIndex(lightSlider.id.slice(-1))] = e.currentTarget.value;
        }
        lightSlider.dispatchEvent(new Event('input'));
    }

    for (const lightColor of document.getElementsByClassName("lightColor")) {
        lightColor.oninput = (ev) => {
            needToRender = true;
            // #XXXXXX -> ["XX", "XX", "XX"]
            let color = ev.currentTarget.value.match(/[A-Za-z0-9]{2}/g);
            // ["XX", "XX", "XX"] -> [n, n, n]
            color = color.map(v => {
                return parseInt(v, 16) / 256;
            });
            settings.lighting[lightColor.id] = color;
        }
        lightColor.dispatchEvent(new Event('input'));
    }

    document.getElementById("lightType").onchange = (ev => {
        needToRender = true;
        switch (ev.currentTarget.value) {
            case "point":
                settings.lighting.Pos[3] = 1.0;
                break;
            case "directional":
                settings.lighting.Pos[3] = 0.0;
                break;
        }

    });
    document.getElementById("lightType").dispatchEvent(new Event('change'));

    document.getElementById("lighting").onclick = (ev => {
        needToRender = true;
        settings.general.lighting = ev.currentTarget.checked;
        if (settings.general.lighting) {
            document.getElementById("lightingControls").style.display = "block";
        } else {
            document.getElementById("lightingControls").style.display = "none";
        }
    });

    gl.canvas.requestPointerLock = gl.canvas.requestPointerLock || gl.canvas.mozRequestPointerLock;
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

    document.addEventListener('pointerlockchange', lockChange, false);
    document.addEventListener('mozpointerlockchange', lockChange, false);

    function updateDrag(e) {
        settings.perspective.rot.x = e.movementX * 0.3;
        settings.perspective.rot.y = e.movementY * 0.3;
        updateViewMatrix();
    }

    function lockChange() {
        if (document.pointerLockElement === gl.canvas ||
            document.mozPointerLockElement === gl.canvas) {
            document.addEventListener("mousemove", updateDrag, false);
        } else {
            document.removeEventListener("mousemove", updateDrag, false);
        }
    }

    gl.canvas.onwheel = (e) => {
        zoomScale += e.deltaY * 0.01;
        if (zoomScale < 0) zoomScale = 0;
        updateProjectionMatrix(settings.general.projection);
    }

    gl.canvas.onmousedown = (e) => {
        if (settings.general.projection === "Perspective") {
            gl.canvas.requestPointerLock();
            settings.perspective.rot.x = 0;
            settings.perspective.rot.y = 0;
        }
    }

    gl.canvas.onmouseup = (e) => {
        document.exitPointerLock();
        settings.perspective.rot.x = 0;
        settings.perspective.rot.y = 0;
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
    mNormalsLoc = gl.getUniformLocation(program, "mNormals");
    mLightingLoc = gl.getUniformLocation(program, "lighting");
    mPerspectiveProjectionLoc = gl.getUniformLocation(program, "perspectiveProjection");

    uniforms = {
        lighting: {
            Pos: {
                loc: gl.getUniformLocation(program, "lightPosition"),
                setter: function (value) {
                    gl.uniform4fv(this.loc, new Float32Array(value))
                }
            },
            lightAmbColor: {
                loc: gl.getUniformLocation(program, "lightAmb"),
                setter: function (value) {
                    gl.uniform3fv(this.loc, new Float32Array(value))
                }
            },
            lightDifColor: {
                loc: gl.getUniformLocation(program, "lightDif"),
                setter: function (value) {
                    gl.uniform3fv(this.loc, new Float32Array(value))
                }
            },
            lightSpeColor: {
                loc: gl.getUniformLocation(program, "lightSpe"),
                setter: function (value) {
                    gl.uniform3fv(this.loc, new Float32Array(value))
                }
            },
            shininess: {
                loc: gl.getUniformLocation(program, "shininess"),
                setter: function (value) {
                    gl.uniform1f(this.loc, value)
                }
            },
            Ka: {
                loc: gl.getUniformLocation(program, "Ka"),
                setter: function (value) {
                    gl.uniform1f(this.loc, value)
                }
            },
            Kd: {
                loc: gl.getUniformLocation(program, "Kd"),
                setter: function (value) {
                    gl.uniform1f(this.loc, value)
                }
            },
            Ks: {
                loc: gl.getUniformLocation(program, "Ks"),
                setter: function (value) {
                    gl.uniform1f(this.loc, value)
                }
            }
        }
    }

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

    if (settings.general.zBuffer) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else {
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
    if (settings.general.culling) {
        gl.cullFace(gl.BACK);
    }

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));
    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
    gl.uniformMatrix4fv(mNormalsLoc, false, flatten(normals));
    gl.uniform1i(mLightingLoc, settings.general.lighting);
    if (settings.general.lighting) {
        gl.uniform1i(mPerspectiveProjectionLoc, settings.general.projection === "Perspective");
        for (const uniformName in uniforms.lighting) {
            const uniform = uniforms.lighting[uniformName];
            uniform.setter(settings.lighting[uniformName]);
        }
    }

    drawObject(objectToDraw);
}

window.onkeydown = (e) => {
    needToRender = true;
    switch (e.key.toLowerCase()) {
        case 'w':
            //Wireframe
            settings.general.filled = false;
            break;
        case 'l':
            document.getElementById("lighting").click();
            break;
        case 'f':
            //Filled
            settings.general.filled = true;
            break;
        case 'z':
            //z-buffer
            if (settings.general.zBuffer) {
                gl.disable(gl.DEPTH_TEST);
                document.getElementById("zBufferStatus").textContent = "Off";
            } else {
                gl.enable(gl.DEPTH_TEST);
                document.getElementById("zBufferStatus").textContent = "On";
            }
            settings.general.zBuffer = !settings.general.zBuffer;
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
