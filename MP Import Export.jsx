(function (thisObj) {
    function canWriteFiles() {
        if (isSecurityPrefSet()) return true;
        
        alert(script.name + " requires access to write files.\n" +
            "Go to the \"General\" panel of the application preferences and make sure " +
            "\"Allow Scripts to Write Files and Access Network\" is checked.");

        app.executeCommand(2359);
        return isSecurityPrefSet();
    }

    function parseCSV(text) {
        var delimiter = ",";

        var rows = text.split("\n");
        var colNames = rows[0].split(delimiter);
        
        var result = {};
        for (var i = 0; i < colNames.length; ++i) {
            result[colNames[i]] = [];
        }

        for (var i = 1; i < rows.length; ++i) {
            var values = rows[i].split(delimiter);
            for (var j = 0; j < values.length; ++j) {
                result[colNames[j]].push(values[j]);
            }
        }

        return result;
    }

    function readFileWithDialog() {
        var srcFile = File.openDialog("Choose motion data file (CSV)","CSV:*.csv");
        if (srcFile === null) {
            // Open Dialog was canceled
            return;
        }
        srcFile.open("r");
        var fileContent = srcFile.read();
        srcFile.close();

        return fileContent;
    }

    function importCamera() {
        var fileContent = readFileWithDialog();
        var csvData = parseCSV(fileContent);
        alert(csvData["Time"][30]);
    }

    function createWindow(thisObj) {
        var w = (thisObj instanceof Panel)? thisObj : new Window("palette", "Skip Frames", [0, 0, 180, 130]);
        var g = w.add("group", [0, 0, 180, 130]);
        g.alignment = "center";
        g.alignChildren = "center";
        var importButton = g.add("button", [10, 10, 170, 60], "Import Camera");
        var exportButton = g.add("button", [10, 70, 170, 120], "Export Camera");
        
        importButton.onClick = function() {
            importCamera();
        }

        exportButton.onClick = function() {
            alert("export");
        }

        return w;
    }

    var window = createWindow(thisObj);
    if (window.toString() == "[object Panel]") {
        window;
    } else {
        window.show();
        window.center();
    }
})(this);
