(function (thisObj) {
    function isSecurityPrefSet() {
        return app.preferences.getPrefAsLong(
            "Main Pref Section",
            "Pref_SCRIPTING_FILE_NETWORK_SECURITY"
        ) === 1;
    }

    function canWriteFiles() {
        if (isSecurityPrefSet()) return true;
        
        alert(script.name + " requires access to write files.\n" +
            "Go to the \"General\" panel of the application preferences and make sure " +
            "\"Allow Scripts to Write Files and Access Network\" is checked.");

        app.executeCommand(2359);
        return isSecurityPrefSet();
    }

    function csvToDict(text) {
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
    
    function dictToCSV(dict) {
        var columns = [];
        
        // collect data as columns
        for (var keyName in dict) {
            if (dict.hasOwnProperty(keyName)) {
                var column = [keyName];
                var values = dict[keyName];
                for (var i = 0; i < values.length; ++i) {
                    column.push(values[i]);
                }
                columns.push(column);
            }
        }
        
        if (columns.length === 0) {
            return "";
        }
        
        // convert data to rows
        var rows = [];
        for (var i = 0; i < columns[0].length; ++i) {
            var row = [];
            for (var j = 0; j < columns.length; ++j) {
                row.push("\"" + columns[j][i].toString() + "\"");
            }
            rows.push(row.join(","));
        }
        return rows.join("\n");
    }

    (function main() {
        if (!canWriteFiles()) {
            return;
        }
    
        var activeItem = app.project.activeItem;
        if (!activeItem) {
            alert('No active selection.');
            return;
        }
        
        var selectedProperties = activeItem.selectedProperties;
        var data = {};
        
        for (var i = 0; i < selectedProperties.length; ++i) {
            var prop = selectedProperties[i];
            data[prop.name] = [];
            
            for (var j = 1; j <= prop.numKeys; ++j) {
                var value = prop.keyValue(j);
                data[prop.name].push(value);
            }
        }
        
        var str = dictToCSV(data);
        var projectPath = app.project.file.fsName;
        var folder = projectPath.split("\\").slice(0,-1).join("\\");
        var outputFile = folder + "\\output.csv";
        writeFile(outputFile, str);
    })();

    function readFileWithDialog() {
        var srcFile = File.openDialog("Open motion data file (CSV)","CSV:*.csv");
        if (srcFile === null) {
            // Open Dialog was canceled
            return;
        }
        srcFile.open("r");
        var fileContent = srcFile.read();
        srcFile.close();

        return fileContent;
    }

    function writeFileWithDialog(fileContent) {
        if (!canWriteFiles()) {
            alert("Unable to export.  Please allow filesystem permissions.");
        }

        var dstFile = File.saveDialog("Save motion data file (CSV)","CSV:*.csv");
        
        dstFile.encoding = "utf-8";
        dstFile.open("w");
        dstFile.write(fileContent);
        dstFile.close();
    }

    function importCamera() {
        var fileContent = readFileWithDialog();
        var csvData = csvToDict(fileContent);
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
