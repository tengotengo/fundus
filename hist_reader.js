var histReader = (function() {
    var explodeBuff = function(buff, delimiter) {
        var result = [];

        var lastDelimiter = 0;
        for (var i = 0; i < buff.length; i++) {

            var delimiterFound = true;

            for (var j = 0; j < delimiter.length; j++) {
                if (buff[i + j] != delimiter[j]) {
                    delimiterFound = false;
                    break;
                }
            }

            if (delimiterFound) {
                if (i) result.push(buff.slice(lastDelimiter, i - 1));
                lastDelimiter = i + delimiter.length;
            } else {
                if (i == buff.length - 1) {
                    result.push(buff.slice(lastDelimiter, buff.length));
                }
            }
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
    var parseStruct = function(buff, structTpl, structSize) {
        var result = [];

        var amount = buff.length/structSize;

        for (var i = 0; i < amount; i++) {

            var offset = (i * structSize);

            var tmpObj = getResultStruct(structTpl);

            for (var j in structTpl) {
                var sliced = buff.slice(
                    offset,
                    structTpl[j].size + offset
                );
                tmpObj[ structTpl[j].name ] = arrToString(sliced);

                offset += structTpl[j].size;
            }

            result.push(tmpObj);
        }

        return result;
    };
    var arrToString = function(arr) {
        var resultStr = '';
        for (var i = 0; i < arr.length; i++) {
            if (!arr[i]) continue;
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
                    size: 0x14
                }, {
                    name: 'DATE_1',
                    size: 12
                }, {
                    name: 'TIME',
                    size: 12
                }, {
                    name: 'COLOR_TYPE',
                    size: 0x14
                }, {
                    name: 'NUM',
                    size: 0x48
                }, {
                    name: 'FILE_NAME',
                    size: 0x10
                }
            ];
        };
        var Hist_Title_Struct = function() {
            return [
                {
                    name: 'im',
                    size: 1
                },                 {
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

        var titleSize = 167,
            delimiterSize = 449,
            fileSize = 200,
            partsDelimiter = [42, 73, 77],
            delimiter = (function(s) {
                var d = [];
                for (var i = 0; i < s; i++) d.push(0);
                return d
            })(delimiterSize);

        var parts = explodeBuff(
            buffer,
            partsDelimiter
        );

        var result = [];
        for (var partId = 0; partId < parts.length; partId++) {
            var partBuff = parts[partId];
            var contentSize = partBuff.length;

            var titlePart = partBuff.slice(0, titleSize);

            var titleObj = parseStruct(
                titlePart,
                new Hist_Title_Struct(),
                titleSize
            );

            var start = titleSize + delimiterSize + 1,
                end = start + (contentSize+1) * fileSize;

            var contentPart = partBuff.slice(start, end);

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