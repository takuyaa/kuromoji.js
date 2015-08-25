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
var nodeZlib;
var is_browser;

if (typeof window === "undefined") {
    // In node
    fs = require("fs");
    nodeZlib = require("zlib");
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
        nodeZlib.gunzip(buffer, function (err2, decompressed) {
            var typedArray = new Uint8Array(decompressed);
            callback(null, typedArray.buffer);
        });
    });
};

/**
 * @callback NodeDictionaryLoader~onLoad
 * @param {Object} err Error object
 * @param {Uint8Array} buffer Loaded buffer
 */



module.exports = DictionaryLoader;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsb2FkZXIvRGljdGlvbmFyeUxvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgYXN5bmMgPSByZXF1aXJlKFwiYXN5bmNcIik7XG52YXIgemxpYiA9IHJlcXVpcmUoXCJ6bGlianMvYmluL2d1bnppcC5taW4uanNcIik7XG5cbnZhciBEeW5hbWljRGljdGlvbmFyaWVzID0gcmVxdWlyZShcIi4uL2RpY3QvRHluYW1pY0RpY3Rpb25hcmllcy5qc1wiKTtcblxuXG52YXIgZnM7XG52YXIgbm9kZVpsaWI7XG52YXIgaXNfYnJvd3NlcjtcblxuaWYgKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBJbiBub2RlXG4gICAgZnMgPSByZXF1aXJlKFwiZnNcIik7XG4gICAgbm9kZVpsaWIgPSByZXF1aXJlKFwiemxpYlwiKTtcbiAgICBpc19icm93c2VyID0gZmFsc2U7XG59IGVsc2Uge1xuICAgIGlzX2Jyb3dzZXIgPSB0cnVlO1xufVxuXG5cbi8qKlxuICogRGljdGlvbmFyeUxvYWRlciBiYXNlIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gZGljX3BhdGggRGljdGlvbmFyeSBwYXRoXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRGljdGlvbmFyeUxvYWRlcihkaWNfcGF0aCkge1xuICAgIHRoaXMuZGljID0gbmV3IER5bmFtaWNEaWN0aW9uYXJpZXMoKTtcbiAgICB0aGlzLmRpY19wYXRoID0gZGljX3BhdGg7XG59XG5cbi8qKlxuICogRmFjdG9yeSBtZXRob2QgZm9yIERpY3Rpb25hcnlMb2FkZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaWNfcGF0aCBEaWN0aW9uYXJ5IHBhdGhcbiAqL1xuRGljdGlvbmFyeUxvYWRlci5nZXRMb2FkZXIgPSBmdW5jdGlvbiAoZGljX3BhdGgpIHtcbiAgICBpZiAoaXNfYnJvd3Nlcikge1xuICAgICAgICAvLyBJbiBicm93c2VyXG4gICAgICAgIHJldHVybiBuZXcgQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIoZGljX3BhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEluIG5vZGVcbiAgICAgICAgcmV0dXJuIG5ldyBOb2RlRGljdGlvbmFyeUxvYWRlcihkaWNfcGF0aCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBMb2FkIGRpY3Rpb25hcnkgZmlsZXNcbiAqIEBwYXJhbSB7RGljdGlvbmFyeUxvYWRlcn5vbkxvYWR9IGxvYWRfY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gY2FsbGVkIGFmdGVyIGxvYWRlZFxuICovXG5EaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gKGxvYWRfY2FsbGJhY2spIHtcbiAgICB2YXIgZGljID0gdGhpcy5kaWM7XG4gICAgdmFyIGRpY19wYXRoID0gdGhpcy5kaWNfcGF0aDtcbiAgICB2YXIgbG9hZEFycmF5QnVmZmVyID0gdGhpcy5sb2FkQXJyYXlCdWZmZXI7XG5cbiAgICBhc3luYy5wYXJhbGxlbChbXG4gICAgICAgIC8vIFRyaWVcbiAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBhc3luYy5tYXAoWyBcImJhc2UuZGF0Lmd6XCIsIFwiY2hlY2suZGF0Lmd6XCIgXSwgZnVuY3Rpb24gKGZpbGVuYW1lLCBfY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBsb2FkQXJyYXlCdWZmZXIoZGljX3BhdGggKyBmaWxlbmFtZSwgZnVuY3Rpb24gKGVyciwgYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIF9jYWxsYmFjayhudWxsLCBidWZmZXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgYnVmZmVycykge1xuICAgICAgICAgICAgICAgIHZhciBiYXNlX2J1ZmZlciA9IG5ldyBJbnQzMkFycmF5KGJ1ZmZlcnNbMF0pO1xuICAgICAgICAgICAgICAgIHZhciBjaGVja19idWZmZXIgPSBuZXcgSW50MzJBcnJheShidWZmZXJzWzFdKTtcblxuICAgICAgICAgICAgICAgIGRpYy5sb2FkVHJpZShiYXNlX2J1ZmZlciwgY2hlY2tfYnVmZmVyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUb2tlbiBpbmZvIGRpY3Rpb25hcmllc1xuICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGFzeW5jLm1hcChbIFwidGlkLmRhdC5nelwiLCBcInRpZF9wb3MuZGF0Lmd6XCIsIFwidGlkX21hcC5kYXQuZ3pcIiBdLCBmdW5jdGlvbiAoZmlsZW5hbWUsIF9jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGxvYWRBcnJheUJ1ZmZlcihkaWNfcGF0aCArIGZpbGVuYW1lLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgX2NhbGxiYWNrKG51bGwsIGJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCBidWZmZXJzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VuX2luZm9fYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1swXSk7XG4gICAgICAgICAgICAgICAgdmFyIHBvc19idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzFdKTtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0X21hcF9idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzJdKTtcblxuICAgICAgICAgICAgICAgIGRpYy5sb2FkVG9rZW5JbmZvRGljdGlvbmFyaWVzKHRva2VuX2luZm9fYnVmZmVyLCBwb3NfYnVmZmVyLCB0YXJnZXRfbWFwX2J1ZmZlcik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gQ29ubmVjdGlvbiBjb3N0IG1hdHJpeFxuICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGxvYWRBcnJheUJ1ZmZlcihkaWNfcGF0aCArIFwiY2MuZGF0Lmd6XCIsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIHZhciBjY19idWZmZXIgPSBuZXcgSW50MTZBcnJheShidWZmZXIpO1xuICAgICAgICAgICAgICAgIGRpYy5sb2FkQ29ubmVjdGlvbkNvc3RzKGNjX2J1ZmZlcik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVW5rbm93biBkaWN0aW9uYXJpZXNcbiAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBhc3luYy5tYXAoWyBcInVuay5kYXQuZ3pcIiwgXCJ1bmtfcG9zLmRhdC5nelwiLCBcInVua19tYXAuZGF0Lmd6XCIsIFwidW5rX2NoYXIuZGF0Lmd6XCIsIFwidW5rX2NvbXBhdC5kYXQuZ3pcIiwgXCJ1bmtfaW52b2tlLmRhdC5nelwiIF0sIGZ1bmN0aW9uIChmaWxlbmFtZSwgX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgbG9hZEFycmF5QnVmZmVyKGRpY19wYXRoICsgZmlsZW5hbWUsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBfY2FsbGJhY2sobnVsbCwgYnVmZmVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgdW5rX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMF0pO1xuICAgICAgICAgICAgICAgIHZhciB1bmtfcG9zX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMV0pO1xuICAgICAgICAgICAgICAgIHZhciB1bmtfbWFwX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMl0pO1xuICAgICAgICAgICAgICAgIHZhciBjYXRfbWFwX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbM10pO1xuICAgICAgICAgICAgICAgIHZhciBjb21wYXRfY2F0X21hcF9idWZmZXIgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyc1s0XSk7XG4gICAgICAgICAgICAgICAgdmFyIGludm9rZV9kZWZfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1s1XSk7XG5cbiAgICAgICAgICAgICAgICBkaWMubG9hZFVua25vd25EaWN0aW9uYXJpZXModW5rX2J1ZmZlciwgdW5rX3Bvc19idWZmZXIsIHVua19tYXBfYnVmZmVyLCBjYXRfbWFwX2J1ZmZlciwgY29tcGF0X2NhdF9tYXBfYnVmZmVyLCBpbnZva2VfZGVmX2J1ZmZlcik7XG4gICAgICAgICAgICAgICAgLy8gZGljLmxvYWRVbmtub3duRGljdGlvbmFyaWVzKGNoYXJfYnVmZmVyLCB1bmtfYnVmZmVyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBsb2FkX2NhbGxiYWNrKGVyciwgZGljKTtcbiAgICB9KTtcbn07XG5cblxuLyoqXG4gKiBDYWxsYmFja1xuICogQGNhbGxiYWNrIERpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkXG4gKiBAcGFyYW0ge09iamVjdH0gZXJyIEVycm9yIG9iamVjdFxuICogQHBhcmFtIHtEeW5hbWljRGljdGlvbmFyaWVzfSBkaWMgTG9hZGVkIGRpY3Rpb25hcnlcbiAqL1xuXG5cbi8qKlxuICogQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIgaW5oZXJpdHMgRGljdGlvbmFyeUxvYWRlciwgdXNpbmcgalF1ZXJ5IFhIUiBmb3IgZG93bmxvYWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaWNfcGF0aCBEaWN0aW9uYXJ5IHBhdGhcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCcm93c2VyRGljdGlvbmFyeUxvYWRlcihkaWNfcGF0aCkge1xuICAgIERpY3Rpb25hcnlMb2FkZXIuYXBwbHkodGhpcywgWyBkaWNfcGF0aCBdKTtcbn1cbkJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUpO1xuLy8gQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQnJvd3NlckRpY3Rpb25hcnlMb2FkZXI7XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbiB0byBsb2FkIGd6aXBwZWQgZGljdGlvbmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IHVybCBEaWN0aW9uYXJ5IFVSTFxuICogQHBhcmFtIHtCcm93c2VyRGljdGlvbmFyeUxvYWRlcn5vbkxvYWR9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXG4gKi9cbkJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZS5sb2FkQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAodXJsLCBjYWxsYmFjaykge1xuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwsIHRydWUpO1xuICAgIHhoci5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4gICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzICE9PSAyMDApIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHhoci5zdGF0dXNUZXh0LCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXJyYXlidWZmZXIgPSB0aGlzLnJlc3BvbnNlO1xuXG4gICAgICAgIHZhciBneiA9IG5ldyB6bGliLlpsaWIuR3VuemlwKG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKSk7XG4gICAgICAgIHZhciB0eXBlZF9hcnJheSA9IGd6LmRlY29tcHJlc3MoKTtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgdHlwZWRfYXJyYXkuYnVmZmVyKTtcbiAgICB9O1xuICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICBjYWxsYmFjayhlcnIsIG51bGwpO1xuICAgIH07XG4gICAgeGhyLnNlbmQoKTtcbn07XG5cbi8qKlxuICogQ2FsbGJhY2tcbiAqIEBjYWxsYmFjayBCcm93c2VyRGljdGlvbmFyeUxvYWRlcn5vbkxvYWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBlcnIgRXJyb3Igb2JqZWN0XG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBMb2FkZWQgYnVmZmVyXG4gKi9cblxuXG4vKipcbiAqIE5vZGVEaWN0aW9uYXJ5TG9hZGVyIGluaGVyaXRzIERpY3Rpb25hcnlMb2FkZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBkaWNfcGF0aCBEaWN0aW9uYXJ5IHBhdGhcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBOb2RlRGljdGlvbmFyeUxvYWRlcihkaWNfcGF0aCkge1xuICAgIERpY3Rpb25hcnlMb2FkZXIuYXBwbHkodGhpcywgWyBkaWNfcGF0aCBdKTtcbn1cbk5vZGVEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUpO1xuLy8gTm9kZURpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTm9kZURpY3Rpb25hcnlMb2FkZXI7XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IGZpbGUgRGljdGlvbmFyeSBmaWxlIHBhdGhcbiAqIEBwYXJhbSB7Tm9kZURpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkfSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxuICovXG5Ob2RlRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUubG9hZEFycmF5QnVmZmVyID0gZnVuY3Rpb24gKGZpbGUsIGNhbGxiYWNrKSB7XG4gICAgZnMucmVhZEZpbGUoZmlsZSwgZnVuY3Rpb24gKGVyciwgYnVmZmVyKSB7XG4gICAgICAgIG5vZGVabGliLmd1bnppcChidWZmZXIsIGZ1bmN0aW9uIChlcnIyLCBkZWNvbXByZXNzZWQpIHtcbiAgICAgICAgICAgIHZhciB0eXBlZEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoZGVjb21wcmVzc2VkKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHR5cGVkQXJyYXkuYnVmZmVyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIEBjYWxsYmFjayBOb2RlRGljdGlvbmFyeUxvYWRlcn5vbkxvYWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBlcnIgRXJyb3Igb2JqZWN0XG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGJ1ZmZlciBMb2FkZWQgYnVmZmVyXG4gKi9cblxuXG5cbm1vZHVsZS5leHBvcnRzID0gRGljdGlvbmFyeUxvYWRlcjtcbiJdLCJmaWxlIjoibG9hZGVyL0RpY3Rpb25hcnlMb2FkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==