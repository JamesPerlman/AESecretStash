
(function main() {
    var STR_PLEASE_SELECT = 'Please select one 3D tracked null and the 2D layer you wish to stabilize.';

    app.beginUndoGroup("3D Point Stabilize");
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

        pinNull = comp.layers.addNull();
        pinNull.name = "Pin Null";
        pinNull.transform.position.expression =
            "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");\n" +
            "trackNull1.toComp(trackNull1.transform.anchorPoint);";
        pinNull.transform.position.setValue(pinNull.transform.position.valueAtTime(0, false));
        pinNull.transform.position.expression = "";
        
        // Set stabilizeLayer expressions
        stabilizeLayer.transform.anchorPoint.expression =
            "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");\n" +
            "trackNull1.toComp(trackNull1.transform.anchorPoint);";

        stabilizeLayer.transform.position.expression =
            "pinNull2D = thisComp.layer(\"" + pinNull.name + "\");\n" +
            "pinNull2D.toComp(pinNull2D.transform.anchorPoint);";

        stabilizeLayer.transform.scale.expression =
            "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");\n" +
            "cp = thisComp.activeCamera.transform.position;\n" +
            "cp0 = cp.valueAtTime(0);\n" +
            "np = trackNull1.transform.position;\n" +
            "np0 = np.valueAtTime(0);\n" +
            "d0 = length(cp0 - np0);\n" +
            "d = length(cp - np);\n" +
            "s = 100 * d / d0;\n" +
            "0.01 * s * value;\n";
    }
})();