function resize(gl) {
	gl.canvas.width = gl.canvas.clientWidth;
	gl.canvas.height = gl.canvas.clientHeight;
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}


window.addEventListener("load", () => {

	const C4_WAVE_FREQUENCY = 261.63;
	const E4_WAVE_FREQUENCY = 329.63;
	const G4_WAVE_FREQUENCY = 392.00;
	const F4_WAVE_FREQUENCY = 349.23;
	const Fsharp4_WAVE_FREQUENCY = 369.99;

	let canvas = document.getElementById("gl-canvas");
	let gl = WebGLUtils.setupWebGL(canvas);
	if (!gl) {
		alert("WebGL isn't available");
	}
	resize(gl);

	let toggles = document.getElementsByClassName("toggle");

	function addOneToggle(elem) {
		elem.target.classList.toggle("active");
		if(elem.target.classList.contains("active"))
			lastX = elem.target.dataset.opt;
		toggleButton(elem.target.dataset.opt, elem.target.parentElement.parentElement.innerText[0] == "X");

	}

	function addToggles(elems) {
		for (t of elems) {
			t.onclick = addOneToggle;
		}
	}
	addToggles(toggles);


	let xyMode = false;
	let lastX = "C4";
	function addOneRadio(elem) {
		let wasActive = elem.target.classList.contains("active");
		for (rad of elem.target.parentElement.parentElement.getElementsByClassName("active")) {
			if (elem.target.parentElement.parentElement.innerText[0] == rad.parentElement.parentElement.innerText[0]){

				rad.classList.remove("active");
			}
		}
		if (!wasActive) {
			elem.target.classList.toggle("active");
			addRadios(toggles);
			xyMode = true;
		} else {
			xyMode = false;
			if(elem.target.parentElement.parentElement.innerText[0] == "Y")
				addToggles(toggles);
		}
	}

	let radios =  document.getElementsByClassName("radio");
	function addRadios(elems) {
		for ( t of toggles){
			if(t.dataset.opt != lastX)
				t.classList.remove("active");
		}
		for (r of elems) {
			r.onclick = addOneRadio;
		}
	}
	addRadios(radios);


	window.addEventListener("resize", () => {
		resize(gl);
	});

	// Configure WebGL
	gl.clearColor(0.160784, 0.176471, 0.243137, 1.0);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	let verticesToDraw = 10000.0;
	let xScale = 0.05;
	let yScale = 0.025;

	function generateWave(color, waveFreq1 = 0, waveFreq2 = 0, waveFreq3 = 0) {
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
						value: vec4(color, 1.0),
						loc: gl.getUniformLocation(waveProgram, "vColor"),
						setter: function (value) {
							gl.uniform4fv(this.loc, value);
						}
					},
					yWavesToCompose: {
						value: [waveFreq1, waveFreq2, waveFreq3].reduce((a, b) => (b > 0) + a, 0),
						loc: gl.getUniformLocation(waveProgram, "yWavesToCompose"),
						setter: function (value) {
							gl.uniform1i(this.loc, value);
						}
					},
                    yFrequencies: {
                        value: vec3(waveFreq1, waveFreq2, waveFreq3),
                        loc: gl.getUniformLocation(waveProgram, "yFrequencies"),
                        setter: function (value) {
                            gl.uniform3fv(this.loc, value);
                        }
                    },
                    xyMode: {
                        value: false,
                        loc: gl.getUniformLocation(waveProgram, "xyMode"),
                        setter: function (value) {
                            gl.uniform1i(this.loc, value);
                        }
                    }
				},
				render: {

				},
                onEvent: {
                    xScale: {
                        value: 0.05,
                        loc: gl.getUniformLocation(waveProgram, "xScale"),
                        setter: function () {
                            gl.uniform1f(this.loc, this.value);
                        },
                        valueUpdater: function (value) {
                            this.value = value;
                            gl.useProgram(wave.programInfo.program);
                            this.setter();
                        }
                    },
                    yScale: {
                        value: 0.025,
                        loc: gl.getUniformLocation(waveProgram, "yScale"),
                        setter: function () {
                            gl.uniform1f(this.loc, this.value);
                        },
                        valueUpdater: function (value) {
                            this.value = value;
                            gl.useProgram(wave.programInfo.program);
                            this.setter();
                        }
                    },
                    yPhases: {
                        value: vec3(0.0, 0.0, 0.0),
                        loc: gl.getUniformLocation(waveProgram, "yPhases"),
                        setter: function () {
                            gl.uniform3fv(this.loc, this.value);
                        },
                        valueUpdater: function () {
                            return this.value;
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
        setUniforms(wave.uniforms.onEvent);
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

	let c4wave = generateWave(vec3(1.0, 0.796078431372549, 0.4196078431372549), C4_WAVE_FREQUENCY);
	let mCwave = generateWave(vec3(0.5098039215686274, 0.6666666666666666, 1.0),
		C4_WAVE_FREQUENCY, E4_WAVE_FREQUENCY, G4_WAVE_FREQUENCY);
	let fwave = generateWave(vec3(0.7803921568627451, 0.5725490196078431, 0.9176470588235294),
		F4_WAVE_FREQUENCY, Fsharp4_WAVE_FREQUENCY);
	let grid = generateGrid();

	let objectsToRender = [];
	let waves = [];
	waves.push(c4wave);
	waves.push(mCwave);
	objectsToRender.push(c4wave);
	objectsToRender.push(grid);

	let prevVertices = -1;
	let previousFrameTime = 0;

    function adjustPhases(time) {
        for (let i = 0; i < wavesToDraw; i++) {
            gl.useProgram(objectsToRender[i].programInfo.program);
            let wave = objectsToRender[i];
            if (xyMode) {
                for (let j = 0; j < wave.uniforms.init.xWavesToCompose.value; j++) {
                    wave.uniforms.onEvent.xPhases.value[j] += 2 * Math.PI *
                        Math.max(12 * xScale,
                            (time - previousFrameTime) / 1000) * wave.uniforms.init.xFrequencies.value[j];
                    wave.uniforms.onEvent.xPhases.value[j] %= (2 * Math.PI);
                }
                wave.uniforms.onEvent.xPhases.setter();
            }
            for (let j = 0; j < wave.uniforms.init.yWavesToCompose.value; j++) {
                wave.uniforms.onEvent.yPhases.value[j] += 2 * Math.PI *
                    Math.max(12 * xScale,
                        (time - previousFrameTime) / 1000) * wave.uniforms.init.yFrequencies.value[j];
                wave.uniforms.onEvent.yPhases.value[j] %= (2 * Math.PI);
            }
            wave.uniforms.onEvent.yPhases.setter();
        }
    }

    function render(time) {
		resize(gl);
		gl.clear(gl.COLOR_BUFFER_BIT);
		verticesToDraw = (time / (12 * xScale) % 1000) * 10;
		if (10000 - verticesToDraw < ((time - previousFrameTime) / (12 * xScale) % 1000) * 10) {
			verticesToDraw = 10000;
		}
		if (prevVertices >= verticesToDraw) {    //start of next wave
			adjustPhases(time);
		}
		previousFrameTime = time;
		prevVertices = verticesToDraw;
		objectsToRender.forEach(object => {
			gl.useProgram(object.programInfo.program);
			setAttribs(object.bufferInfo);
			//updateUniforms(object.uniforms.render, time);
			//setUniforms(object.uniforms.render);
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

	let wavesToDraw = 1;

	function toggleFromArray(obj, array) {
        const index = array.indexOf(obj);

        if (index === -1) {
			wavesToDraw++;
			array.unshift(obj);
            obj.uniforms.onEvent.xScale.valueUpdater(xScale);
            obj.uniforms.onEvent.yScale.valueUpdater(yScale);
		} else {
			wavesToDraw--;
			array.splice(index, 1);
		}
	}

	let xWave = "C4";
	let yWave = false;
	function toggleButton(id, isX) {
		switch (id) {
			case "C4":
				toggleFromArray(c4wave, objectsToRender);
				break;
			case "MC4":
				toggleFromArray(mCwave, objectsToRender);
				break;
			case "F4":
				toggleFromArray(fwave, objectsToRender);
				break;
		}
	}

	document.getElementById("y-slider").addEventListener("input", (ev) => {
		let volts = [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 50.0, 100.0, 200.0, 500.0];
		ev.target.parentElement.firstElementChild.innerText = "Y Scale [" + volts[ev.target.value] + "V]";
		yScale = 1 / volts[ev.target.value] / 4;
        for (let i = 0; i < wavesToDraw; i++) {
            objectsToRender[i].uniforms.onEvent.yScale.valueUpdater(yScale);
        }
	});

	document.getElementById("x-slider").addEventListener("input", (ev) => {
		let seconds = ["0.0001", "0.0002", "0.0005", "0.001", "0.002", "0.005",
			"0.01", "0.02", "0.05", "0.1", "0.2", "0.5", "1", "2", "5", "10"];
		let secN = [0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02,
			0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
		ev.target.parentElement.firstElementChild.innerText = "X Scale [" + seconds[ev.target.value] + "s]";
		xScale = secN[ev.target.value];
        for (let i = 0; i < wavesToDraw; i++) {
            objectsToRender[i].uniforms.onEvent.xScale.valueUpdater(xScale);
        }
	});

	requestAnimFrame(render);
});
