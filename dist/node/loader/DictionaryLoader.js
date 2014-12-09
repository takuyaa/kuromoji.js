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
var is_browser;

if (typeof window === "undefined") {
    // In node
    fs = require("fs");
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
        var gz = new zlib.Zlib.Gunzip(new Uint8Array(buffer));
        var typed_array = gz.decompress();
        callback(null, typed_array.buffer);
    });
};

/**
 * @callback NodeDictionaryLoader~onLoad
 * @param {Object} err Error object
 * @param {Uint8Array} buffer Loaded buffer
 */



module.exports = DictionaryLoader;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyL0RpY3Rpb25hcnlMb2FkZXIuanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsb2FkZXIvRGljdGlvbmFyeUxvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgYXN5bmMgPSByZXF1aXJlKFwiYXN5bmNcIik7XG52YXIgemxpYiA9IHJlcXVpcmUoXCJ6bGlianMvYmluL2d1bnppcC5taW4uanNcIik7XG5cbnZhciBEeW5hbWljRGljdGlvbmFyaWVzID0gcmVxdWlyZShcIi4uL2RpY3QvRHluYW1pY0RpY3Rpb25hcmllcy5qc1wiKTtcblxuXG52YXIgZnM7XG52YXIgaXNfYnJvd3NlcjtcblxuaWYgKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBJbiBub2RlXG4gICAgZnMgPSByZXF1aXJlKFwiZnNcIik7XG4gICAgaXNfYnJvd3NlciA9IGZhbHNlO1xufSBlbHNlIHtcbiAgICBpc19icm93c2VyID0gdHJ1ZTtcbn1cblxuXG4vKipcbiAqIERpY3Rpb25hcnlMb2FkZXIgYmFzZSBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtzdHJpbmd9IGRpY19wYXRoIERpY3Rpb25hcnkgcGF0aFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERpY3Rpb25hcnlMb2FkZXIoZGljX3BhdGgpIHtcbiAgICB0aGlzLmRpYyA9IG5ldyBEeW5hbWljRGljdGlvbmFyaWVzKCk7XG4gICAgdGhpcy5kaWNfcGF0aCA9IGRpY19wYXRoO1xufVxuXG4vKipcbiAqIEZhY3RvcnkgbWV0aG9kIGZvciBEaWN0aW9uYXJ5TG9hZGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGljX3BhdGggRGljdGlvbmFyeSBwYXRoXG4gKi9cbkRpY3Rpb25hcnlMb2FkZXIuZ2V0TG9hZGVyID0gZnVuY3Rpb24gKGRpY19wYXRoKSB7XG4gICAgaWYgKGlzX2Jyb3dzZXIpIHtcbiAgICAgICAgLy8gSW4gYnJvd3NlclxuICAgICAgICByZXR1cm4gbmV3IEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyKGRpY19wYXRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJbiBub2RlXG4gICAgICAgIHJldHVybiBuZXcgTm9kZURpY3Rpb25hcnlMb2FkZXIoZGljX3BhdGgpO1xuICAgIH1cbn07XG5cbi8qKlxuICogTG9hZCBkaWN0aW9uYXJ5IGZpbGVzXG4gKiBAcGFyYW0ge0RpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkfSBsb2FkX2NhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIGNhbGxlZCBhZnRlciBsb2FkZWRcbiAqL1xuRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChsb2FkX2NhbGxiYWNrKSB7XG4gICAgdmFyIGRpYyA9IHRoaXMuZGljO1xuICAgIHZhciBkaWNfcGF0aCA9IHRoaXMuZGljX3BhdGg7XG4gICAgdmFyIGxvYWRBcnJheUJ1ZmZlciA9IHRoaXMubG9hZEFycmF5QnVmZmVyO1xuXG4gICAgYXN5bmMucGFyYWxsZWwoW1xuICAgICAgICAvLyBUcmllXG4gICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgYXN5bmMubWFwKFsgXCJiYXNlLmRhdC5nelwiLCBcImNoZWNrLmRhdC5nelwiIF0sIGZ1bmN0aW9uIChmaWxlbmFtZSwgX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgbG9hZEFycmF5QnVmZmVyKGRpY19wYXRoICsgZmlsZW5hbWUsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBfY2FsbGJhY2sobnVsbCwgYnVmZmVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgYmFzZV9idWZmZXIgPSBuZXcgSW50MzJBcnJheShidWZmZXJzWzBdKTtcbiAgICAgICAgICAgICAgICB2YXIgY2hlY2tfYnVmZmVyID0gbmV3IEludDMyQXJyYXkoYnVmZmVyc1sxXSk7XG5cbiAgICAgICAgICAgICAgICBkaWMubG9hZFRyaWUoYmFzZV9idWZmZXIsIGNoZWNrX2J1ZmZlcik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVG9rZW4gaW5mbyBkaWN0aW9uYXJpZXNcbiAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBhc3luYy5tYXAoWyBcInRpZC5kYXQuZ3pcIiwgXCJ0aWRfcG9zLmRhdC5nelwiLCBcInRpZF9tYXAuZGF0Lmd6XCIgXSwgZnVuY3Rpb24gKGZpbGVuYW1lLCBfY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBsb2FkQXJyYXlCdWZmZXIoZGljX3BhdGggKyBmaWxlbmFtZSwgZnVuY3Rpb24gKGVyciwgYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIF9jYWxsYmFjayhudWxsLCBidWZmZXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgYnVmZmVycykge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbl9pbmZvX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMF0pO1xuICAgICAgICAgICAgICAgIHZhciBwb3NfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1sxXSk7XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldF9tYXBfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1syXSk7XG5cbiAgICAgICAgICAgICAgICBkaWMubG9hZFRva2VuSW5mb0RpY3Rpb25hcmllcyh0b2tlbl9pbmZvX2J1ZmZlciwgcG9zX2J1ZmZlciwgdGFyZ2V0X21hcF9idWZmZXIpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIENvbm5lY3Rpb24gY29zdCBtYXRyaXhcbiAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBsb2FkQXJyYXlCdWZmZXIoZGljX3BhdGggKyBcImNjLmRhdC5nelwiLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2NfYnVmZmVyID0gbmV3IEludDE2QXJyYXkoYnVmZmVyKTtcbiAgICAgICAgICAgICAgICBkaWMubG9hZENvbm5lY3Rpb25Db3N0cyhjY19idWZmZXIpO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIC8vIFVua25vd24gZGljdGlvbmFyaWVzXG4gICAgICAgIGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgICAgICAgICAgYXN5bmMubWFwKFsgXCJ1bmsuZGF0Lmd6XCIsIFwidW5rX3Bvcy5kYXQuZ3pcIiwgXCJ1bmtfbWFwLmRhdC5nelwiLCBcInVua19jaGFyLmRhdC5nelwiLCBcInVua19jb21wYXQuZGF0Lmd6XCIsIFwidW5rX2ludm9rZS5kYXQuZ3pcIiBdLCBmdW5jdGlvbiAoZmlsZW5hbWUsIF9jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGxvYWRBcnJheUJ1ZmZlcihkaWNfcGF0aCArIGZpbGVuYW1lLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgX2NhbGxiYWNrKG51bGwsIGJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCBidWZmZXJzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVua19idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzBdKTtcbiAgICAgICAgICAgICAgICB2YXIgdW5rX3Bvc19idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzFdKTtcbiAgICAgICAgICAgICAgICB2YXIgdW5rX21hcF9idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzJdKTtcbiAgICAgICAgICAgICAgICB2YXIgY2F0X21hcF9idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzNdKTtcbiAgICAgICAgICAgICAgICB2YXIgY29tcGF0X2NhdF9tYXBfYnVmZmVyID0gbmV3IFVpbnQzMkFycmF5KGJ1ZmZlcnNbNF0pO1xuICAgICAgICAgICAgICAgIHZhciBpbnZva2VfZGVmX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbNV0pO1xuXG4gICAgICAgICAgICAgICAgZGljLmxvYWRVbmtub3duRGljdGlvbmFyaWVzKHVua19idWZmZXIsIHVua19wb3NfYnVmZmVyLCB1bmtfbWFwX2J1ZmZlciwgY2F0X21hcF9idWZmZXIsIGNvbXBhdF9jYXRfbWFwX2J1ZmZlciwgaW52b2tlX2RlZl9idWZmZXIpO1xuICAgICAgICAgICAgICAgIC8vIGRpYy5sb2FkVW5rbm93bkRpY3Rpb25hcmllcyhjaGFyX2J1ZmZlciwgdW5rX2J1ZmZlcik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIF0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgbG9hZF9jYWxsYmFjayhlcnIsIGRpYyk7XG4gICAgfSk7XG59O1xuXG5cbi8qKlxuICogQ2FsbGJhY2tcbiAqIEBjYWxsYmFjayBEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZFxuICogQHBhcmFtIHtPYmplY3R9IGVyciBFcnJvciBvYmplY3RcbiAqIEBwYXJhbSB7RHluYW1pY0RpY3Rpb25hcmllc30gZGljIExvYWRlZCBkaWN0aW9uYXJ5XG4gKi9cblxuXG4vKipcbiAqIEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyIGluaGVyaXRzIERpY3Rpb25hcnlMb2FkZXIsIHVzaW5nIGpRdWVyeSBYSFIgZm9yIGRvd25sb2FkXG4gKiBAcGFyYW0ge3N0cmluZ30gZGljX3BhdGggRGljdGlvbmFyeSBwYXRoXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQnJvd3NlckRpY3Rpb25hcnlMb2FkZXIoZGljX3BhdGgpIHtcbiAgICBEaWN0aW9uYXJ5TG9hZGVyLmFwcGx5KHRoaXMsIFsgZGljX3BhdGggXSk7XG59XG5Ccm93c2VyRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlKTtcbi8vIEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJyb3dzZXJEaWN0aW9uYXJ5TG9hZGVyO1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb24gdG8gbG9hZCBnemlwcGVkIGRpY3Rpb25hcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgRGljdGlvbmFyeSBVUkxcbiAqIEBwYXJhbSB7QnJvd3NlckRpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkfSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxuICovXG5Ccm93c2VyRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUubG9hZEFycmF5QnVmZmVyID0gZnVuY3Rpb24gKHVybCwgY2FsbGJhY2spIHtcbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgeGhyLm9wZW4oXCJHRVRcIiwgdXJsLCB0cnVlKTtcbiAgICB4aHIucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1cyAhPT0gMjAwKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh4aHIuc3RhdHVzVGV4dCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFycmF5YnVmZmVyID0gdGhpcy5yZXNwb25zZTtcblxuICAgICAgICB2YXIgZ3ogPSBuZXcgemxpYi5abGliLkd1bnppcChuZXcgVWludDhBcnJheShhcnJheWJ1ZmZlcikpO1xuICAgICAgICB2YXIgdHlwZWRfYXJyYXkgPSBnei5kZWNvbXByZXNzKCk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHR5cGVkX2FycmF5LmJ1ZmZlcik7XG4gICAgfTtcbiAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyLCBudWxsKTtcbiAgICB9O1xuICAgIHhoci5zZW5kKCk7XG59O1xuXG4vKipcbiAqIENhbGxiYWNrXG4gKiBAY2FsbGJhY2sgQnJvd3NlckRpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkXG4gKiBAcGFyYW0ge09iamVjdH0gZXJyIEVycm9yIG9iamVjdFxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgTG9hZGVkIGJ1ZmZlclxuICovXG5cblxuLyoqXG4gKiBOb2RlRGljdGlvbmFyeUxvYWRlciBpbmhlcml0cyBEaWN0aW9uYXJ5TG9hZGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gZGljX3BhdGggRGljdGlvbmFyeSBwYXRoXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTm9kZURpY3Rpb25hcnlMb2FkZXIoZGljX3BhdGgpIHtcbiAgICBEaWN0aW9uYXJ5TG9hZGVyLmFwcGx5KHRoaXMsIFsgZGljX3BhdGggXSk7XG59XG5Ob2RlRGljdGlvbmFyeUxvYWRlci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKERpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlKTtcbi8vIE5vZGVEaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE5vZGVEaWN0aW9uYXJ5TG9hZGVyO1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlIERpY3Rpb25hcnkgZmlsZSBwYXRoXG4gKiBAcGFyYW0ge05vZGVEaWN0aW9uYXJ5TG9hZGVyfm9uTG9hZH0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cbiAqL1xuTm9kZURpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmxvYWRBcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIChmaWxlLCBjYWxsYmFjaykge1xuICAgIGZzLnJlYWRGaWxlKGZpbGUsIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICB2YXIgZ3ogPSBuZXcgemxpYi5abGliLkd1bnppcChuZXcgVWludDhBcnJheShidWZmZXIpKTtcbiAgICAgICAgdmFyIHR5cGVkX2FycmF5ID0gZ3ouZGVjb21wcmVzcygpO1xuICAgICAgICBjYWxsYmFjayhudWxsLCB0eXBlZF9hcnJheS5idWZmZXIpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBAY2FsbGJhY2sgTm9kZURpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkXG4gKiBAcGFyYW0ge09iamVjdH0gZXJyIEVycm9yIG9iamVjdFxuICogQHBhcmFtIHtVaW50OEFycmF5fSBidWZmZXIgTG9hZGVkIGJ1ZmZlclxuICovXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IERpY3Rpb25hcnlMb2FkZXI7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=