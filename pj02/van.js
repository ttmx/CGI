var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc;

var matrixStack = [];
var modelView;

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
function multTranslation(t) {
    modelView = mult(modelView, translate(t));
}
function multScale(s) {
    modelView = mult(modelView, scalem(s));
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
            cylinderDraw(gl, program);
            pushMatrix();
                sphereDraw(gl, program);
                pushMatrix();
                    cylinderDraw(gl, program);
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
                cylinderDraw(gl, program);
            popMatrix();
            pushMatrix();
                cylinderDraw(gl, program);
            popMatrix();
            pushMatrix();
                cylinderDraw(gl, program);
            popMatrix();
        }

        pushMatrix();
            drawAxle();
        popMatrix();
        pushMatrix();
            drawAxle();
        popMatrix();
    }

    pushMatrix();
        cubeDraw(gl, program);
    popMatrix();
    pushMatrix();
        drawAntenna();
    popMatrix();
    pushMatrix();
        drawChassis();
    popMatrix();
}

var VP_DISTANCE = 1;

function render(time) {
    requestAnimationFrame(render);
    resize(gl);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let projection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));

    modelView = lookAt([0,VP_DISTANCE,VP_DISTANCE], [0,0,0], [0,1,0]);

    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));

    drawVan();
}


