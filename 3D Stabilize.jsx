
(function main() {
    var STR_PLEASE_SELECT = 'Please select one 3D tracked null and the 2D layer you wish to stabilize.';

    app.beginUndoGroup("3D Stabilize");
    var comp = app.project.activeItem;
    
    if (comp === undefined) {
        alert(STR_PLEASE_SELECT);
        return;
    }

    var layers = comp.selectedLayers;

    if (layers.length !== 2/* && layers.length !== 3*/) {
        alert(STR_PLEASE_SELECT);
        return;
    }

    // Get the null and the 2D layer(s)
    var trackNull1, trackNull2, stabilizeLayer;
    for (var i = 0; i < layers.length; ++i) {
        var layer = layers[i];
        if (layer.nullLayer && layer.threeDLayer) {
            if (trackNull1 === undefined) {
                trackNull1 = layer;
            } else {
                trackNull2 = layer;
            }
        } else if (!layer.threeDLayer) {
            stabilizeLayer = layer;
        }
    }

    if (!trackNull1 || !stabilizeLayer) {
        alert(STR_PLEASE_SELECT);
        return;
    }

    comp.time = 0;

    if (trackNull2) {
        // Set up double-point stabilization
    } else {
        // Set up single-point stabilization
        var scaleNull = comp.layers.addNull();
        scaleNull.name = "Scale Null";
        scaleNull.position.expression = "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");" +
                                        "parent.fromComp(trackNull1.toComp(trackNull1.transform.anchorPoint, 0), 0);";
        
        scaleNull.scale.expression    = "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");" +
                                        "cp = thisComp.activeCamera.transform.position;" +
                                        "cp0 = cp.valueAtTime(0);" +
                                        "np = trackNull1.transform.position;" +
                                        "np0 = np.valueAtTime(0);" +
                                        "d0 = length(cp0 - np0);" +
                                        "d = length(cp - np);" +
                                        "s = 100 * d / d0;" +
                                        "[s,s];";

        var stable2D = comp.layers.addNull();
        stable2D.name = "Stable Null";

        stable2D.position.expression  = "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");" +
                                        "-trackNull1.toComp(trackNull1.transform.anchorPoint);";
        scaleNull.parent = stable2D;
        stabilizeLayer.parent = scaleNull;

    }
})();