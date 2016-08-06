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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsb2FkZXIvTm9kZURpY3Rpb25hcnlMb2FkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGZzID0gcmVxdWlyZShcImZzXCIpO1xudmFyIG5vZGVfemxpYiA9IHJlcXVpcmUoXCJ6bGliXCIpO1xudmFyIERpY3Rpb25hcnlMb2FkZXIgPSByZXF1aXJlKFwiLi9EaWN0aW9uYXJ5TG9hZGVyXCIpO1xuXG4vKipcbiAqIE5vZGVEaWN0aW9uYXJ5TG9hZGVyIGluaGVyaXRzIERpY3Rpb25hcnlMb2FkZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaWNfcGF0aCBEaWN0aW9uYXJ5IHBhdGhcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBOb2RlRGljdGlvbmFyeUxvYWRlcihkaWNfcGF0aCkge1xuICAgIERpY3Rpb25hcnlMb2FkZXIuYXBwbHkodGhpcywgWyBkaWNfcGF0aCBdKTtcbn1cblxuTm9kZURpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZSk7XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgRGljdGlvbmFyeSBmaWxlIHBhdGhcbiAqIEBwYXJhbSB7Tm9kZURpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkfSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxuICovXG5Ob2RlRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUubG9hZEFycmF5QnVmZmVyID0gZnVuY3Rpb24gKGZpbGUsIGNhbGxiYWNrKSB7XG4gICAgZnMucmVhZEZpbGUoZmlsZSwgZnVuY3Rpb24gKGVyciwgYnVmZmVyKSB7XG4gICAgICAgIGlmKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZV96bGliLmd1bnppcChidWZmZXIsIGZ1bmN0aW9uIChlcnIyLCBkZWNvbXByZXNzZWQpIHtcbiAgICAgICAgICAgIGlmKGVycjIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyMik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdHlwZWRfYXJyYXkgPSBuZXcgVWludDhBcnJheShkZWNvbXByZXNzZWQpO1xuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgdHlwZWRfYXJyYXkuYnVmZmVyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEBjYWxsYmFjayBOb2RlRGljdGlvbmFyeUxvYWRlcn5vbkxvYWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBlcnIgRXJyb3Igb2JqZWN0XG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBMb2FkZWQgYnVmZmVyXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBOb2RlRGljdGlvbmFyeUxvYWRlcjtcbiJdLCJmaWxlIjoibG9hZGVyL05vZGVEaWN0aW9uYXJ5TG9hZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
