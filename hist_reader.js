var histReader = (function() {
    var explodeBuff = function(ref, delimiter) {
        var refStr = ref.join(' ');

        var pattern = delimiter.join(' ');

        var pieces = refStr.split(pattern);

        var result = [];

        var index = 0;
        for (var i in pieces) {
            if (pieces[i] == '') continue;

            result[index] = pieces[i].trim().split(' ');

            for (var j in result[i]) {
                result[index][j] = parseInt(result[i][j]) || 0;
            }

            index++;
        }

        return result;
    };
    var getResultStruct = function(struct) {
        var result = {};

        for (var i = 0; i < struct.length; i++) {
            result[ struct[i].name ] = '';
        }

        return result;
    };
    var parseStruct = function(buffer, structTpl, structSize) {
        var result = [];

        var amount = buffer.length/structSize;

        for (var i = 0; i < amount; i++) {

            var offset = (i * structSize);

            var tmpObj = getResultStruct(structTpl);

            for (var j in structTpl) {

                tmpObj[ structTpl[j].name ] = arrToString(buffer.slice(
                    offset,
                    structTpl[j].size + offset
                ));

                offset += structTpl[j].size;
            }

            result.push(tmpObj);
        }

        return result;
    };
    var arrToString = function(arr) {
        var resultStr = '';
        for (var i = 0; i < arr.length; i++) {
            resultStr += String.fromCharCode(
                arr[i]
            )
        }
        return resultStr;
    };
    var readHIST = function(path) {
        var File_Struct = function() {
            return [
                {
                    name: 'ID',
                    size: 20
                }, {
                    name: 'DATE_1',
                    size: 12
                }, {
                    name: 'TIME',
                    size: 12
                }, {
                    name: 'COLOR_TYPE',
                    size: 20
                }, {
                    name: 'NUM',
                    size: 72
                }, {
                    name: 'FILE_NAME',
                    size: 16
                }
            ];
        };
        var Hist_Title_Struct = function() {
            return [
                {
                    name: 'IM',
                    size: 1
                }, {
                    name: 'T_ID_1',
                    size: 20
                }, {
                    name: 'LAST_NAME',
                    size: 24
                }, {
                    name: 'FIRST_NAME',
                    size: 28
                }, {
                    name: 'MIDDLE_NAME',
                    size: 4
                }, {
                    name: 'T_DATE_1',
                    size: 52
                }, {
                    name: 'T_DATE_2',
                    size: 12
                }, {
                    name: 'T_ID_2',
                    size: 16
                }, {
                    name: 'T_DATE_3',
                    size: 10
                }
            ];
        };

        var fs = require('fs');

        if (!fs.existsSync(path)) {
            throw new Error('File doesn\'t exist');
        }

        var buffer = fs.readFileSync(path);

        var titleSize = 168,
            delimiterSize = 450,
            fileSize = 200,
            partsDelimiter = [42, 73, 77],
            delimiter = (function(s) {
                var d = [];
                for (var i = 0; i < s; i++) d.push(0);
                return d
            })(delimiterSize);

        var parts = explodeBuff(
            buffer.toJSON()['data'] || buffer.toJSON(),
            partsDelimiter
        );

        var result = [];
        for (var partId = 0; partId < parts.length; partId++) {
            var contentSize = parts[partId][0];

            var titlePart = parts[partId].slice(0, titleSize - 1);

            var titleObj = parseStruct(
                titlePart,
                new Hist_Title_Struct(),
                titleSize
            );

            var start = titleSize + delimiterSize - 1,
                end = start + (contentSize+1) * fileSize;

            var contentPart = parts[partId].slice(start, end);

            var files = parseStruct(
                contentPart,
                new File_Struct(),
                fileSize
            );

            result.push({
                title: titleObj[0],
                files: files
            });
        }
        return result
    };

    return {
        parse : function(p) {
            return readHIST(p)
        }
    }
})();
module.exports.parse = histReader.parse;