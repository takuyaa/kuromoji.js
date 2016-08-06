/*
 * Copyright 2014 Takuya Asano
 * Copyright 2010-2014 Atilika Inc. and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsb2FkZXIvQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIHpsaWIgPSByZXF1aXJlKFwiemxpYmpzL2Jpbi9ndW56aXAubWluLmpzXCIpO1xudmFyIERpY3Rpb25hcnlMb2FkZXIgPSByZXF1aXJlKFwiLi9EaWN0aW9uYXJ5TG9hZGVyXCIpO1xuXG4vKipcbiAqIEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyIGluaGVyaXRzIERpY3Rpb25hcnlMb2FkZXIsIHVzaW5nIGpRdWVyeSBYSFIgZm9yIGRvd25sb2FkXG4gKiBAcGFyYW0ge3N0cmluZ30gZGljX3BhdGggRGljdGlvbmFyeSBwYXRoXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIoZGljX3BhdGgpIHtcbiAgICBEaWN0aW9uYXJ5TG9hZGVyLmFwcGx5KHRoaXMsIFtkaWNfcGF0aF0pO1xufVxuXG5Ccm93c2VyRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlKTtcblxuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIGxvYWQgZ3ppcHBlZCBkaWN0aW9uYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIERpY3Rpb25hcnkgVVJMXG4gKiBAcGFyYW0ge0Jyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZH0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cbiAqL1xuQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmxvYWRBcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICh1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vcGVuKFwiR0VUXCIsIHVybCwgdHJ1ZSk7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgY2FsbGJhY2soeGhyLnN0YXR1c1RleHQsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhcnJheWJ1ZmZlciA9IHRoaXMucmVzcG9uc2U7XG5cbiAgICAgICAgdmFyIGd6ID0gbmV3IHpsaWIuWmxpYi5HdW56aXAobmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpKTtcbiAgICAgICAgdmFyIHR5cGVkX2FycmF5ID0gZ3ouZGVjb21wcmVzcygpO1xuICAgICAgICBjYWxsYmFjayhudWxsLCB0eXBlZF9hcnJheS5idWZmZXIpO1xuICAgIH07XG4gICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgfTtcbiAgICB4aHIuc2VuZCgpO1xufTtcblxuLyoqXG4gKiBDYWxsYmFja1xuICogQGNhbGxiYWNrIEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZFxuICogQHBhcmFtIHtPYmplY3R9IGVyciBFcnJvciBvYmplY3RcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIExvYWRlZCBidWZmZXJcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyO1xuIl0sImZpbGUiOiJsb2FkZXIvQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
