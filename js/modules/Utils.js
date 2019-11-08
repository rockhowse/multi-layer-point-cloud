
// column width
var text_col_width = 100;
var auto = false;

/*
draws XYZ to orient you to the XY and Z planes
n00biest way to do this. I am learning, forgive me.
*/
function drawXYZ(scene) {
    var material_x = new THREE.LineBasicMaterial({
        color: 0xff0000
    });

    var geometry_x = new THREE.Geometry();
    geometry_x.vertices.push(new THREE.Vector3(0, 0, 0));
    geometry_x.vertices.push(new THREE.Vector3(100, 0, 0));

    var line_x = new THREE.Line(geometry_x, material_x);

    scene.add(line_x);

    // add in X axis
    addTextToScene(scene, "X", [110+50,0,0])

    var material_y = new THREE.LineBasicMaterial({
        color: 0x00ff00
    });

    var geometry_y = new THREE.Geometry();
    geometry_y.vertices.push(new THREE.Vector3(0, 0, 0));
    geometry_y.vertices.push(new THREE.Vector3(0, 100, 0));

    var line_y = new THREE.Line(geometry_y, material_y);

    scene.add(line_y);

    // add in X axis
    addTextToScene(scene, "Y", [50,110,0])

    var material_z = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });

    var geometry_z = new THREE.Geometry();
    geometry_z.vertices.push(new THREE.Vector3(0, 0, 0));
    geometry_z.vertices.push(new THREE.Vector3(0, 0, 100));

    var line_z = new THREE.Line(geometry_z, material_z);

    scene.add(line_z);

    // add in X axis
    addTextToScene(scene, "Z", [50,0,110])

}

/**
 * Adds text to the scene
 * 
 * @param textToAdd
 * @param offset
 */
function addTextToScene(three_obj, textToAdd, offset, width, height, font_size, scale) {

    var width_val = 250;
    // set default width
    if(width != null || width != 0) {
        width_val = width;
    }

    var height_val = 250;
    // set default width
    if(height != null || height != 0) {
        height_val = height;
    }

    var font_size_val = width_val + "px"
    if(font_size != null || font_size != "") {
        font_size_val  = font_size;
    }

    // create a canvas element
    var canvas1 = document.createElement('canvas');
    canvas1.width = width_val;
    canvas1.height = height_val;


    var context1 = canvas1.getContext('2d');
    context1.font = "Bold " + font_size_val + " Arial";
    context1.fillStyle = "rgba(255,255,255,0.95)";
    context1.fillText(textToAdd, 0, 120); // ("text", x, y, maxWidth)

    // canvas contents will be used for a texture
    var texture1 = new THREE.Texture(canvas1)
    texture1.needsUpdate = true;

    var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
    material1.transparent = true;

    var mesh1 = new THREE.Mesh(
        new THREE.PlaneGeometry(canvas1.width, canvas1.height),
        material1
    );
    mesh1.position.set(offset[0],offset[1],offset[2]);

    if(scale > 0) {
        mesh1.scale.x = scale;
        mesh1.scale.y = scale;
        mesh1.scale.z = scale;
    }

    three_obj.add( mesh1 );

    // return this object so we can do stuff with it
    return mesh1;
}
