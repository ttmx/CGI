function resize(gl) {
    gl.canvas.width = window.innerWidth - 16;
    gl.canvas.height = window.innerHeight - 120;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}


window.addEventListener("load", () => {

    let numVert = window.innerWidth - 16;
    let numGrid = 4;

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

    let waveVertices = [];
    for (let i = 0; i < numVert; i++) {
        waveVertices.push(-1 + i * 2 / numVert, 1);
    }

    let glassVertices = [];
    glassVertices.push(0, -1);
    glassVertices.push(0, 1);
    glassVertices.push(-1, 0);
    glassVertices.push(1, 0);
    for (let i = 0; i < numGrid; i++) {
        glassVertices.push(i / numGrid, -1);
        glassVertices.push(i / numGrid, 1);
        glassVertices.push(-i / numGrid, -1);
        glassVertices.push(-i / numGrid, 1);
        glassVertices.push(-1, i / numGrid);
        glassVertices.push(1, i / numGrid);
        glassVertices.push(-1, -i / numGrid);
        glassVertices.push(1, -i / numGrid);
    }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.160784, 0.176471, 0.243137, 1.0);

    function generateWave() {
        let waveProgram = initShaders(gl, "vertex-shader", "fragment-shader");
        let wave = {
            programInfo: {
                program: waveProgram,
                drawLength: numVert,
                drawCall: function () {
                    gl.drawArrays(gl.LINE_STRIP, 0, this.drawLength);
                }
            },
            bufferInfo: {
                buffer: gl.createBuffer(),
                attribs: {
                    vPosition: {
                        loc: gl.getAttribLocation(waveProgram, "vPosition"),
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
                    xScale: {
                        value: 1,
                        loc: gl.getUniformLocation(waveProgram, "xScale"),
                        setter: function (value) {
                            gl.uniform1f(this.loc, value);
                        }
                    },
                    yScale: {
                        value: 0.5,
                        loc: gl.getUniformLocation(waveProgram, "yScale"),
                        setter: function (value) {
                            gl.uniform1f(this.loc, value);
                        }
                    },
                    vColor: {
                        value: vec4(0.509803922, 0.666666667, 1.0, 1.0),
                        loc: gl.getUniformLocation(waveProgram, "vColor"),
                        setter: function (value) {
                            gl.uniform4fv(this.loc, value);
                        }
                    }
                },
                render: {
                    time: {
                        value: null,
                        loc: gl.getUniformLocation(waveProgram, "time"),
                        setter: function (value) {
                            gl.uniform1f(this.loc, value);
                        },
                        valueUpdater: function (time) {
                            return time * timeScale / 1000 / Math.PI;
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
        let gridProgram = initShaders(gl, "static-vert-shader", "fragment-shader");
        let grid = {
            programInfo: {
                program: gridProgram,
                drawLength: numGrid * 8 + 4,
                drawCall: function () {
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
                        value: vec4(0.470588235, 909803922.0, 0.552941176, 1.0),
                        loc: gl.getUniformLocation(gridProgram, "vColor"),
                        setter: function (value) {
                            gl.uniform4fv(this.loc, value);
                        }
                    }
                }
            }
        };

        gl.bindBuffer(gl.ARRAY_BUFFER, grid.bufferInfo.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(glassVertices), gl.STATIC_DRAW);

        gl.useProgram(gridProgram);
        setUniforms(grid.uniforms.init);
        return grid;
    }

    let wave = generateWave();
    let grid = generateGrid();

    let objectsToRender = [];
    objectsToRender.push(wave);
    objectsToRender.push(grid);

    gl.lineWidth(3);

    function render(time) {
        gl.clear(gl.COLOR_BUFFER_BIT);
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

    requestAnimFrame(render);
});
