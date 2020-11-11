var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc;

var matrixStack = [];
var modelView;
var eye = [200,200,700];

// Stack related operations
function pushMatrix() {
    let m =  mat4(modelView[0], modelView[1],
        modelView[2], modelView[3]);
    matrixStack.push(m);
}
function popMatrix() {
    modelView = matrixStack.pop();
}
// Append transformations to modelView
function multMatrix(m) {
    modelView = mult(modelView, m);
}
function multTranslation(x, y, z) {
    modelView = mult(modelView, translate(x, y, z));
}
function multScale(x, y, z) {
    modelView = mult(modelView, scalem(x, y, z));
}
function multRotationX(angle) {
    modelView = mult(modelView, rotateX(angle));
}
function multRotationY(angle) {
    modelView = mult(modelView, rotateY(angle));
}
function multRotationZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
}

function resize(gl) {
    if (gl.canvas.width !== gl.canvas.clientWidth ||
        gl.canvas.height !== gl.canvas.clientHeight) {

        gl.canvas.width = gl.canvas.clientWidth;
        gl.canvas.height = gl.canvas.clientHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    aspect = gl.canvas.width / gl.canvas.height;
}

window.onload = function() {

    gl = WebGLUtils.setupWebGL(document.getElementById('gl-canvas'));
    resize(gl);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    program = initShaders(gl, 'default-vertex', 'default-fragment');

    gl.useProgram(program);
    sphereInit(gl);
    cylinderInit(gl);
    cubeInit(gl);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");

    sphereInit(gl);

    render();
}

function drawVan() {

    function drawAntenna() {
        pushMatrix();
            pushMatrix();
                multScale(20, 20, 50);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                cylinderDraw(gl, program);
            popMatrix();
            pushMatrix();
                multTranslation(0, 20, 0);
                pushMatrix()
                    multScale(30, 30, 30);
                    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                    sphereDraw(gl, program);
                popMatrix();
                pushMatrix();
                    pushMatrix();
                        multRotationZ(-45);
                        multTranslation(0, 20, 0);
                        multScale(20, 20, 50);
                        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                        cylinderDraw(gl, program);
                    popMatrix();
                    // pushMatrix();
                    //     plateDraw(gl, program);
                    // popMatrix();
                popMatrix();
            popMatrix();
        popMatrix();
    }

    function drawChassis() {

        function drawAxle() {
            pushMatrix();
                multTranslation(0, 0, 135);
                multRotationX(90);
                multScale(60, 30, 60);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                cylinderDraw(gl, program);
            popMatrix();
            pushMatrix();
                multRotationX(90);
                multScale(30, 270, 30);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                cylinderDraw(gl, program);
            popMatrix();
            pushMatrix();
                multTranslation(0, 0, -135);
                multRotationX(-90);
                multScale(60, 30, 60);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                cylinderDraw(gl, program);
            popMatrix();
        }

        pushMatrix();
            drawAxle();
        popMatrix();
        pushMatrix();
            multTranslation(300, 0, 0);
            drawAxle();
        popMatrix();
    }

    pushMatrix();
        multScale(512, 256, 256);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        cubeDraw(gl, program);
    popMatrix();
    pushMatrix();
        multTranslation(0, 128, 0);
        gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
        drawAntenna();
    popMatrix();
    pushMatrix();
        multTranslation(-150, -115, 0);
        drawChassis();
    popMatrix();
}

var VP_DISTANCE = 700;

function render(time) {
    requestAnimationFrame(render);
    resize(gl);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let projection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    modelView = lookAt(eye, [0,0,0], [0,1,0]);

    drawVan();
}


window.onkeydown = (key) => {
    switch (key.key) {
        case 'w':
            break;
        case 'a':
            break;
        case 's':
            break;
        case 'd':
            break;
        case 'i':
            break;
        case 'k':
            break;
        case 'j':
            break;
        case 'l':
            break;
        case '0':
            eye = [200,200, 700];
            break;
        case '1':
            eye = [0,VP_DISTANCE,1];
            break;
        case '2':
            eye = [0,0,VP_DISTANCE];
            break;
        case '3':
            eye = [VP_DISTANCE,0,0];
            break;
    }
}

