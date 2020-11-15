grid_vertices = [];

var grid_points = [];
var grid_normals = [];
var grid_edges = [];

var grid_points_buffer;
var grid_normals_buffer;
var grid_edges_buffer;

function gridInit(gl, x, z) {

    function mapToInterval(in_min, in_max, out_min, out_max, value) {
        return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

    let zBorder = mapToInterval(0, z, -0.5, 0.5, z);
    for (let i = 0; i <= x; i++) {
        let xLine = mapToInterval(0, x, -0.5, 0.5, i);
        grid_vertices.push(vec3(xLine, 0, -0.5));
        grid_vertices.push(vec3(xLine, 0, zBorder));
    }
    let xBorder = mapToInterval(0, x, -0.5, 0.5, x);
    for (let i = 0; i <= z; i++) {
        let zLine = mapToInterval(0, z, -0.5, 0.5, i);
        grid_vertices.push(vec3(-0.5, 0, zLine));
        grid_vertices.push(vec3(xBorder, 0, zLine));
    }
    gridBuild();
    gridUploadData(gl);
}

function gridBuild()
{
    for (let i = 0; i + 1 < grid_vertices.length; i += 2) {
        let offset = grid_points.length;
        grid_points.push(grid_vertices[i]);
        grid_points.push(grid_vertices[i + 1]);
        for (let j = 0; j < 2; j++) {
            grid_normals.push(vec3(0, 1, 0));
        }
        grid_edges.push(offset);
        grid_edges.push(offset + 1);
    }
}

function gridUploadData(gl)
{
    grid_points_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, grid_points_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(grid_points), gl.STATIC_DRAW);

    grid_normals_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, grid_normals_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(grid_normals), gl.STATIC_DRAW);

    grid_edges_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grid_edges_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(grid_edges), gl.STATIC_DRAW);
}

function gridDrawWireFrame(gl, program)
{
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, grid_points_buffer);
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, grid_normals_buffer);
    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grid_edges_buffer);
    gl.drawElements(gl.LINES, grid_edges.length, gl.UNSIGNED_BYTE, 0);
}