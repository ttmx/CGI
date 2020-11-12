var gl;
var program;

var aspect;

var mProjectionLoc, mModelViewLoc;
var fColorLoc, fSolidColorLoc;

var matrixStack = [];
var modelView;
var eye = [200,200,700];


// Overengineered physics constants
const FRONT_AREA = 1.5*1.5; // m²
const DRAG_COEF = 0.51; // number
const AIR_DENSITY = 1.2041; // Kg/m³
const WHEEL_DIAMETER = 100/3*2; // cm
const WEIGHT = 3000; // kg
const GRAVITY = 9.8; // m/s²
const ROLLING_RESISTANCE = 0.01; // Newton
const WHEEL_BASE = 270;

var torque = 0; // Newtons*meter
var rotation = 0; // angle
var rps = 0; //rotations per second
var actualSpeed = 0; // m/s
var vanPosition = [0, 0]; // m

var wheelAngle = 0; //degrees
var antennaRotation = -60; //degrees
var antennaPivot = -60; //degrees

var solidColor = true;
var turningRadius = 0; //m
var VP_DISTANCE = 700;
var vanYaw = 0; // degrees

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


// Physics
//Newtons
function drag(){
	return -1*FRONT_AREA * DRAG_COEF * actualSpeed * Math.abs(actualSpeed) * AIR_DENSITY/2;
}

//Newtons
function rollingResistance(){
	return WEIGHT * GRAVITY * ROLLING_RESISTANCE*Math.abs(actualSpeed)/(actualSpeed!== 0)? actualSpeed :1;
}

//Newtons
function traction(){
	return torque/(WHEEL_DIAMETER/100/2);
}

//Newtons
function engineForce(){
	return traction() + drag() - rollingResistance();
}


//m/s²
function accel(){
	return engineForce()/WEIGHT;
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
	paraboloidInit(gl);
	torusInit(gl);

	gl.enable(gl.DEPTH_TEST);

    mModelViewLoc = gl.getUniformLocation(program, "mModelView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    fColorLoc = gl.getUniformLocation(program, "fColor");
    fSolidColorLoc = gl.getUniformLocation(program, "fSolidColor");

    sphereInit(gl);

    render();
}

function drawVan() {

    function drawAntenna() {
        pushMatrix();
            multRotationY(antennaRotation);
            pushMatrix();
                multScale(20, 50, 20);
                gl.uniform4fv(fColorLoc, [1.0, 1.0, 0.0, 1.0]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                cylinderDraw(gl, program);
            popMatrix();
            pushMatrix();
                multTranslation(0, 20, 0);
                pushMatrix()
                    multScale(30, 30, 30);
                    gl.uniform4fv(fColorLoc, [0.75, 0.0, 1.0, 1.0]);
                    gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                    sphereDraw(gl, program);
                popMatrix();
                pushMatrix();
                    multRotationZ(antennaPivot);
                    pushMatrix();
                        multTranslation(0, 50, 0);
						multScale(20, 100, 20);
                        gl.uniform4fv(fColorLoc, [1.0, 1.0, 1.0, 1.0]);
						gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
						cylinderDraw(gl, program);
						pushMatrix();
							multTranslation(-1,0.4,0);
							multScale(1/20*80, 1/100*20, 1/20*20);
							multRotationZ(90);
                            gl.uniform4fv(fColorLoc, [1.0, 0.5, 0.0, 1.0]);
							gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
							cylinderDraw(gl, program);
						popMatrix();
						pushMatrix();
							multRotationZ(90);
							multTranslation(0.4,3,0);
							multScale(3/4*2, 4/5, 4*2);
                            gl.uniform4fv(fColorLoc, [0.0, 0.0, 1.0, 1.0]);
							gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
							paraboloidDraw(gl, program);
						popMatrix();
                    popMatrix();
                popMatrix();
            popMatrix();
        popMatrix();
    }

    function drawChassis() {

        function drawAxle(wheelAngle) {
            pushMatrix();
                multTranslation(0, 0, WHEEL_BASE/2);
                multRotationY(wheelAngle);
                multRotationX(90);
                multRotationY(-rotation);
                multScale(WHEEL_DIAMETER, 80, WHEEL_DIAMETER);
                gl.uniform4fv(fColorLoc, [1.0, 0.0, 1.0, 1.0]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                torusDraw(gl, program);
            popMatrix();
            pushMatrix();
                multRotationZ(-rotation);
                multRotationX(90);
                multScale(30, 270, 30);
                gl.uniform4fv(fColorLoc, [1.0, 0.0, 0.0, 1.0]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                cylinderDraw(gl, program);
            popMatrix();
            pushMatrix();
                multTranslation(0, 0, -WHEEL_BASE/2);
                multRotationY(wheelAngle);
                multRotationX(-90);
                multRotationY(rotation);
                multScale(WHEEL_DIAMETER, 80, WHEEL_DIAMETER);
                gl.uniform4fv(fColorLoc, [1.0, 0.0, 1.0, 1.0]);
                gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
                torusDraw(gl, program);
            popMatrix();
        }

        pushMatrix();
            drawAxle(0);
        popMatrix();
        pushMatrix();
            multTranslation(300, 0, 0);
            drawAxle(wheelAngle);
        popMatrix();
    }

    pushMatrix();

        multTranslation(vanPosition[0], 0 , vanPosition[1]);

        multRotationY(vanYaw);


        pushMatrix();
            multScale(512, 256, 256);
            gl.uniform4fv(fColorLoc, [0.5, 1.0, 0.5, 1.0]);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
            cubeDraw(gl, program);
        popMatrix();
        pushMatrix();
            multTranslation(0, 153, 0);
            gl.uniformMatrix4fv(mModelViewLoc, false, flatten(modelView));
            drawAntenna();
        popMatrix();
        pushMatrix();
            multTranslation(-150, -115, 0);
            drawChassis();
        popMatrix();
    popMatrix();
}

var lastTick;
function render(time) {
	if (isNaN(time)){
		lastTick = 0;
		time = 0;
	}
    requestAnimationFrame(render);

	actualSpeed = Math.max(actualSpeed + accel()*(time-lastTick)/1000, 0);
	rotation += ((actualSpeed * (time-lastTick)/1000)/(WHEEL_DIAMETER*Math.PI/100))*360;
	torque -= torque*0.2*(time-lastTick)/1000;
	let positionDelta = actualSpeed * ((time-lastTick) / 1000) * 100;
    turningRadius = WHEEL_BASE/Math.tan(radians(wheelAngle));
    if (turningRadius !== Infinity) {
        vanYaw += positionDelta / (turningRadius * 2 * Math.PI) * 360;
        vanYaw = vanYaw % 360;
        console.log(vanYaw);
    }
	vanPosition[0] += positionDelta * Math.cos(-radians(wheelAngle + vanYaw));
    vanPosition[1] += positionDelta * Math.sin(-radians(wheelAngle + vanYaw));


	lastTick = time;

    resize(gl);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,30*VP_DISTANCE);

    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(projection));
    gl.uniform1i(fSolidColorLoc, solidColor);

    modelView = lookAt(eye, [0,0,0], [0,1,0]);

    drawVan();
}


window.onkeydown = (key) => {
    switch (key.key) {
        case 'w':
            torque += 600;
            if (torque > 5000) torque = 5000;
            break;
        case 'a':
            wheelAngle = Math.min(wheelAngle + 5, 45);
            break;
        case 's':
			torque -= 600;
			if (torque < 0) torque = 0;
			actualSpeed -= 10/30; /* 30 was what I found to be key repeat time in hz,
				so this gives me about 10m/s² decellaration */
			if (actualSpeed < 0) actualSpeed = 0;
            break;
        case 'd':
            wheelAngle = Math.max(wheelAngle - 5, -45);
            break;
        case 'i':
            antennaPivot = Math.min(antennaPivot + 5, 60);
            break;
        case 'k':
            antennaPivot = Math.max(antennaPivot - 5, -100);
            break;
        case 'j':
            antennaRotation -= 5;
            antennaRotation = antennaRotation % 360;
            break;
        case 'l':
            antennaRotation += 5;
            antennaRotation = antennaRotation % 360;
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
        case '+':
			VP_DISTANCE -=10;
			break;
        case '-':
			VP_DISTANCE +=10;
			break;
        case 'y':
			eye = [eye[0],eye[1]+10,eye[2]];
		break;
        case ' ':
            solidColor = !solidColor;
            break;
    }
}

