var zlib = require("zlibjs/bin/gunzip.min.js");
var DictionaryLoader = require("./DictionaryLoader");
/**
 * BrowserDictionaryLoader inherits DictionaryLoader, using jQuery XHR for download
 * @param {string} dic_path Dictionary path
 * @constructor
 */
function BrowserDictionaryLoader(dic_path) {
    DictionaryLoader.apply(this, [dic_path]);
}
BrowserDictionaryLoader.prototype = Object.create(DictionaryLoader.prototype);
// BrowserDictionaryLoader.prototype.constructor = BrowserDictionaryLoader;

/**
 * Utility function to load gzipped dictionary
 * @param {string} url Dictionary URL
 * @param {BrowserDictionaryLoader~onLoad} callback Callback function
 */
BrowserDictionaryLoader.prototype.loadArrayBuffer = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
        if (this.status !== 200) {
            callback(xhr.statusText, null);
        }
        var arraybuffer = this.response;

        var gz = new zlib.Zlib.Gunzip(new Uint8Array(arraybuffer));
        var typed_array = gz.decompress();
        callback(null, typed_array.buffer);
    };
    xhr.onerror = function (err) {
        callback(err, null);
    };
    xhr.send();
};

/**
 * Callback
 * @callback BrowserDictionaryLoader~onLoad
 * @param {Object} err Error object
 * @param {Uint8Array} buffer Loaded buffer
 */

module.exports = BrowserDictionaryLoader;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsb2FkZXIvQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsidmFyIHpsaWIgPSByZXF1aXJlKFwiemxpYmpzL2Jpbi9ndW56aXAubWluLmpzXCIpO1xudmFyIERpY3Rpb25hcnlMb2FkZXIgPSByZXF1aXJlKFwiLi9EaWN0aW9uYXJ5TG9hZGVyXCIpO1xuLyoqXG4gKiBCcm93c2VyRGljdGlvbmFyeUxvYWRlciBpbmhlcml0cyBEaWN0aW9uYXJ5TG9hZGVyLCB1c2luZyBqUXVlcnkgWEhSIGZvciBkb3dubG9hZFxuICogQHBhcmFtIHtzdHJpbmd9IGRpY19wYXRoIERpY3Rpb25hcnkgcGF0aFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyKGRpY19wYXRoKSB7XG4gICAgRGljdGlvbmFyeUxvYWRlci5hcHBseSh0aGlzLCBbZGljX3BhdGhdKTtcbn1cbkJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUpO1xuLy8gQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQnJvd3NlckRpY3Rpb25hcnlMb2FkZXI7XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0byBsb2FkIGd6aXBwZWQgZGljdGlvbmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IHVybCBEaWN0aW9uYXJ5IFVSTFxuICogQHBhcmFtIHtCcm93c2VyRGljdGlvbmFyeUxvYWRlcn5vbkxvYWR9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXG4gKi9cbkJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZS5sb2FkQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAodXJsLCBjYWxsYmFjaykge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICAgIHhoci5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHhoci5zdGF0dXNUZXh0LCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXJyYXlidWZmZXIgPSB0aGlzLnJlc3BvbnNlO1xuXG4gICAgICAgIHZhciBneiA9IG5ldyB6bGliLlpsaWIuR3VuemlwKG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKSk7XG4gICAgICAgIHZhciB0eXBlZF9hcnJheSA9IGd6LmRlY29tcHJlc3MoKTtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdHlwZWRfYXJyYXkuYnVmZmVyKTtcbiAgICB9O1xuICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgIH07XG4gICAgeGhyLnNlbmQoKTtcbn07XG5cbi8qKlxuICogQ2FsbGJhY2tcbiAqIEBjYWxsYmFjayBCcm93c2VyRGljdGlvbmFyeUxvYWRlcn5vbkxvYWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBlcnIgRXJyb3Igb2JqZWN0XG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBMb2FkZWQgYnVmZmVyXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBCcm93c2VyRGljdGlvbmFyeUxvYWRlcjtcbiJdLCJmaWxlIjoibG9hZGVyL0Jyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
