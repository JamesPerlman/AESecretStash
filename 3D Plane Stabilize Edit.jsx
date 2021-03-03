function newCompFromComp(comp, name) {
    var newComp = comp.parentFolder.items.addComp(name, comp.width, comp.height, 1, comp.duration, comp.frameRate);
    newComp.layers.add(comp);
    return newComp;
}

function globalExpressionRefForLayer(layer) {
    return "comp(\"" + layer.containingComp.name + "\").layer(\"" + layer.name + "\")";
}

function linkTransformExpressions(destLayer, sourceLayer) {
    var sourceRefName = globalExpressionRefForLayer(sourceLayer);

    destLayer.transform.position.expression                     = sourceRefName + ".transform.position;";
    destLayer.transform.orientation.expression                  = sourceRefName + ".transform.orientation;";
    destLayer.transform.property("ADBE Rotate X").expression    = sourceRefName + ".transform.rotationX;";
    destLayer.transform.property("ADBE Rotate Y").expression    = sourceRefName + ".transform.rotationY;";
    destLayer.transform.property("ADBE Rotate Z").expression    = sourceRefName + ".activeCamera.transform.rotationZ;";
    if (destLayer.transform.scale) {
        destLayer.transform.scale.expression                    = sourceRefName + ".transform.scale;";
    }
}

(function main() {
    var STR_PLEASE_SELECT = "Please select one 3D solid layer and the 2D layer you wish to stabilize.";
    var STR_NEED_ACTIVE_CAMERA = "Please make sure this comp has an active camera, and that it is enabled.";

    app.beginUndoGroup("3D Plane Stabilize");
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

    if (!comp.activeCamera) {
        alert(STR_NEED_ACTIVE_CAMERA);
        return;
    }

    // Get the null and the 2D layer(s)
    var refSolidLayer, stabilizeLayer;
    for (var i = 0; i < layers.length; ++i) {
        var layer = layers[i];
        if (layer.threeDLayer && layer.source.mainSource instanceof SolidSource) {
            refSolidLayer = layer;
        } else if (!layer.threeDLayer) {
            stabilizeLayer = layer;
        }
    }

    if (!refSolidLayer || !stabilizeLayer) {
        alert(STR_PLEASE_SELECT);
        return;
    }

    comp.time = 0;
    
    // Make a new comp from the current comp
    var stableComp = newCompFromComp(comp, comp.name + " - 3D Projected");
    var projectionPlate = stableComp.layer(1);

    stableComp.width = refSolidLayer.source.width;
    stableComp.height = refSolidLayer.source.height;

    // Create null in place of the plane
    var stableNull = stableComp.layers.addNull();
    stableNull.name = "Stabilization Center";
    stableNull.threeDLayer = true;
    linkTransformExpressions(stableNull, refSolidLayer);

    // Create a stabilization camera
    var stableCam = stableComp.layers.addCamera("Stable Cam", [0, 0]);
    var stableCamOptions = stableCam.property("ADBE Camera Options Group");
    var stableCamZoom = stableCamOptions.property("ADBE Camera Zoom");
    stableCam.parent = stableNull;
    stableCam.transform.pointOfInterest.setValue([0, 0, 0]);
    stableCam.transform.position.setValue([0, 0, -stableCamZoom.value]);

    // Create projectorLight and position it at the stabilizeLayer's activeCam
    var projectorNull = stableComp.layers.addNull();
    projectorNull.name = "Projector Null";
    projectorNull.threeDLayer = true;
    linkTransformExpressions(projectorNull, comp.activeCamera);

    var projectorLight = stableComp.layers.addLight("Projector", [0, 0]);
    projectorLight.lighttype = LightType.SPOT;
    projectorLight.parent = projectorNull;
    projectorLight.transform.pointOfInterest.setValue([0, 0, 1]);
    projectorLight.transform.position.setValue([0, 0, 0]);
    lightOptions = projectorLight.property("ADBE Light Options Group");
    lightOptions.property("ADBE Light Intensity").setValue(100);
    lightOptions.property("ADBE Light Color").setValue([1, 1, 1]);
    lightOptions.property("ADBE Light Cone Angle").expression =
        "comp = comp(\"" + comp.name + "\");\n" +
        "cam = comp.activeCamera;\n" +
        "zoom = cam.cameraOption.zoom;\n" +
        "diag = length(0.5 * [comp.width, comp.height]);\n" +
        "fovD = Math.atan2(zoom, diag);\n" +
        "2 * radiansToDegrees(fovD);";
    lightOptions.property("ADBE Casts Shadows").setValue(true);
    lightOptions.property("ADBE Light Cone Feather 2").setValue(0);

    // Put projectionPlate infront of projectorLight 
    projectionPlate.name = "Projection Plate";
    projectionPlate.parent = projectorLight;
    projectionPlate.threeDLayer = true;
    projectionPlate.transform.position.setValue([0, 0, 1]);
    projectionPlate.transform.orientation.setValue([0, 0, 0]);
    projectionPlate.transform.scale.expression =
        "comp = comp(\"" + comp.name + "\");\n" +
        "cam = comp.activeCamera;\n" +
        "zoom = cam.cameraOption.zoom;\n" +
        "dz = length(transform.position);\n" +
        "s = dz / zoom;\n" +
        "100 * [s, s, s];";
    var plateMaterialOptions = projectionPlate.property("ADBE Material Options Group");
    plateMaterialOptions.property("ADBE Casts Shadows").setValue(3); // Casts Shadows = Only
    plateMaterialOptions.property("ADBE Light Transmission").setValue(100);
    plateMaterialOptions.property("ADBE Accepts Shadows").setValue(0); // Accepts Shadows = Off
    plateMaterialOptions.property("ADBE Accepts Lights").setValue(1); // Accepts Lights = On

    // Create projection screen
    var projectionScreen = stableComp.layers.addSolid([1, 1, 1], "Projection Screen", 1000, 1000, 1.0);
    projectionScreen.threeDLayer = true;
    projectionScreen.transform.position.setValue([0, 0, 0]);
    projectionScreen.setParentWithJump(stableNull);
    projectionScreen.transform.scale.setValue([100000, 100000, 100000]);
    var screenMaterialOptions = projectionScreen.property("ADBE Material Options Group");
    screenMaterialOptions.property("ADBE Accepts Shadows").setValue(2); // Accepts Shadows = Only
    screenMaterialOptions.property("ADBE Accepts Lights").setValue(0); // Accepts Lights = Off

    // Order layers
    stableNull.moveToBeginning();
    stableCam.moveAfter(stableNull);
    projectorNull.moveAfter(stableCam);
    projectorLight.moveAfter(projectorNull);
    projectionPlate.moveAfter(projectorLight);
    projectionScreen.moveToEnd();

    // Precomp stableComp
    var stableCompPrecomp = newCompFromComp(stableComp, comp.name + " - 3D Projected Precomp");

    var reprojectedComp = newCompFromComp(stableCompPrecomp, comp.name + " - Reconstructed");
    reprojectedComp.width = comp.width;
    reprojectedComp.height = comp.height;
    var stableCompLayer = reprojectedComp.layer(1);
    stableCompLayer.threeDLayer = true;
    comp.activeCamera.copyToComp(reprojectedComp);
    linkTransformExpressions(stableCompLayer, refSolidLayer);
    // Add original stabilizeLayer as background
    stabilizeLayer.copyToComp(reprojectedComp);
    stableCompLayer.moveAfter(reprojectedComp.activeCamera);

    
})();