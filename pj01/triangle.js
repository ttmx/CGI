function resize(gl) {
    gl.canvas.width = gl.canvas.clientWidth;
    gl.canvas.height = gl.canvas.clientHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}


window.addEventListener("load", () => {

    let timeScale = 1;

    let canvas = document.getElementById("gl-canvas");
    let gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }
    resize(gl);

    let buttons = document.getElementsByClassName("option");

    for (b of buttons) {
        b.addEventListener("click", (elem) => {
            elem.target.classList.toggle("active");
            toggleWave(elem.target.dataset.opt);
        });
    }

    window.addEventListener("resize", () => {
        resize(gl);
    });

    // Configure WebGL
    gl.clearColor(0.160784, 0.176471, 0.243137, 1.0);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let verticesToDraw = 10000.0;
	let xScale = 0.01;
	let yScale = 0.05;
	let phase = 0.0;

    function generateWave() {
        const endToEndSamples = 10000.0;
        let waveVertices = [];
        for (let i = 0.0; i < endToEndSamples; i++) {
            waveVertices.push(i);
        }

        let waveProgram = initShaders(gl, "vertex-shader", "fragment-shader");
        let wave = {
            programInfo: {
                program: waveProgram,
                drawLength: endToEndSamples,
                drawCall: function () {
    				gl.lineWidth(3);
                    gl.drawArrays(gl.LINE_STRIP, 0, verticesToDraw);
                }
            },
            bufferInfo: {
                buffer: gl.createBuffer(),
                attribs: {
                    vSampleTime: {
                        loc: gl.getAttribLocation(waveProgram, "vSampleTime"),
                        setter: function (buffer) {
                            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                            gl.vertexAttribPointer(this.loc, 1, gl.FLOAT, false, 0, 0);
                            gl.enableVertexAttribArray(this.loc);
                        }
                    }
                }
            },
            uniforms: {
                init: {
                    vColor: {
                        value: vec4(0.509803922, 0.666666667, 1.0, 1.0),
                        loc: gl.getUniformLocation(waveProgram, "vColor"),
                        setter: function (value) {
                            gl.uniform4fv(this.loc, value);
                        }
                    }
                },
                render: {
                    xScale: {
                        value: 0.001,
                        loc: gl.getUniformLocation(waveProgram, "xScale"),
                        setter: function (value) {
                            gl.uniform1f(this.loc, value);
                        },
                        valueUpdater: function () {
                            return xScale;
                        }
                    },
                    yScale: {
                        value: 0.05,
                        loc: gl.getUniformLocation(waveProgram, "yScale"),
                        setter: function (value) {
                            gl.uniform1f(this.loc, value);
                        },
                        valueUpdater: function () {
                            return yScale;
                        }
                    },
                    phase: {
                        value: 0.0,
                        loc: gl.getUniformLocation(waveProgram, "phase"),
                        setter: function (value) {
                            gl.uniform1f(this.loc, value);
                        },
                        valueUpdater: function () {
                            return phase;
                        }
                    }
                }
            }
        };
        // Load the data into the GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, wave.bufferInfo.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(waveVertices), gl.STATIC_DRAW);

        gl.useProgram(waveProgram);
        setUniforms(wave.uniforms.init);
        return wave;
    }

    function generateGrid() {
        let xLength = 12;
        let yLength = 8;
        let gridVertices = [];
        for (let i = 1; i < xLength; i++) {
            gridVertices.push(vec2(i, 0));
            gridVertices.push(vec2(i, yLength));
        }
        for (let i = 1; i < yLength; i++) {
            gridVertices.push(vec2(0, i));
            gridVertices.push(vec2(xLength, i));
        }

        let gridProgram = initShaders(gl, "grid-v-shader", "fragment-shader");
        let grid = {
            programInfo: {
                program: gridProgram,
                drawLength: 2 * (xLength - 1) + 2 * (yLength - 1),
                drawCall: function () {
    				gl.lineWidth(1);
                    gl.drawArrays(gl.LINES, 0, this.drawLength);
                }
            },
            bufferInfo: {
                buffer: gl.createBuffer(),
                attribs: {
                    vPosition: {
                        loc: gl.getAttribLocation(gridProgram, "vPosition"),
                        setter: function (buffer) {
                            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                            gl.vertexAttribPointer(this.loc, 2, gl.FLOAT, false, 0, 0);
                            gl.enableVertexAttribArray(this.loc);
                        }
                    }
                }
            },
            uniforms: {
                init: {
                    vColor: {
                        value: vec4(0.470588235, 0.909803922, 0.552941176, 0.6),
                        loc: gl.getUniformLocation(gridProgram, "vColor"),
                        setter: function (value) {
                            gl.uniform4fv(this.loc, value);
                        }
                    }
                }
            }
        };

        gl.bindBuffer(gl.ARRAY_BUFFER, grid.bufferInfo.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(gridVertices), gl.STATIC_DRAW);

        gl.useProgram(gridProgram);
        setUniforms(grid.uniforms.init);
        return grid;
    }

    let wave = generateWave();
    let grid = generateGrid();

    let objectsToRender = [];
    objectsToRender.push(wave);
    objectsToRender.push(grid);


    function render(time) {
        resize(gl);
        gl.clear(gl.COLOR_BUFFER_BIT);
		verticesToDraw = (time/12%1000)*10;
        objectsToRender.forEach(object => {
            gl.useProgram(object.programInfo.program);
            setAttribs(object.bufferInfo);
            updateUniforms(object.uniforms.render, time);
            setUniforms(object.uniforms.render);
            object.programInfo.drawCall();
        });
        requestAnimFrame(render);
    }

    function setAttribs(bufferInfo) {
        for (const attribName in bufferInfo.attribs) {
            const attrib = bufferInfo.attribs[attribName];
            attrib.setter(bufferInfo.buffer);
        }
    }

    function setUniforms(uniforms) {
        for (const uniformName in uniforms) {
            const uniform = uniforms[uniformName];
            uniform.setter(uniform.value);
        }
    }

    function updateUniforms(uniforms, time) {
        for (const renderKey in uniforms) {
            const uniform = uniforms[renderKey];
            uniform.value = uniform.valueUpdater(time);
        }
    }

    function toggleWave(id) {
        switch (id) {
            case "sin":
                break;
        }
    }

	document.getElementById("y-slider").addEventListener("input",(ev)=>{
		let volts = [ 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0];
		ev.target.parentElement.firstElementChild.innerText = "Y Scale ["+volts[ev.target.value]+"V]";
		yScale = 1/volts[ev.target.value]/4;
	})

	document.getElementById("x-slider").addEventListener("input",(ev)=>{
		let seconds = [ "1e-4", "2e-4", "5e-4", "1e-3", "2e-3", "5e-3", "1e-2", "2e-2", "5e-2", "0.1", "0.2", "0.5", "1", "2", "5", "10" ];
		let secN = [0.0001,0.0002,0.0005,0.001,0.002,0.005,0.01,0.02,0.05,0.1, 0.2, 0.5, 1, 2, 5, 10 ];
		ev.target.parentElement.firstElementChild.innerText = "X Scale ["+seconds[ev.target.value]+"s]";
		xScale = secN[ev.target.value];

	})



    requestAnimFrame(render);
});