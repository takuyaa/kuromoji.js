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

var path = require("path");
var async = require("async");
var DynamicDictionaries = require("../dict/DynamicDictionaries.js");


/**
 * DictionaryLoader base constructor
 * @param {string} dic_path Dictionary path
 * @constructor
 */
function DictionaryLoader(dic_path) {
    this.dic = new DynamicDictionaries();
    this.dic_path = dic_path;
}

DictionaryLoader.prototype.loadArrayBuffer = function (file, callback) {
    throw new Error("DictionaryLoader#loadArrayBuffer should be overwrite");
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
                loadArrayBuffer(path.join(dic_path, filename), function (err, buffer) {
                    if(err) {
                        return _callback(err);
                    }
                    _callback(null, buffer);
                });
            }, function (err, buffers) {
                if(err) {
                    return callback(err);
                }
                var base_buffer = new Int32Array(buffers[0]);
                var check_buffer = new Int32Array(buffers[1]);

                dic.loadTrie(base_buffer, check_buffer);
                callback(null);
            });
        },
        // Token info dictionaries
        function (callback) {
            async.map([ "tid.dat.gz", "tid_pos.dat.gz", "tid_map.dat.gz" ], function (filename, _callback) {
                loadArrayBuffer(path.join(dic_path, filename), function (err, buffer) {
                    if(err) {
                        return _callback(err);
                    }
                    _callback(null, buffer);
                });
            }, function (err, buffers) {
                if(err) {
                    return callback(err);
                }
                var token_info_buffer = new Uint8Array(buffers[0]);
                var pos_buffer = new Uint8Array(buffers[1]);
                var target_map_buffer = new Uint8Array(buffers[2]);

                dic.loadTokenInfoDictionaries(token_info_buffer, pos_buffer, target_map_buffer);
                callback(null);
            });
        },
        // Connection cost matrix
        function (callback) {
            loadArrayBuffer(path.join(dic_path, "cc.dat.gz"), function (err, buffer) {
                if(err) {
                    return callback(err);
                }
                var cc_buffer = new Int16Array(buffer);
                dic.loadConnectionCosts(cc_buffer);
                callback(null);
            });
        },
        // Unknown dictionaries
        function (callback) {
            async.map([ "unk.dat.gz", "unk_pos.dat.gz", "unk_map.dat.gz", "unk_char.dat.gz", "unk_compat.dat.gz", "unk_invoke.dat.gz" ], function (filename, _callback) {
                loadArrayBuffer(path.join(dic_path, filename), function (err, buffer) {
                    if(err) {
                        return _callback(err);
                    }
                    _callback(null, buffer);
                });
            }, function (err, buffers) {
                if(err) {
                    return callback(err);
                }
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

module.exports = DictionaryLoader;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJsb2FkZXIvRGljdGlvbmFyeUxvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgcGF0aCA9IHJlcXVpcmUoXCJwYXRoXCIpO1xudmFyIGFzeW5jID0gcmVxdWlyZShcImFzeW5jXCIpO1xudmFyIER5bmFtaWNEaWN0aW9uYXJpZXMgPSByZXF1aXJlKFwiLi4vZGljdC9EeW5hbWljRGljdGlvbmFyaWVzLmpzXCIpO1xuXG5cbi8qKlxuICogRGljdGlvbmFyeUxvYWRlciBiYXNlIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge3N0cmluZ30gZGljX3BhdGggRGljdGlvbmFyeSBwYXRoXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRGljdGlvbmFyeUxvYWRlcihkaWNfcGF0aCkge1xuICAgIHRoaXMuZGljID0gbmV3IER5bmFtaWNEaWN0aW9uYXJpZXMoKTtcbiAgICB0aGlzLmRpY19wYXRoID0gZGljX3BhdGg7XG59XG5cbkRpY3Rpb25hcnlMb2FkZXIucHJvdG90eXBlLmxvYWRBcnJheUJ1ZmZlciA9IGZ1bmN0aW9uIChmaWxlLCBjYWxsYmFjaykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkRpY3Rpb25hcnlMb2FkZXIjbG9hZEFycmF5QnVmZmVyIHNob3VsZCBiZSBvdmVyd3JpdGVcIik7XG59O1xuLyoqXG4gKiBMb2FkIGRpY3Rpb25hcnkgZmlsZXNcbiAqIEBwYXJhbSB7RGljdGlvbmFyeUxvYWRlcn5vbkxvYWR9IGxvYWRfY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb24gY2FsbGVkIGFmdGVyIGxvYWRlZFxuICovXG5EaWN0aW9uYXJ5TG9hZGVyLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gKGxvYWRfY2FsbGJhY2spIHtcbiAgICB2YXIgZGljID0gdGhpcy5kaWM7XG4gICAgdmFyIGRpY19wYXRoID0gdGhpcy5kaWNfcGF0aDtcbiAgICB2YXIgbG9hZEFycmF5QnVmZmVyID0gdGhpcy5sb2FkQXJyYXlCdWZmZXI7XG5cbiAgICBhc3luYy5wYXJhbGxlbChbXG4gICAgICAgIC8vIFRyaWVcbiAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBhc3luYy5tYXAoWyBcImJhc2UuZGF0Lmd6XCIsIFwiY2hlY2suZGF0Lmd6XCIgXSwgZnVuY3Rpb24gKGZpbGVuYW1lLCBfY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBsb2FkQXJyYXlCdWZmZXIocGF0aC5qb2luKGRpY19wYXRoLCBmaWxlbmFtZSksIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcikge1xuICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBfY2FsbGJhY2sobnVsbCwgYnVmZmVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIGJ1ZmZlcnMpIHtcbiAgICAgICAgICAgICAgICBpZihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBiYXNlX2J1ZmZlciA9IG5ldyBJbnQzMkFycmF5KGJ1ZmZlcnNbMF0pO1xuICAgICAgICAgICAgICAgIHZhciBjaGVja19idWZmZXIgPSBuZXcgSW50MzJBcnJheShidWZmZXJzWzFdKTtcblxuICAgICAgICAgICAgICAgIGRpYy5sb2FkVHJpZShiYXNlX2J1ZmZlciwgY2hlY2tfYnVmZmVyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICAvLyBUb2tlbiBpbmZvIGRpY3Rpb25hcmllc1xuICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGFzeW5jLm1hcChbIFwidGlkLmRhdC5nelwiLCBcInRpZF9wb3MuZGF0Lmd6XCIsIFwidGlkX21hcC5kYXQuZ3pcIiBdLCBmdW5jdGlvbiAoZmlsZW5hbWUsIF9jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGxvYWRBcnJheUJ1ZmZlcihwYXRoLmpvaW4oZGljX3BhdGgsIGZpbGVuYW1lKSwgZnVuY3Rpb24gKGVyciwgYnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9jYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF9jYWxsYmFjayhudWxsLCBidWZmZXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVyciwgYnVmZmVycykge1xuICAgICAgICAgICAgICAgIGlmKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHRva2VuX2luZm9fYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1swXSk7XG4gICAgICAgICAgICAgICAgdmFyIHBvc19idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzFdKTtcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0X21hcF9idWZmZXIgPSBuZXcgVWludDhBcnJheShidWZmZXJzWzJdKTtcblxuICAgICAgICAgICAgICAgIGRpYy5sb2FkVG9rZW5JbmZvRGljdGlvbmFyaWVzKHRva2VuX2luZm9fYnVmZmVyLCBwb3NfYnVmZmVyLCB0YXJnZXRfbWFwX2J1ZmZlcik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gQ29ubmVjdGlvbiBjb3N0IG1hdHJpeFxuICAgICAgICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGxvYWRBcnJheUJ1ZmZlcihwYXRoLmpvaW4oZGljX3BhdGgsIFwiY2MuZGF0Lmd6XCIpLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgICAgICAgICBpZihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBjY19idWZmZXIgPSBuZXcgSW50MTZBcnJheShidWZmZXIpO1xuICAgICAgICAgICAgICAgIGRpYy5sb2FkQ29ubmVjdGlvbkNvc3RzKGNjX2J1ZmZlcik7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgLy8gVW5rbm93biBkaWN0aW9uYXJpZXNcbiAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBhc3luYy5tYXAoWyBcInVuay5kYXQuZ3pcIiwgXCJ1bmtfcG9zLmRhdC5nelwiLCBcInVua19tYXAuZGF0Lmd6XCIsIFwidW5rX2NoYXIuZGF0Lmd6XCIsIFwidW5rX2NvbXBhdC5kYXQuZ3pcIiwgXCJ1bmtfaW52b2tlLmRhdC5nelwiIF0sIGZ1bmN0aW9uIChmaWxlbmFtZSwgX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgbG9hZEFycmF5QnVmZmVyKHBhdGguam9pbihkaWNfcGF0aCwgZmlsZW5hbWUpLCBmdW5jdGlvbiAoZXJyLCBidWZmZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX2NhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgX2NhbGxiYWNrKG51bGwsIGJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyLCBidWZmZXJzKSB7XG4gICAgICAgICAgICAgICAgaWYoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdW5rX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMF0pO1xuICAgICAgICAgICAgICAgIHZhciB1bmtfcG9zX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMV0pO1xuICAgICAgICAgICAgICAgIHZhciB1bmtfbWFwX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbMl0pO1xuICAgICAgICAgICAgICAgIHZhciBjYXRfbWFwX2J1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcnNbM10pO1xuICAgICAgICAgICAgICAgIHZhciBjb21wYXRfY2F0X21hcF9idWZmZXIgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyc1s0XSk7XG4gICAgICAgICAgICAgICAgdmFyIGludm9rZV9kZWZfYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyc1s1XSk7XG5cbiAgICAgICAgICAgICAgICBkaWMubG9hZFVua25vd25EaWN0aW9uYXJpZXModW5rX2J1ZmZlciwgdW5rX3Bvc19idWZmZXIsIHVua19tYXBfYnVmZmVyLCBjYXRfbWFwX2J1ZmZlciwgY29tcGF0X2NhdF9tYXBfYnVmZmVyLCBpbnZva2VfZGVmX2J1ZmZlcik7XG4gICAgICAgICAgICAgICAgLy8gZGljLmxvYWRVbmtub3duRGljdGlvbmFyaWVzKGNoYXJfYnVmZmVyLCB1bmtfYnVmZmVyKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgXSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICBsb2FkX2NhbGxiYWNrKGVyciwgZGljKTtcbiAgICB9KTtcbn07XG5cblxuLyoqXG4gKiBDYWxsYmFja1xuICogQGNhbGxiYWNrIERpY3Rpb25hcnlMb2FkZXJ+b25Mb2FkXG4gKiBAcGFyYW0ge09iamVjdH0gZXJyIEVycm9yIG9iamVjdFxuICogQHBhcmFtIHtEeW5hbWljRGljdGlvbmFyaWVzfSBkaWMgTG9hZGVkIGRpY3Rpb25hcnlcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpY3Rpb25hcnlMb2FkZXI7XG4iXSwiZmlsZSI6ImxvYWRlci9EaWN0aW9uYXJ5TG9hZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=