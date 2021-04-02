
(function main() {
    var STR_PLEASE_SELECT = 'Please select one 3D tracked null and the 2D layer you wish to stabilize.';

    app.beginUndoGroup("3D Point Stabilize");
    var comp = app.project.activeItem;
    
    if (comp === undefined) {
        alert(STR_PLEASE_SELECT);
        return;
    }

    var layers = comp.selectedLayers;

    if (layers.length !== 2 && layers.length !== 3) {
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

    trackNull1.name = "Track Null 1";

    var pinNull1 = comp.layers.addNull();
    pinNull1.name = "Pin Null 1";
    pinNull1.transform.position.expression =
        "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");\n" +
        "trackNull1.toComp(trackNull1.transform.anchorPoint);";
    pinNull1.transform.position.setValue(pinNull1.transform.position.valueAtTime(0, false));
    pinNull1.transform.position.expression = "";
    
    // Set stabilizeLayer expressions
    stabilizeLayer.transform.anchorPoint.expression =
        "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");\n" +
        "trackNull1.toComp(trackNull1.transform.anchorPoint);";

    stabilizeLayer.transform.position.expression =
        "pinNull2D = thisComp.layer(\"" + pinNull1.name + "\");\n" +
        "pinNull2D.toComp(pinNull2D.transform.anchorPoint);";

    stabilizeLayer.transform.scale.expression =
        "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");\n" +
        "pinNull2D = thisComp.layer(\"" + pinNull1.name + "\");\n" +
        "pinScale = pinNull2D.transform.scale;\n" +
        "cp = thisComp.activeCamera.transform.position;\n" +
        "cp0 = cp.valueAtTime(0);\n" +
        "np = trackNull1.transform.position;\n" +
        "np0 = np.valueAtTime(0);\n" +
        "d0 = length(cp0 - np0);\n" +
        "d = length(cp - np);\n" +
        "s = 100 * d / d0;\n" +
        "0.01 * 0.01 * s * [value[0] * pinScale[0], value[1] * pinScale[1]];";

    if (trackNull2) {
        trackNull2.name = "Track Null 2";
        // Having two points allows for rotation stabilization
        stabilizeLayer.transform.rotation.expression =
            "pinNull2D = thisComp.layer(\"" + pinNull1.name + "\");\n" +
            "trackNull1 = thisComp.layer(\"" + trackNull1.name + "\");\n" +
            "trackNull2 = thisComp.layer(\"" + trackNull2.name + "\");\n" +
            "p1 = (t) => trackNull1.toComp(trackNull1.transform.anchorPoint, t);\n" +
            "p2 = (t) => trackNull2.toComp(trackNull2.transform.anchorPoint, t);\n" +
            "d0 = p2(0) - p1(0);\n" +
            "a0 = Math.atan2(d0[1], d0[0]);\n" +
            "d = p2(time) - p1(time);\n" +
            "a = Math.atan2(d[1], d[0]);\n" +
            "value - radiansToDegrees(a - a0) + pinNull2D.transform.rotation;";
    }
})();