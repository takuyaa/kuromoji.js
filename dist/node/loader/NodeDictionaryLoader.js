var fs = require("fs");
var node_zlib = require("zlib");
var DictionaryLoader = require("./DictionaryLoader");
/**
 * NodeDictionaryLoader inherits DictionaryLoader
 * @param {string} dic_path Dictionary path
 * @constructor
 */
function NodeDictionaryLoader(dic_path) {
    DictionaryLoader.apply(this, [ dic_path ]);
}
NodeDictionaryLoader.prototype = Object.create(DictionaryLoader.prototype);
// NodeDictionaryLoader.prototype.constructor = NodeDictionaryLoader;

/**
 * Utility function
 * @param {string} file Dictionary file path
 * @param {NodeDictionaryLoader~onLoad} callback Callback function
 */
NodeDictionaryLoader.prototype.loadArrayBuffer = function (file, callback) {
    fs.readFile(file, function (err, buffer) {
        if(err) {
            return callback(err);
        }
        node_zlib.gunzip(buffer, function (err2, decompressed) {
            if(err2) {
                return callback(err2);
            }
            var typed_array = new Uint8Array(decompressed);
            callback(null, typed_array.buffer);
        });
    });
};

/**
 * @callback NodeDictionaryLoader~onLoad
 * @param {Object} err Error object
 * @param {Uint8Array} buffer Loaded buffer
 */
module.exports = NodeDictionaryLoader;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsb2FkZXIvTm9kZURpY3Rpb25hcnlMb2FkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xudmFyIG5vZGVfemxpYiA9IHJlcXVpcmUoXCJ6bGliXCIpO1xudmFyIERpY3Rpb25hcnlMb2FkZXIgPSByZXF1aXJlKFwiLi9EaWN0aW9uYXJ5TG9hZGVyXCIpO1xuLyoqXG4gKiBOb2RlRGljdGlvbmFyeUxvYWRlciBpbmhlcml0cyBEaWN0aW9uYXJ5TG9hZGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGljX3BhdGggRGljdGlvbmFyeSBwYXRoXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTm9kZURpY3Rpb25hcnlMb2FkZXIoZGljX3BhdGgpIHtcbiAgICBEaWN0aW9uYXJ5TG9hZGVyLmFwcGx5KHRoaXMsIFsgZGljX3BhdGggXSk7XG59XG5Ob2RlRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlKTtcbi8vIE5vZGVEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE5vZGVEaWN0aW9uYXJ5TG9hZGVyO1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlIERpY3Rpb25hcnkgZmlsZSBwYXRoXG4gKiBAcGFyYW0ge05vZGVEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZH0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cbiAqL1xuTm9kZURpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmxvYWRBcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIChmaWxlLCBjYWxsYmFjaykge1xuICAgIGZzLnJlYWRGaWxlKGZpbGUsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICBpZihlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGVfemxpYi5ndW56aXAoYnVmZmVyLCBmdW5jdGlvbiAoZXJyMiwgZGVjb21wcmVzc2VkKSB7XG4gICAgICAgICAgICBpZihlcnIyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycjIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHR5cGVkX2FycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZGVjb21wcmVzc2VkKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHR5cGVkX2FycmF5LmJ1ZmZlcik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBAY2FsbGJhY2sgTm9kZURpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkXG4gKiBAcGFyYW0ge09iamVjdH0gZXJyIEVycm9yIG9iamVjdFxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgTG9hZGVkIGJ1ZmZlclxuICovXG5tb2R1bGUuZXhwb3J0cyA9IE5vZGVEaWN0aW9uYXJ5TG9hZGVyO1xuIl0sImZpbGUiOiJsb2FkZXIvTm9kZURpY3Rpb25hcnlMb2FkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
