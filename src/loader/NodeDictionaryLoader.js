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
