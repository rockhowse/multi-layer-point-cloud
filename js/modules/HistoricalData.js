
// point at which the starmaps are hidden
var hide_plane_x = -300000;

// initializes the key press listeners for the historic data
initializeHistoricalData  = function(scene, auto_start, start_map) {

    // add in black plane to hide the point clouds for morphing
    var hide_plane_back_material = new THREE.MeshBasicMaterial({ color: 0x000000} );
    //var hide_plane_back_material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, wireframe_linewidth: 1 } );
    var hide_plane_back_geometry = new THREE.PlaneGeometry(500000, 500000);
    var hide_plane_back = new THREE.Mesh( hide_plane_back_geometry, hide_plane_back_material );
    hide_plane_back.position.z = hide_plane_x; // move it back
    scene.add(hide_plane_back)

    // set the selected date
    $(".date-button").click(function() {
        this.selectedDate = $(this).attr("id");
    });

    // renders historic data based on type selectedSS
    $(".type-button").click(function() {
        this.buildMapFromHistoricalData(scene, $(this).attr("id"));
    });

    $("#Animation").click(function(){
        $("#menu").hide()
        loadPointCloud(4);
    });

    if(auto_start) {
        $("#menu").hide()
        // auto start on load
        setTimeout(function(){
         loadPointCloud(start_map);
        }, 3*1000)
    }
}

var selected_starmap_index = 0; // current index of selected starmap
var hist_point_clouds = []; // holds more than one point cloud at a time

// global point clouds used for moving about
var twitter_fall_point_cloud;

// Uber container for multiple point clouds used in flash crash borg
var borg_container;

// uber container for KCG point clouds
var kcg_container;

PointCloudInfo = function(title, date, time, description) {
    this.title          = title;
    this.date           = date;
    this.time           = time;
    this.description    = description;
}

PointCloud = function ( scene, camera, selectedDate, file_type, particle_map_z_offset, bar_data_offset, font_scale, point_cloud_info, min_threshold, hide_alpha, is_borg) {
    this.point_cloud_height    = 0;
    this.point_cloud_width     = 0;
    this.num_particles      = 0;
    this.x_particle_size    = 16;
    this.y_particle_size    = this.x_particle_size/2; // overlap particle in the Y
    this.p_x_offset         = 0;
    this.p_y_offset         = 0;
    this.hist_point_cloud      = null;
    this.rotate_point_cloud    = false;
    this.selectedDate       = selectedDate;
    this.bar_data_offset    = bar_data_offset;
    this.font_scale         = font_scale;
    this.point_cloud_info      = point_cloud_info;
    this.min_threshold      = min_threshold;
    this.hide_alpha         = hide_alpha;
    this.is_borg            = is_borg;

    this.file_type              = file_type;
    this.particle_map_z_offset  = particle_map_z_offset;

    this.point_cloud_data = [];

    this.camera = camera;
    this.scene = scene;

// used to store the position of the alpha channels
    this.alpha_channel_labels = {"A":0, "B":0, "C":0, "D":0, "E":0, "F":0,
        "G":0, "H":0, "I":0, "J":0, "K":0, "L":0,
        "M":0, "N":0, "O":0, "P":0, "Q":0, "R":0,
        "S":0, "T":0, "U":0, "V":0, "W":0, "X":0,
        "Y":0, "Z":0}

    this.time_increment = 90;
    this.time_labels =  [["9:30",this.time_increment],
        ["10:00",this.time_increment+this.time_increment*2],
        ["11:00",this.time_increment+this.time_increment*4],
        ["12:00",this.time_increment+this.time_increment*6],
        ["13:00",this.time_increment+this.time_increment*8],
        ["14:00",this.time_increment+this.time_increment*10],
        ["15:00",this.time_increment+this.time_increment*12],
        ["16:00",this.time_increment+this.time_increment*14]];

    // list of markets to place on the 3D Surface ["Label", x_cord, y_cord, label_object]
    this.marker_labels = [];

    // list of markers using images placed on the 3D surface
    this.marker_images = [];

    this.startFlightPath = function () {
        controls = flight_path_controls;
        auto_fly_on = !auto_fly_on;
    }

// load the data from the two javascript files then render!
    this.buildMapFromHistoricalData = function (scene, point_cloud_index) {

        var data_loc = "./js_data/";

        var cur_point_cloud = this;

        // always show this...
        //if(enable_debug) {
            //alert("height: " + point_cloud_height +  "width: " +point_cloud_width )
            $('#ParticleCount').html("Loading: " + cur_point_cloud.point_cloud_info.title);
        //}

        // not borg, clear it
        if(!this.is_borg) {
            for(var i = 0; i < hist_point_clouds.length; i++) {
                scene.remove(hist_point_clouds[i]);
            }

            hist_point_clouds = [];
        }

        $.getScript("js/modules/Colors.js", function(){
            $.getScript(data_loc + cur_point_cloud.selectedDate + "." + cur_point_cloud.file_type + ".js", function(){
                $.getScript(data_loc + cur_point_cloud.selectedDate + "." + cur_point_cloud.file_type + ".s.f.js", function(){
                    cur_point_cloud.point_cloud_height     = 0;
                    cur_point_cloud.point_cloud_width      = 0;
                    cur_point_cloud.num_particles       = 0;
                    cur_point_cloud.point_cloud_data    = [];

                    // stop animating
                    cur_point_cloud.rotate_point_cloud = false;

                    // remove existing mesh
                    //scene.remove(hist_point_cloud);

                    // load the data into 3D array
                    addParticleMap(cur_point_cloud);

                    // render the scene
                    cur_point_cloud.buildPointCloud(scene);

                    // don't draw if borg, borg will handle it
                    if(!cur_point_cloud.is_borg) {
                        // wait 3 seconds then fly in, removes draw lag
                        setTimeout(function() {
                                // kind of a hack to get it to work... the borg grid needs to happen for single starmaps too eventually
                                flyToDay(cur_point_cloud.bar_data_offset, cur_point_cloud, 0, point_cloud_index);
                        }, 5*1000);
                    }
                });
            });
        });
    };

    // build 3D matrix with [row]/[column]/[x,y,z and RGB colors]
    this.addPointCloud = function (scene, particles, n, offset, herp, trades_count, symbol_name){

        var particleArray = [];
        // only index the ones we find for this row
        var num_particles_in_row = 0;

        for ( var k = 0; k < trades_count.length ; k++ ) {

            var trades_count_val = trades_count[k];

            var low_offset = this.min_threshold;
            // for flash crash put in 10
            // facebook 150
            // KCG 150
            // normal 50

            if(trades_count_val != 0) {
                if(trades_count_val < low_offset) {
                    trades_count_val = low_offset;
                }

                var x =  offset[0]+(k*this.x_particle_size);
                var y =  offset[1]*this.y_particle_size;
                var z =  this.x_particle_size*trades_count_val/10;   // height by color

                var color_array_val = color_array[trades_count_val];

                var fRed    = 0;
                var fGreen  = 0;
                var fBlue   = 0;

                // if we find one, use it, otherwise black
                if (color_array_val) {
                    fRed    = color_array_val.r/255
                    fGreen  = color_array_val.g/255
                    fBlue   = color_array_val.b/255
                }

                particleArray[num_particles_in_row++] = [x, y, z, fRed, fGreen, fBlue];
                this.num_particles++;
            } else {
                //particleArray[k] = [0, 0, 0, 0, 0, 0];
            }
        }

        // figure out where the last index for each letter is
        this.alpha_channel_labels[symbol_name.charAt(0)] = this.point_cloud_height;

        // look up any markers and set their Y values if they match
        for(var i=0; i < this.marker_labels.length; i++) {
            // if they match, set the Y to the value of the point_cloud_height
            if(symbol_name == this.marker_labels[i][0]){
                this.marker_labels[i][3] = this.point_cloud_height*this.y_particle_size;
            }
        }

        // second dimension
        this.point_cloud_data[this.point_cloud_height++] = particleArray;

        this.point_cloud_width = particles;
    }

    this.buildPointCloud = function (scene) {

        // if debugging pop up the particle number
        if(enable_debug) {
            //alert("height: " + point_cloud_height +  "width: " +point_cloud_width )
            $('#ParticleCount').html("# Particles: " + this.num_particles);
        } else {
            // hide this if we aren't in debug
            $('#ParticleCount').hide()
        }

        var geometry = new THREE.BufferGeometry();
        geometry.attributes = {
            position: {
                itemSize: 3,
                array: new Float32Array( this.num_particles * 3 ),
                numItems: this.num_particles * 3
            },
            color: {
                itemSize: 3,
                array: new Float32Array( this.num_particles * 3 ),
                numItems: this.num_particles * 3
            },
            size: {
                itemSize: 1,
                array: new Int32Array(this.num_particles),
                numItems: this.num_particles
            }
        }

        var positions = geometry.attributes.position.array;
        var colors = geometry.attributes.color.array;
        var sizes = geometry.attributes.size.array;

        var pc_x = 0;
        var pc_y = 0;
        // move from 0,0
        this.p_x_offset = this.point_cloud_width*this.x_particle_size/2;
        this.p_y_offset = this.point_cloud_height*this.y_particle_size/2; // /4 because we are overlapping

        for(var i =0; i < positions.length; i+=3){
            // get the max length of this row
            var max_pc_y = this.point_cloud_data[pc_x].length;

            if( max_pc_y > 0) {
                var cur_part = this.point_cloud_data[pc_x][pc_y];

                positions[i]    = cur_part[0]-this.p_x_offset;
                positions[i+1]  = cur_part[1]+this.p_y_offset;
                positions[i+2]  = cur_part[2];

                colors[i]       = cur_part[3];
                colors[i+1]     = cur_part[4];
                colors[i+2]     = cur_part[5];
            } else {
                positions[i]    = 0-this.p_x_offset;
                positions[i+1]  = 0+this.p_y_offset;
                positions[i+2]  = 0;

                colors[i]       = 0;
                colors[i+1]     = 0;
                colors[i+2]     = 0;
            }

            // step along the second axis
            pc_y++;

            // if it reaches the end, down to the next row
            if(pc_y > max_pc_y-1) {
                pc_y = 0;
                // increment
                pc_x++;
            }
        }

        // Flash Crash make it size 16 instead of original 4
        var material = new THREE.ParticleBasicMaterial( { size: this.x_particle_size*4, vertexColors: true } );
        this.hist_point_cloud = new THREE.ParticleSystem( geometry, material );

        // some of the graphs you want to hide the alpha channels
        if(!this.hide_alpha) {
            // add in alpha-channel lables
            this.addAlphaChannelLabels(this.hist_point_cloud, this.font_scale, true);
        }

        // add in time labels
        this.addTimeLabels(this.hist_point_cloud, this.font_scale);

        // add in marker labels
        this.addMarkerLabels(this.hist_point_cloud, this.font_scale);

        // add in marker images
        this.addMarkerImages(this.hist_point_cloud)

        // move this sucker back!
        this.hist_point_cloud.position.z = particle_map_z_offset;

        // add it to the list of maps
        scene.add(this.hist_point_cloud)
    }

    var end_line_len = 500;

    this.addTimeLabels = function (three_obj, font_scale) {
        this.time_increment = this.point_cloud_width/(this.time_labels.length-1);

        for(var i=0; i < this.time_labels.length;i++) {
            var offset = i*this.time_increment*this.x_particle_size;

            // if there is a specific label position, use that instead of the computed one
            if(this.time_labels[i][1] != 0){
                offset = this.time_labels[i][1];
            }

            /* uncomment out for grid lines             */
             var l_material = new THREE.LineBasicMaterial({
                color: 0x333333,
                linewidth: this.x_particle_size
             });

             var l_geometry = new THREE.Geometry();
             l_geometry.vertices.push(new THREE.Vector3(-this.p_x_offset+offset, this.p_y_offset, 0));
             l_geometry.vertices.push(new THREE.Vector3(-this.p_x_offset+offset, -this.p_y_offset, 0));

             var alpha_line = new THREE.Line(l_geometry, l_material);
             three_obj.add(alpha_line);

            var font_scale_fudge = (end_line_len/2);
            if(this.time_labels[i][0] == "30"){
                font_scale_fudge *= 1.7;
            }

            addTextToScene(three_obj, this.time_labels[i][0], [-this.p_x_offset+offset+font_scale_fudge, this.p_y_offset+100, 0], 800, 200, "150px", font_scale)
            //addTextToScene(three_obj, -this.p_x_offset+offset+font_scale_fudge, [-this.p_x_offset+offset+font_scale_fudge, this.p_y_offset+100, 0], 500, 200, "150px", font_scale)
        }
    }

    this.addAlphaChannelLabels = function (three_obj, font_scale, both_sides) {
        var prev_offset = 0;

        for(var key in this.alpha_channel_labels) {
            if(this.alpha_channel_labels.hasOwnProperty(key)) {
                /* uncomment out for grid lines                 */
                 var l_material = new THREE.LineBasicMaterial({
                    color: 0x333333,
                    linewidth: this.x_particle_size
                 });

                 var l_geometry = new THREE.Geometry();
                 l_geometry.vertices.push(new THREE.Vector3(-this.p_x_offset-end_line_len, this.p_y_offset-prev_offset, 0));
                 l_geometry.vertices.push(new THREE.Vector3(-this.p_x_offset, this.p_y_offset-prev_offset, 0));

                 var l_alpha_line = new THREE.Line(l_geometry, l_material);

                 three_obj.add(l_alpha_line)

                var font_scale_fudge = (end_line_len/2/font_scale);

                var cur_offset = this.alpha_channel_labels[key]*this.y_particle_size+font_scale_fudge; // have to adjust based on font and scale
                addTextToScene(three_obj, key, [-this.p_x_offset-100+font_scale_fudge, this.p_y_offset-((cur_offset+prev_offset)/2)-font_scale_fudge, 0], 500, 200, "150px", font_scale)

                if(both_sides) {
                    var r_geometry = new THREE.Geometry();
                    r_geometry.vertices.push(new THREE.Vector3(this.p_x_offset, this.p_y_offset-prev_offset, 0));
                    r_geometry.vertices.push(new THREE.Vector3(this.p_x_offset+end_line_len, this.p_y_offset-prev_offset, 0));

                    var r_alpha_line = new THREE.Line(r_geometry, l_material);

                    three_obj.add(r_alpha_line);

                    addTextToScene(three_obj, key, [this.p_x_offset+end_line_len+font_scale_fudge, this.p_y_offset-((cur_offset+prev_offset)/2)-font_scale_fudge, 0], 500, 200, "150px", font_scale)
                }

                prev_offset = cur_offset;
            }
        }
    }

    this.addMarkerLabels = function(three_obj, font_scale) {
        var prev_offset = 0;
        var marker_z_height = 1000;

        for(var i=0; i < this.marker_labels.length;i++) {
            /* uncomment out for grid lines             */
            var l_material = new THREE.LineBasicMaterial({
                color: 0x333333,
                linewidth: this.x_particle_size
            });

            var font_scale_val = font_scale;
            var font_letter_width = 100;
            var total_width = (font_letter_width+15)*(this.marker_labels[i][0].length);

            // if this is "bold" scale it by 2
            if(this.marker_labels[i][1]) {
                font_scale_val *= 2;
                font_letter_width = font_letter_width*2;
            }

            var x_pos = -this.p_x_offset+this.marker_labels[i][2];
            var y_pos = this.p_y_offset-this.marker_labels[i][3];

            // if they sent in a different font scale, use it

            if(this.marker_labels[i][6] && this.marker_labels[i][6] > 0.0) {
                font_scale_val = this.marker_labels[i][6];
            }

            // pop this sucker into the marker labels so we can update the facing during rotation
            this.marker_labels[i][4] =  addTextToScene(three_obj,
                this.marker_labels[i][0],
                [
                    x_pos,
                    y_pos,
                    marker_z_height
                ],
                total_width, 200, "150px", font_scale_val, true)

            // if they want to include a marker line
            if(this.marker_labels[i][5]) {
                // add in line from text to graph
                var l_geometry = new THREE.Geometry();
                l_geometry.vertices.push(new THREE.Vector3(x_pos, y_pos, marker_z_height));
                l_geometry.vertices.push(new THREE.Vector3(x_pos, y_pos, 0));

                /* uncomment out for grid lines */
                var l_material = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    linewidth: this.x_particle_size
                });

                var marker_line = new THREE.Line(l_geometry, l_material);
                three_obj.add(marker_line);
            }

            // this is BAD for generality, but doing it for quick fix
            if(this.marker_labels[i][0] == "BATS") {

                var bats_size = 50;

                // added in a black plane behind it so you don't see the particles
                var hid_bats_video_plane_material = new THREE.MeshBasicMaterial({ color: 0x000000} );
                //var hide_plane_back_material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, wireframe_linewidth: 1 } );
                var hide_bats_video_plane_geometry = new THREE.PlaneGeometry(bats_size, bats_size);
                var hide_bats_plane = new THREE.Mesh( hide_bats_video_plane_geometry, hid_bats_video_plane_material );
                hide_bats_plane.position.x = x_pos - 1;
                hide_bats_plane.position.y = y_pos
                hide_bats_plane.position.z = 75;
                hide_bats_plane.rotation.y = -Math.PI/2;
                hide_bats_plane.rotation.z = -Math.PI/2;

                three_obj.add(hide_bats_plane)

                // add in bats animation video
                this.addMarkerVideo(three_obj, "./videos/BATS.IPO.20FPS.FULL.mp4", x_pos, y_pos);
            }
        }

    }

    this.addMarkerVideo = function(three_obj, video_name, x_pos, y_pos)  {

        video = document.createElement('video');
        video.width = 120;
        video.height = 80;
       // video.autoplay = true;
        video.src = video_name;

        if(typeof video.loop == 'boolean'){
            video.loop = true;
        } else {
            video.addEventListener( 'ended', function ( event ) {
                video.currentTime = 0;
                video.play();// loop
            });
        }

         video_texture = new THREE.Texture(video);

        /* uncomment out for grid lines             */
        var i_material = new THREE.MeshBasicMaterial({
            map: video_texture
        });

        // pop this sucker into the marker labels so we can update the facing during rotation
        var bats_ipo_vid =  new THREE.Mesh(new THREE.PlaneGeometry(12, 8), i_material);

        //alert(nx + ":" + ny + ":" + nz )
        bats_ipo_vid.position.x = x_pos-5; // move it over so the line isn't overlapping
        bats_ipo_vid.position.y = y_pos;
        bats_ipo_vid.position.z = 75;
        bats_ipo_vid.rotation.y = -Math.PI/2;
        bats_ipo_vid.rotation.z = -Math.PI/2;

        three_obj.add(bats_ipo_vid);
    }

    this.addMarkerImg = function(three_obj, img_name, x_pos, y_pos)  {
        /* uncomment out for grid lines             */
        var i_material = new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(img_name)
        });

        // pop this sucker into the marker labels so we can update the facing during rotation
        var bats_ipo_img =  new THREE.Mesh(new THREE.PlaneGeometry(16, 16), i_material);

        //alert(nx + ":" + ny + ":" + nz )
        bats_ipo_img.position.x = x_pos-5; // move it over so the line isn't overlapping
        bats_ipo_img.position.y = y_pos;
        bats_ipo_img.position.z = 0;
        bats_ipo_img.rotation.y = -Math.PI/2;
        bats_ipo_img.rotation.z = -Math.PI/2;

        three_obj.add(bats_ipo_img);
    }

    this.addMarkerImages = function(three_obj) {
        var prev_offset = 0;
        var marker_z_height = 1000;

        for(var i=0; i < this.marker_images.length;i++) {

            /* uncomment out for grid lines             */
            var i_material = new THREE.MeshBasicMaterial({
                map: THREE.ImageUtils.loadTexture(this.marker_images[i][0])
            });

            var x_pos = -this.p_x_offset+this.marker_images[i][2];
            var y_pos = this.p_y_offset-this.marker_images[i][3]+marker_z_height*2;

            // pop this sucker into the marker labels so we can update the facing during rotation
            this.marker_images[i][4] =  new THREE.Mesh(new THREE.PlaneGeometry(this.marker_images[i][5],this.marker_images[i][6]), i_material);
            this.marker_images[i][4].position.x = x_pos;
            this.marker_images[i][4].position.y = y_pos;
            this.marker_images[i][4].position.z = 0;

            three_obj.add(this.marker_images[i][4]);


            // if they want to include a marker line
            if(this.marker_images[i][5]) {
                // add in line from text to graph
                var l_geometry = new THREE.Geometry();
                l_geometry.vertices.push(new THREE.Vector3(x_pos, y_pos-marker_z_height*2, 0));
                l_geometry.vertices.push(new THREE.Vector3(x_pos, y_pos, 0));

                /* uncomment out for grid lines */
                var l_material = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    linewidth: this.x_particle_size
                });

                var marker_line = new THREE.Line(l_geometry, l_material);
                three_obj.add(marker_line);
            }
        }

    }

    this.toggleRotation = function toggleRotation(){
        //alert("moving starmap to: " + point_cloud_width  + ":" + point_cloud_height + ":" + max + "L" + new_z)
        rotate_point_cloud = !rotate_point_cloud;

        rotate_data_volume = !rotate_data_volume;
    }

    this.playAnimation = function (){
        var max = Math.max(this.p_x_offset, this.p_y_offset);
        var new_z = max*4;

        // stop animation
        rotate_point_cloud = false;

        var sec_per_sage = 1;

        var cur_point_cloud = this.hist_point_cloud;

        var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
            z: Math.PI/2,
            x: -Math.PI/2.4
        }, sec_per_sage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                //camera.lookAt(sphere.position);
            }).onComplete(function () {

                var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
                    z: 0,
                    x: 0
                }, sec_per_sage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                        //camera.lookAt(sphere.position);
                    }).onComplete(function () {

                    }).start();

                /*
                var tween2 = new TWEEN.Tween(cur_point_cloud.position).to({
                    z: cur_point_cloud.position.z+(this.p_x_offset*2)+new_z/2,
                    y: cur_point_cloud.position.y-2000
                }, sec_per_sage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                        //camera.lookAt(sphere.position);
                    }).onComplete(function () {
                        var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
                            z: -Math.PI/2
                        }, sec_per_sage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                                //camera.lookAt(sphere.position);
                            }).onComplete(function () {
                                var tween2 = new TWEEN.Tween(cur_point_cloud.position).to({
                                    z: cur_point_cloud.position.z-(cur_point_cloud.p_x_offset)*2
                                }, sec_per_sage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                                        //camera.lookAt(sphere.position);
                                    }).onComplete(function () {

                                    }).start();
                            }).start();
                    }).start();
                 */
            }).start();
    }
}

function loadFlashCrashPointCloudGrid() {

    var mid_label_x_offset = 20000;
    var mid_label_y_offset = 10500;

    var flash_crash_array = [
        ["20100506",
            new PointCloudInfo("Flash Crash", "May 06 2010", "14:42:44 ET", "System Failure"),
            [
                ["May 06 2010", true, mid_label_x_offset, mid_label_y_offset, null, false],
                // label, bold, x_offset, y_offset, object, include marker
                ["Flash Crash!", false, mid_label_x_offset+10250, 100, null, true],
                ["System Slowdown", false, mid_label_x_offset-7200, mid_label_y_offset-4500, null, true]
            ],
            "nyx"
        ],
        ["20100505",
            new PointCloudInfo("Day Before Flash Crash", "May 05 2010", "Close", "Servers were upgraded."),
            [
                ["May 05 2010", true, mid_label_x_offset, mid_label_y_offset, null, false],
                ["?????", false, mid_label_x_offset+17300, mid_label_y_offset-1800, null, true],
                ["System Slowdown", false, mid_label_x_offset-10250, mid_label_y_offset+2800, null, true]
            ],
            "nyx"
        ],
        ["20100504",
            new PointCloudInfo("Normal Day", "May 04 2010", "14:42:44 ET", "No Market Anomalies"),
            [
                ["May 04 2010", true, mid_label_x_offset, mid_label_y_offset, null, false],
                ["Normal day", false, mid_label_x_offset*1.5, mid_label_y_offset-8000, null, true]
            ],
            "nyx"
        ],
        ["20100428",
            new PointCloudInfo("Flash Crash", "Apr 28 2010", "??:??:?? ET", "Previous week showed systems under stress."),
            [
                ["Apr 28 2010", true, mid_label_x_offset, mid_label_y_offset, null, false],
                ["System Slowdown", false, mid_label_x_offset-8700, mid_label_y_offset+8000, null, true]
            ],
            "nyx"
        ],
        ["20080929",
            new PointCloudInfo("Flash Crash", "Sep 29 2008", "??:??:?? ET", "Previous week showed systems under stress."),
            [
                ["Sep 29 2008", true, mid_label_x_offset, mid_label_y_offset, null, false],
            ],
            "x"
        ]
    ];
    // have to create container for easy manipulation instead of trying to move the camera
    var container_material = new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, wireframe_linewidth: 1 } );
    var container_geometry = new THREE.CubeGeometry( 100000, 100000, 100000);
    borg_container = new THREE.Mesh( container_geometry, container_material );

    for(var i = 0; i < flash_crash_array.length; i++) {

        var is_borg = true;

        // only set the first one to "false" the rest to true so they don't clear out the array
        if(i == 0){
            is_borg = false;
        }

        // PointCloud(scene, camera, year, type, z-distance, position_in_graph, font_scale)
        var  flash_crash_point_cloud_borg = new PointCloud(borg_container, camera, flash_crash_array[i][0], flash_crash_array[i][3], -(5000*i), -3000, 2.0, flash_crash_array[i][1], 50, false, is_borg);
        flash_crash_point_cloud_borg.time_increment = 180;
        flash_crash_point_cloud_borg.marker_labels = flash_crash_array[i][2];
        flash_crash_point_cloud_borg.time_labels =  [
            ["9:30",0],
            ["10:00",0],
            ["11:00",0],
            ["12:00",0],
            ["13:00",0],
            ["14:00",0],
            ["15:00",0],
            ["16:00",0]
        ];

       flash_crash_point_cloud_borg.buildMapFromHistoricalData(borg_container, 4);
        hist_point_clouds.push(flash_crash_point_cloud_borg);
    }

    borg_container.position.z = hide_plane_x-5000;

    scene.add(borg_container)
}
