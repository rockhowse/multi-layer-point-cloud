
function loadPointCloud(point_cloud_index) {

    // reset the volume container to the mid always for consistency
    //data_volume_container.position.x =  -2100;
    //data_volume_container.position.y =  -1050;
    //data_volume_container.position.z = z_fits_it_sits;

    // this used to animate but that has been moved to the buildMapFromHistoricalData() for better syncronization
    loadFlashCrashPointCloudGrid(scene, camera);
}

var sec_to_move = 2;
var sec_per_stage = 5;

function flyToDay(graph_loc, point_cloud, zoom_x, point_cloud_index) {
    var max = Math.max(point_cloud.p_x_offset, point_cloud.p_y_offset);
    var new_z = max*4;

    showPointCloudInfo(point_cloud.point_cloud_info);

    playAnimation(point_cloud, point_cloud_index);

    /* was used to zoom through container
    // move this to the X loc specified
    var tween = new TWEEN.Tween(data_volume_container.position).to({
        x: graph_loc
    }, sec_to_move * 1000/2).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
        }).onComplete(function () {

            // move the volume container behind us
            var tween = new TWEEN.Tween(data_volume_container.position).to({
                y: -50,
                z: 1100
            }, sec_to_move * 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                }).onComplete(function () {
                    setTimeout(function() {
                        playAnimation(point_cloud, point_cloud_index)
                        //returnFromDay(point_cloud, point_cloud_index);
                    }, 1000)
                }).start();
        }).start();
     */
}

// this function returns the camera back to it's position ready to fly back into another day
function returnFromDay(three_obj, point_cloud_index) {
/* this used to hide the data container, no longer zooming through it
    // slide data_volume_container back along the z access
    var tween = new TWEEN.Tween(data_volume_container.position).to({
        z: z_fits_it_sits
    }, 3 * 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
            // do nothing
        }).onComplete(function () {

            // now put it back in the middle
            var tween = new TWEEN.Tween(data_volume_container.position).to({
                x: -2100,
                y: -1050,
                z: z_fits_it_sits
            }, 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                    // do nothing
                }).onComplete(function () {
                    hidePointCloudInfo()
                    // load the next starmap
                    //loadPointCloud(++point_cloud_index)
                }).start();
        }).start();
*/

    // hide the starmap info
    hidePointCloudInfo()

    // slide point_cloud back behind other plane
    var tween = new TWEEN.Tween(three_obj.position).to({
        z: hide_plane_x-5000
    }, sec_to_move * 1000/4).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
            // do nothing
        }).onComplete(function () {
        }).start();
}

showPointCloudInfo = function (point_cloud_info) {
    $('#point_cloud_title').show()
    $('#point_cloud_date').show()
    $('#point_cloud_time').show()
    $('#point_cloud_description').show()
    $('#point_cloud_title').html("" + point_cloud_info.title);
    $('#point_cloud_date').html("" + point_cloud_info.date);
    $('#point_cloud_time').html("" + point_cloud_info.time);
    $('#point_cloud_description').html("" + point_cloud_info.description);
}

hidePointCloudInfo = function() {
    $('#point_cloud_title').hide()
    $('#point_cloud_date').hide()
    $('#point_cloud_time').hide()
    $('#point_cloud_description').hide()
}

// play animation based on index and debug
playAnimation = function (point_cloud, point_cloud_index){

    if(point_cloud_index == 0) {
        if(enable_debug) {
            playRotationAnimation(point_cloud);
        } else {
            hidePointCloudInfo(point_cloud.point_cloud_info);
            playBatsAnimationBackward(point_cloud,point_cloud_index)
        }
    } else if(point_cloud_index == 1) {
        if(enable_debug) {
            playRotationAnimation(point_cloud);
        } else{
            playFacebookAnimation(point_cloud,point_cloud_index)
        }
    } else if (point_cloud_index == 2) {
        if(enable_debug) {
            playRotationAnimation(point_cloud, -30000, kcg_container);
        } else {
            playKCGAnimation(point_cloud, point_cloud_index)
        }
    } else if (point_cloud_index == 3) {
        if(enable_debug) {
            playRotationAnimation(point_cloud);
        } else{
            playTwitterFallAnimation(point_cloud, point_cloud_index);
        }
    } else if (point_cloud_index ==4) {
         if(enable_debug) {
            playRotationAnimation(point_cloud, 40000, borg_container, true);
        } else{
            playFlashcrashBorgAnimation(point_cloud, point_cloud_index);
        }
    }
}


/**
 * Generic animation that rotates to flat and back
 *
 * @param point_cloud
 */
playRotationAnimation = function (point_cloud, new_z_override, point_cloud_container, use_container_for_point_cloud){
    var max = Math.max(point_cloud.p_x_offset, point_cloud.p_y_offset);
    var new_z = max*4;

    if(new_z_override && new_z_override != 0){
        new_z = new_z_override;
    }

    // stop animation
    rotate_point_cloud = false;

    var sec_per_stage = 3;

    var cur_point_cloud = point_cloud.hist_point_cloud;
    var container = cur_point_cloud;

    // if we pass in a container, we want to zoom that first so we can rotate local axis
    if(point_cloud_container != null && point_cloud_container) {
        container = point_cloud_container;
    }

    // for the last one, we want to rotate the entire container, not just the first starmap
    if(use_container_for_point_cloud) {
        cur_point_cloud = container;
    }

    // move the starmap up to 0
    var tween = new TWEEN.Tween(container.position).to({
        z: 0
    }, sec_per_stage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
            // do nothing
        }).onComplete(function () {
        var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
            z: Math.PI/2,
            x: -Math.PI/2.4
        }, sec_per_stage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                // do nothing
            }).onComplete(function () {

                var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
                    z: 0,
                    x: 0
                }, sec_per_stage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                        // do nothing
                    }).onComplete(function () {

                    }).start();

                /*
                 var tween2 = new TWEEN.Tween(cur_point_cloud.position).to({
                 z: cur_point_cloud.position.z+(point_cloud.p_x_offset*2)+new_z/2,
                 y: cur_point_cloud.position.y-2000
                 }, sec_per_sage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                 // do nothing
                 }).onComplete(function () {
                 var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
                 z: -Math.PI/2
                 }, sec_per_sage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                 // do nothing
                 }).onComplete(function () {
                 var tween2 = new TWEEN.Tween(cur_point_cloud.position).to({
                 z: cur_point_cloud.position.z-(cur_point_cloud.p_x_offset)*2
                 }, sec_per_sage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                 // do nothing
                 }).onComplete(function () {

                 }).start();
                 }).start();
                 }).start();
                 */
            }).start();
    }).start();

    // move the camera back to a decent spot
    var tween = new TWEEN.Tween(camera.position).to({
        z: new_z
    }, sec_per_stage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
            // do nothing
        }).onComplete(function () {
            // do nothing
   }).start();
}

playBatsAnimationBackward = function (point_cloud, point_cloud_index){
    var max = Math.max(point_cloud.p_x_offset, point_cloud.p_y_offset);
    var new_z = max*4;

    // stop animation
    rotate_point_cloud = false;

    var cur_point_cloud = point_cloud.hist_point_cloud;

    // rotate to the side with slight angle up the plane
    var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
        z: Math.PI/2,
        x: -Math.PI/2
    }, sec_per_stage* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
        }).onComplete(function () {
            var tween2 = new TWEEN.Tween(cur_point_cloud.position).to({
                x: 6120,
                z: -2103,
                y: -75
            }, sec_per_stage* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                    // do nothing
                }).onComplete(function () {

                    // start video
                    video.play()

                    setTimeout(function() {

                        showPointCloudInfo(point_cloud.point_cloud_info)
                        // rotate to the side with slight angle up the plane
                        var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
                            x: 0,
                            z: 0
                        }, sec_per_stage* 1000*2).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                            }).onComplete(function () {
                        }).start();

                        // zoom back out so you can see whole graph
                        var tween = new TWEEN.Tween(cur_point_cloud.position).to({
                            z: -40000,
                            y: -3000,
                            x: cur_point_cloud.position.x - 2000
                        }, sec_per_stage* 1000*2).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                            }).onComplete(function () {

                                setTimeout(function() {
                                      returnToHome(cur_point_cloud, new_z, point_cloud_index);
                                }, sec_per_stage*1000*3)//

                            }).start();

                    }, 88*1000)//
                }).start();
    }).start();

/*
    // move up to the mid point
    var tween = new TWEEN.Tween(cur_point_cloud.position).to({
        z: -60440 // hard coded best position
    }, sec_per_stage* 1000/2).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
            // do nothing
        }).onComplete(function () {

            // rotate to the side with slight angle up the plane
            var tween = new TWEEN.Tween(cur_point_cloud.rotation).to({
                z: Math.PI/2,
                x: -Math.PI/2.4
            }, sec_per_stage* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                }).onComplete(function () {

                    var tween2 = new TWEEN.Tween(cur_point_cloud.position).to({
                        x: cur_point_cloud.position.x+point_cloud.p_y_offset-500,
                        z: cur_point_cloud.position.z+(point_cloud.p_x_offset*2)
                    }, sec_per_stage* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                            // do nothing
                        }).onComplete(function () {

                            var new_x = cur_point_cloud.position.x-1195;
                            var new_y = cur_point_cloud.position.z+6580+ new_z/4;
                            var new_new_z = cur_point_cloud.position.y+725;

                            //6121, -2020, 725

                            alert(new_x + ":" + new_y + ":" + new_new_z)

                            var tween2 = new TWEEN.Tween(cur_point_cloud.position).to({
                                x: new_x,
                                z: new_y,
                                y: new_new_z
                            }, sec_per_stage* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                    // do nothing
                                }).onComplete(function () {

                                    // start video
                                    video.play()

                                    setTimeout(function() {
                                        returnToHome(cur_point_cloud, new_z, point_cloud_index);
                                    }, 73*1000)
                                }).start();
                        }).start();

                }).start();

            // update the markers to face the camera
            // tried doing lookAt(camera.position) but evidently there is an issue with children if you rotate the parent
            for(var i=0; i < point_cloud.marker_labels.length;i++) {
                // rotate to the side with slight angle up the plane
                var tween = new TWEEN.Tween(point_cloud.marker_labels[i][4].rotation).to({
                    y: Math.PI/-2,
                    x: Math.PI/2
                }, sec_per_stage* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                    }).onComplete(function () {
                    }).start();
            }

            // delay and return
            setTimeout(function() {
                for(var i=0; i < point_cloud.marker_labels.length;i++) {
                    var tween = new TWEEN.Tween(point_cloud.marker_labels[i][4].rotation).to({
                        y: 0,
                        x: 0
                    }, sec_per_stage* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                            // do nothing
                        }).onComplete(function () {
                            // do nothing
                        }).start();
                }
            }, sec_per_stage*1000*3)
        }).start();
 */
}

playFlashcrashBorgAnimation = function (point_cloud_index){

    var front_point_cloud = hist_point_clouds[0];

    var front_max = Math.max(front_point_cloud.p_x_offset, front_point_cloud.p_y_offset);
    var front_new_z = front_max*4;

    var borg_speed = sec_per_stage/1.5;

    // zoom forward to first starmap (flash crash)
    var tween = new TWEEN.Tween(borg_container.position).to({
        z: -40000 // hard coded for now
    }, borg_speed* 1000/2).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
            // do nothing
        }).onComplete(function () {
        var tween = new TWEEN.Tween(borg_container.rotation).to({
            z: Math.PI/2,
            x: -Math.PI/2.4
        }, borg_speed* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                // do nothing
            }).onComplete(function () {

                var tween = new TWEEN.Tween(borg_container.position).to({
                    y: 5000*4
                }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                        // do nothing
                    }).onComplete(function () {

                        var tween = new TWEEN.Tween(borg_container.rotation).to({
                            z: -Math.PI/120
                        }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                // do nothing
                            }).onComplete(function () {
                                var tween = new TWEEN.Tween(borg_container.position).to({
                                    y: borg_container.position.y - 5000*3
                                }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                        // do nothing
                                    }).onComplete(function () {
                                        var tween = new TWEEN.Tween(borg_container.rotation).to({
                                            z: -Math.PI/2
                                        }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                // do nothing
                                            }).onComplete(function () {
                                                var tween = new TWEEN.Tween(borg_container.position).to({
                                                    y: 5000*4
                                                }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                        // do nothing
                                                    }).onComplete(function () {
                                                        var tween = new TWEEN.Tween(borg_container.rotation).to({
                                                            z: -Math.PI
                                                        }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                                // do nothing
                                                            }).onComplete(function () {
                                                                var tween = new TWEEN.Tween(borg_container.position).to({
                                                                    y: borg_container.position.y - 5000*3
                                                                }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                                        // do nothing
                                                                    }).onComplete(function () {
                                                                         var tween = new TWEEN.Tween(borg_container.position).to({
                                                                         x: borg_container.position.x + 11500
                                                                         }, borg_speed* 1000/2).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                                         // do nothing
                                                                         }).onComplete(function () {

                                                                         var tween = new TWEEN.Tween(borg_container.position).to({
                                                                         z: borg_container.position.z + 50000,
                                                                         y: borg_container.position.y - 6400
                                                                         }, borg_speed* 1000/2).easing(TWEEN.Easing.Linear.None).onUpdate(function () {

                                                                         }).onComplete(function () {
                                                                                 var tween = new TWEEN.Tween(borg_container.position).to({
                                                                                     z: borg_container.position.z + 6000,
                                                                                     y: borg_container.position.y - 2000
                                                                                 }, borg_speed* 1000/7).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                                                         hidePointCloudInfo()
                                                                                     }).onComplete(function () {
                                                                                        // do nothing
                                                                                     }).start();

                                                                         }).start();

                                                                         var tween = new TWEEN.Tween(borg_container.rotation).to({
                                                                         x: -Math.PI/2.2
                                                                         }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                                         // do nothing
                                                                         }).onComplete(function () {

                                                                         }).start();
                                                                         }).start();
                                                                    }).start();
                                                            }).start();

                                                        // rotate labels
                                                        for(var j=0; j < hist_point_clouds.length; j++) {

                                                            var cur_point_cloud = hist_point_clouds[j];

                                                            for(var i=0; i < cur_point_cloud.marker_labels.length;i++) {
                                                                // rotate to the side with slight angle up the plane
                                                                var tween = new TWEEN.Tween(cur_point_cloud.marker_labels[i][4].rotation).to({
                                                                    y: Math.PI
                                                                }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                                    }).onComplete(function () {
                                                                    }).start();
                                                            }
                                                        }
                                                    }).start();
                                            }).start();
                                        // rotate labels
                                        for(var j=0; j < hist_point_clouds.length; j++) {

                                            var cur_point_cloud = hist_point_clouds[j];

                                            for(var i=0; i < cur_point_cloud.marker_labels.length;i++) {
                                                // rotate to the side with slight angle up the plane
                                                var tween = new TWEEN.Tween(cur_point_cloud.marker_labels[i][4].rotation).to({
                                                    y: Math.PI/2
                                                }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                                    }).onComplete(function () {
                                                    }).start();
                                            }
                                        }
                                    }).start();
                            }).start();

                        // roate labels
                        for(var j=0; j < hist_point_clouds.length; j++) {

                            var cur_point_cloud = hist_point_clouds[j];

                            for(var i=0; i < cur_point_cloud.marker_labels.length;i++) {
                                // rotate to the side with slight angle up the plane
                                var tween = new TWEEN.Tween(cur_point_cloud.marker_labels[i][4].rotation).to({
                                    y: -Math.PI/120
                                }, borg_speed* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
                                    }).onComplete(function () {
                                    }).start();
                            }
                        }
                    }).start();
            }).start();

        // move the labels to face the camera since when rotating the parent, the object.lookAt(camera.position) doesn't work?
        // update the markers to face the camera
        // tried doing lookAt(camera.position) but evidently there is an issue with children if you rotate the parent
        for(var j=0; j < hist_point_clouds.length; j++) {

            var cur_point_cloud = hist_point_clouds[j];

            for(var i=0; i < cur_point_cloud.marker_labels.length;i++) {
                // rotate to the side with slight angle up the plane
                var tween = new TWEEN.Tween(cur_point_cloud.marker_labels[i][4].rotation).to({
                    y: Math.PI/-2,
                    x: Math.PI/2
                }, borg_speed* 1000).easing(TWEEN.Easing.Exponential.InOut).onUpdate(function () {
                    }).onComplete(function () {
                    }).start();
            }
        }
    }).start();
}

returnToHome  = function(three_obj, new_z, point_cloud_index) {

    var tween = new TWEEN.Tween(three_obj.rotation).to({
        z: 0,
        x: 0
    }, sec_per_stage* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
            // do nothing
        }).onComplete(function () {
        }).start();

    var tween = new TWEEN.Tween(three_obj.position).to({
        y: 0,
        x: 0,
        z: -new_z*2
    }, sec_per_stage* 1000).easing(TWEEN.Easing.Linear.None).onUpdate(function () {
            // do nothing
        }).onComplete(function () {
            returnFromDay(three_obj, point_cloud_index)
        }).start();
}

