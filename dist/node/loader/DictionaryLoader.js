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

var async = require("async");
var zlib = require("zlibjs/bin/gunzip.min.js");

var DynamicDictionaries = require("../dict/DynamicDictionaries.js");


var fs;
var node_zlib;
var is_browser;

if (typeof window === "undefined") {
    // In node
    fs = require("fs");
    node_zlib = require("zlib");
    is_browser = false;
} else {
    is_browser = true;
}


/**
 * DictionaryLoader base constructor
 * @param {string} dic_path Dictionary path
 * @constructor
 */
function DictionaryLoader(dic_path) {
    this.dic = new DynamicDictionaries();
    this.dic_path = dic_path;
}

/**
 * Factory method for DictionaryLoader
 * @param {string} dic_path Dictionary path
 */
DictionaryLoader.getLoader = function (dic_path) {
    if (is_browser) {
        // In browser
        return new BrowserDictionaryLoader(dic_path);
    } else {
        // In node
        return new NodeDictionaryLoader(dic_path);
    }
};

/**
 * Load dictionary files
 * @param {DictionaryLoader~onLoad} load_callback Callback function called after loaded
 */
DictionaryLoader.prototype.load = function (load_callback) {
    var dic = this.dic;
    var dic_path = this.dic_path;
    var loadArrayBuffer = this.loadArrayBuffer;

    async.parallel([
        // Trie
        function (callback) {
            async.map([ "base.dat.gz", "check.dat.gz" ], function (filename, _callback) {
                loadArrayBuffer(dic_path + filename, function (err, buffer) {
                    _callback(null, buffer);
                });
            }, function (err, buffers) {
                var base_buffer = new Int32Array(buffers[0]);
                var check_buffer = new Int32Array(buffers[1]);

                dic.loadTrie(base_buffer, check_buffer);
                callback(null);
            });
        },
        // Token info dictionaries
        function (callback) {
            async.map([ "tid.dat.gz", "tid_pos.dat.gz", "tid_map.dat.gz" ], function (filename, _callback) {
                loadArrayBuffer(dic_path + filename, function (err, buffer) {
                    _callback(null, buffer);
                });
            }, function (err, buffers) {
                var token_info_buffer = new Uint8Array(buffers[0]);
                var pos_buffer = new Uint8Array(buffers[1]);
                var target_map_buffer = new Uint8Array(buffers[2]);

                dic.loadTokenInfoDictionaries(token_info_buffer, pos_buffer, target_map_buffer);
                callback(null);
            });
        },
        // Connection cost matrix
        function (callback) {
            loadArrayBuffer(dic_path + "cc.dat.gz", function (err, buffer) {
                var cc_buffer = new Int16Array(buffer);
                dic.loadConnectionCosts(cc_buffer);
                callback(null);
            });
        },
        // Unknown dictionaries
        function (callback) {
            async.map([ "unk.dat.gz", "unk_pos.dat.gz", "unk_map.dat.gz", "unk_char.dat.gz", "unk_compat.dat.gz", "unk_invoke.dat.gz" ], function (filename, _callback) {
                loadArrayBuffer(dic_path + filename, function (err, buffer) {
                    _callback(null, buffer);
                });
            }, function (err, buffers) {
                var unk_buffer = new Uint8Array(buffers[0]);
                var unk_pos_buffer = new Uint8Array(buffers[1]);
                var unk_map_buffer = new Uint8Array(buffers[2]);
                var cat_map_buffer = new Uint8Array(buffers[3]);
                var compat_cat_map_buffer = new Uint32Array(buffers[4]);
                var invoke_def_buffer = new Uint8Array(buffers[5]);

                dic.loadUnknownDictionaries(unk_buffer, unk_pos_buffer, unk_map_buffer, cat_map_buffer, compat_cat_map_buffer, invoke_def_buffer);
                // dic.loadUnknownDictionaries(char_buffer, unk_buffer);
                callback(null);
            });
        }
    ], function (err) {
        load_callback(err, dic);
    });
};


/**
 * Callback
 * @callback DictionaryLoader~onLoad
 * @param {Object} err Error object
 * @param {DynamicDictionaries} dic Loaded dictionary
 */


/**
 * BrowserDictionaryLoader inherits DictionaryLoader, using jQuery XHR for download
 * @param {string} dic_path Dictionary path
 * @constructor
 */
function BrowserDictionaryLoader(dic_path) {
    DictionaryLoader.apply(this, [ dic_path ]);
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
        node_zlib.gunzip(buffer, function (err2, decompressed) {
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



module.exports = DictionaryLoader;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsb2FkZXIvRGljdGlvbmFyeUxvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgYXN5bmMgPSByZXF1aXJlKFwiYXN5bmNcIik7XG52YXIgemxpYiA9IHJlcXVpcmUoXCJ6bGlianMvYmluL2d1bnppcC5taW4uanNcIik7XG5cbnZhciBEeW5hbWljRGljdGlvbmFyaWVzID0gcmVxdWlyZShcIi4uL2RpY3QvRHluYW1pY0RpY3Rpb25hcmllcy5qc1wiKTtcblxuXG52YXIgZnM7XG52YXIgbm9kZV96bGliO1xudmFyIGlzX2Jyb3dzZXI7XG5cbmlmICh0eXBlb2Ygd2luZG93ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gSW4gbm9kZVxuICAgIGZzID0gcmVxdWlyZShcImZzXCIpO1xuICAgIG5vZGVfemxpYiA9IHJlcXVpcmUoXCJ6bGliXCIpO1xuICAgIGlzX2Jyb3dzZXIgPSBmYWxzZTtcbn0gZWxzZSB7XG4gICAgaXNfYnJvd3NlciA9IHRydWU7XG59XG5cblxuLyoqXG4gKiBEaWN0aW9uYXJ5TG9hZGVyIGJhc2UgY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaWNfcGF0aCBEaWN0aW9uYXJ5IHBhdGhcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBEaWN0aW9uYXJ5TG9hZGVyKGRpY19wYXRoKSB7XG4gICAgdGhpcy5kaWMgPSBuZXcgRHluYW1pY0RpY3Rpb25hcmllcygpO1xuICAgIHRoaXMuZGljX3BhdGggPSBkaWNfcGF0aDtcbn1cblxuLyoqXG4gKiBGYWN0b3J5IG1ldGhvZCBmb3IgRGljdGlvbmFyeUxvYWRlclxuICogQHBhcmFtIHtzdHJpbmd9IGRpY19wYXRoIERpY3Rpb25hcnkgcGF0aFxuICovXG5EaWN0aW9uYXJ5TG9hZGVyLmdldExvYWRlciA9IGZ1bmN0aW9uIChkaWNfcGF0aCkge1xuICAgIGlmIChpc19icm93c2VyKSB7XG4gICAgICAgIC8vIEluIGJyb3dzZXJcbiAgICAgICAgcmV0dXJuIG5ldyBCcm93c2VyRGljdGlvbmFyeUxvYWRlcihkaWNfcGF0aCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSW4gbm9kZVxuICAgICAgICByZXR1cm4gbmV3IE5vZGVEaWN0aW9uYXJ5TG9hZGVyKGRpY19wYXRoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIExvYWQgZGljdGlvbmFyeSBmaWxlc1xuICogQHBhcmFtIHtEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZH0gbG9hZF9jYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvbiBjYWxsZWQgYWZ0ZXIgbG9hZGVkXG4gKi9cbkRpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAobG9hZF9jYWxsYmFjaykge1xuICAgIHZhciBkaWMgPSB0aGlzLmRpYztcbiAgICB2YXIgZGljX3BhdGggPSB0aGlzLmRpY19wYXRoO1xuICAgIHZhciBsb2FkQXJyYXlCdWZmZXIgPSB0aGlzLmxvYWRBcnJheUJ1ZmZlcjtcblxuICAgIGFzeW5jLnBhcmFsbGVsKFtcbiAgICAgICAgLy8gVHJpZVxuICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGFzeW5jLm1hcChbIFwiYmFzZS5kYXQuZ3pcIiwgXCJjaGVjay5kYXQuZ3pcIiBdLCBmdW5jdGlvbiAoZmlsZW5hbWUsIF9jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGxvYWRBcnJheUJ1ZmZlcihkaWNfcGF0aCArIGZpbGVuYW1lLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgX2NhbGxiYWNrKG51bGwsIGJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCBidWZmZXJzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJhc2VfYnVmZmVyID0gbmV3IEludDMyQXJyYXkoYnVmZmVyc1swXSk7XG4gICAgICAgICAgICAgICAgdmFyIGNoZWNrX2J1ZmZlciA9IG5ldyBJbnQzMkFycmF5KGJ1ZmZlcnNbMV0pO1xuXG4gICAgICAgICAgICAgICAgZGljLmxvYWRUcmllKGJhc2VfYnVmZmVyLCBjaGVja19idWZmZXIpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFRva2VuIGluZm8gZGljdGlvbmFyaWVzXG4gICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgYXN5bmMubWFwKFsgXCJ0aWQuZGF0Lmd6XCIsIFwidGlkX3Bvcy5kYXQuZ3pcIiwgXCJ0aWRfbWFwLmRhdC5nelwiIF0sIGZ1bmN0aW9uIChmaWxlbmFtZSwgX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgbG9hZEFycmF5QnVmZmVyKGRpY19wYXRoICsgZmlsZW5hbWUsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBfY2FsbGJhY2sobnVsbCwgYnVmZmVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5faW5mb19idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzBdKTtcbiAgICAgICAgICAgICAgICB2YXIgcG9zX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMV0pO1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRfbWFwX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMl0pO1xuXG4gICAgICAgICAgICAgICAgZGljLmxvYWRUb2tlbkluZm9EaWN0aW9uYXJpZXModG9rZW5faW5mb19idWZmZXIsIHBvc19idWZmZXIsIHRhcmdldF9tYXBfYnVmZmVyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBDb25uZWN0aW9uIGNvc3QgbWF0cml4XG4gICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgbG9hZEFycmF5QnVmZmVyKGRpY19wYXRoICsgXCJjYy5kYXQuZ3pcIiwgZnVuY3Rpb24gKGVyciwgYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNjX2J1ZmZlciA9IG5ldyBJbnQxNkFycmF5KGJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgZGljLmxvYWRDb25uZWN0aW9uQ29zdHMoY2NfYnVmZmVyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBVbmtub3duIGRpY3Rpb25hcmllc1xuICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGFzeW5jLm1hcChbIFwidW5rLmRhdC5nelwiLCBcInVua19wb3MuZGF0Lmd6XCIsIFwidW5rX21hcC5kYXQuZ3pcIiwgXCJ1bmtfY2hhci5kYXQuZ3pcIiwgXCJ1bmtfY29tcGF0LmRhdC5nelwiLCBcInVua19pbnZva2UuZGF0Lmd6XCIgXSwgZnVuY3Rpb24gKGZpbGVuYW1lLCBfY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBsb2FkQXJyYXlCdWZmZXIoZGljX3BhdGggKyBmaWxlbmFtZSwgZnVuY3Rpb24gKGVyciwgYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIF9jYWxsYmFjayhudWxsLCBidWZmZXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgYnVmZmVycykge1xuICAgICAgICAgICAgICAgIHZhciB1bmtfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1swXSk7XG4gICAgICAgICAgICAgICAgdmFyIHVua19wb3NfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1sxXSk7XG4gICAgICAgICAgICAgICAgdmFyIHVua19tYXBfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1syXSk7XG4gICAgICAgICAgICAgICAgdmFyIGNhdF9tYXBfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1szXSk7XG4gICAgICAgICAgICAgICAgdmFyIGNvbXBhdF9jYXRfbWFwX2J1ZmZlciA9IG5ldyBVaW50MzJBcnJheShidWZmZXJzWzRdKTtcbiAgICAgICAgICAgICAgICB2YXIgaW52b2tlX2RlZl9idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzVdKTtcblxuICAgICAgICAgICAgICAgIGRpYy5sb2FkVW5rbm93bkRpY3Rpb25hcmllcyh1bmtfYnVmZmVyLCB1bmtfcG9zX2J1ZmZlciwgdW5rX21hcF9idWZmZXIsIGNhdF9tYXBfYnVmZmVyLCBjb21wYXRfY2F0X21hcF9idWZmZXIsIGludm9rZV9kZWZfYnVmZmVyKTtcbiAgICAgICAgICAgICAgICAvLyBkaWMubG9hZFVua25vd25EaWN0aW9uYXJpZXMoY2hhcl9idWZmZXIsIHVua19idWZmZXIpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICBdLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGxvYWRfY2FsbGJhY2soZXJyLCBkaWMpO1xuICAgIH0pO1xufTtcblxuXG4vKipcbiAqIENhbGxiYWNrXG4gKiBAY2FsbGJhY2sgRGljdGlvbmFyeUxvYWRlcn5vbkxvYWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBlcnIgRXJyb3Igb2JqZWN0XG4gKiBAcGFyYW0ge0R5bmFtaWNEaWN0aW9uYXJpZXN9IGRpYyBMb2FkZWQgZGljdGlvbmFyeVxuICovXG5cblxuLyoqXG4gKiBCcm93c2VyRGljdGlvbmFyeUxvYWRlciBpbmhlcml0cyBEaWN0aW9uYXJ5TG9hZGVyLCB1c2luZyBqUXVlcnkgWEhSIGZvciBkb3dubG9hZFxuICogQHBhcmFtIHtzdHJpbmd9IGRpY19wYXRoIERpY3Rpb25hcnkgcGF0aFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyKGRpY19wYXRoKSB7XG4gICAgRGljdGlvbmFyeUxvYWRlci5hcHBseSh0aGlzLCBbIGRpY19wYXRoIF0pO1xufVxuQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZSk7XG4vLyBCcm93c2VyRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBCcm93c2VyRGljdGlvbmFyeUxvYWRlcjtcblxuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uIHRvIGxvYWQgZ3ppcHBlZCBkaWN0aW9uYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gdXJsIERpY3Rpb25hcnkgVVJMXG4gKiBAcGFyYW0ge0Jyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZH0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cbiAqL1xuQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmxvYWRBcnJheUJ1ZmZlciA9IGZ1bmN0aW9uICh1cmwsIGNhbGxiYWNrKSB7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHhoci5vcGVuKFwiR0VUXCIsIHVybCwgdHJ1ZSk7XG4gICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcbiAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXMgIT09IDIwMCkge1xuICAgICAgICAgICAgY2FsbGJhY2soeGhyLnN0YXR1c1RleHQsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhcnJheWJ1ZmZlciA9IHRoaXMucmVzcG9uc2U7XG5cbiAgICAgICAgdmFyIGd6ID0gbmV3IHpsaWIuWmxpYi5HdW56aXAobmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpKTtcbiAgICAgICAgdmFyIHR5cGVkX2FycmF5ID0gZ3ouZGVjb21wcmVzcygpO1xuICAgICAgICBjYWxsYmFjayhudWxsLCB0eXBlZF9hcnJheS5idWZmZXIpO1xuICAgIH07XG4gICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGNhbGxiYWNrKGVyciwgbnVsbCk7XG4gICAgfTtcbiAgICB4aHIuc2VuZCgpO1xufTtcblxuLyoqXG4gKiBDYWxsYmFja1xuICogQGNhbGxiYWNrIEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZFxuICogQHBhcmFtIHtPYmplY3R9IGVyciBFcnJvciBvYmplY3RcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIExvYWRlZCBidWZmZXJcbiAqL1xuXG5cbi8qKlxuICogTm9kZURpY3Rpb25hcnlMb2FkZXIgaW5oZXJpdHMgRGljdGlvbmFyeUxvYWRlclxuICogQHBhcmFtIHtzdHJpbmd9IGRpY19wYXRoIERpY3Rpb25hcnkgcGF0aFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIE5vZGVEaWN0aW9uYXJ5TG9hZGVyKGRpY19wYXRoKSB7XG4gICAgRGljdGlvbmFyeUxvYWRlci5hcHBseSh0aGlzLCBbIGRpY19wYXRoIF0pO1xufVxuTm9kZURpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZSk7XG4vLyBOb2RlRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBOb2RlRGljdGlvbmFyeUxvYWRlcjtcblxuLyoqXG4gKiBVdGlsaXR5IGZ1bmN0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gZmlsZSBEaWN0aW9uYXJ5IGZpbGUgcGF0aFxuICogQHBhcmFtIHtOb2RlRGljdGlvbmFyeUxvYWRlcn5vbkxvYWR9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXG4gKi9cbk5vZGVEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZS5sb2FkQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoZmlsZSwgY2FsbGJhY2spIHtcbiAgICBmcy5yZWFkRmlsZShmaWxlLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgbm9kZV96bGliLmd1bnppcChidWZmZXIsIGZ1bmN0aW9uIChlcnIyLCBkZWNvbXByZXNzZWQpIHtcbiAgICAgICAgICAgIHZhciB0eXBlZF9hcnJheSA9IG5ldyBVaW50OEFycmF5KGRlY29tcHJlc3NlZCk7XG4gICAgICAgICAgICBjYWxsYmFjayhudWxsLCB0eXBlZF9hcnJheS5idWZmZXIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQGNhbGxiYWNrIE5vZGVEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZFxuICogQHBhcmFtIHtPYmplY3R9IGVyciBFcnJvciBvYmplY3RcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gYnVmZmVyIExvYWRlZCBidWZmZXJcbiAqL1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBEaWN0aW9uYXJ5TG9hZGVyO1xuIl0sImZpbGUiOiJsb2FkZXIvRGljdGlvbmFyeUxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9