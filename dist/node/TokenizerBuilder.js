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

var Tokenizer = require("./Tokenizer.js");
var DictionaryLoader = require("./loader/DictionaryLoader.js");


/**
 * TokenizerBuilder create Tokenizer instance.
 * @param {Object} option JSON object which have key-value pairs settings
 * @param {string} option.dicPath Dictionary directory path (or URL using in browser)
 * @constructor
 */
function TokenizerBuilder(option) {
    if (option.dicPath != null) {
        this.dic_path = option.dicPath;
    } else {
        this.dic_path = "dict/";
    }
}

/**
 * Build Tokenizer instance by asynchronous manner
 * @param {TokenizerBuilder~onLoad} callback Callback function
 */
TokenizerBuilder.prototype.build = function (callback) {
    var loader = DictionaryLoader.getLoader(this.dic_path);
    loader.load(function (err, dic) {
        callback(err, new Tokenizer(dic));
    });
};

/**
 * Callback used by build
 * @callback TokenizerBuilder~onLoad
 * @param {Object} err Error object
 * @param {Tokenizer} tokenizer Prepared Tokenizer
 */



module.exports = TokenizerBuilder;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9rZW5pemVyQnVpbGRlci5qcyIsIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzIjpbIlRva2VuaXplckJ1aWxkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFRva2VuaXplciA9IHJlcXVpcmUoXCIuL1Rva2VuaXplci5qc1wiKTtcbnZhciBEaWN0aW9uYXJ5TG9hZGVyID0gcmVxdWlyZShcIi4vbG9hZGVyL0RpY3Rpb25hcnlMb2FkZXIuanNcIik7XG5cblxuLyoqXG4gKiBUb2tlbml6ZXJCdWlsZGVyIGNyZWF0ZSBUb2tlbml6ZXIgaW5zdGFuY2UuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uIEpTT04gb2JqZWN0IHdoaWNoIGhhdmUga2V5LXZhbHVlIHBhaXJzIHNldHRpbmdzXG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9uLmRpY1BhdGggRGljdGlvbmFyeSBkaXJlY3RvcnkgcGF0aCAob3IgVVJMIHVzaW5nIGluIGJyb3dzZXIpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVG9rZW5pemVyQnVpbGRlcihvcHRpb24pIHtcbiAgICBpZiAob3B0aW9uLmRpY1BhdGggIT0gbnVsbCkge1xuICAgICAgICB0aGlzLmRpY19wYXRoID0gb3B0aW9uLmRpY1BhdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5kaWNfcGF0aCA9IFwiZGljdC9cIjtcbiAgICB9XG59XG5cbi8qKlxuICogQnVpbGQgVG9rZW5pemVyIGluc3RhbmNlIGJ5IGFzeW5jaHJvbm91cyBtYW5uZXJcbiAqIEBwYXJhbSB7VG9rZW5pemVyQnVpbGRlcn5vbkxvYWR9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXG4gKi9cblRva2VuaXplckJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIGxvYWRlciA9IERpY3Rpb25hcnlMb2FkZXIuZ2V0TG9hZGVyKHRoaXMuZGljX3BhdGgpO1xuICAgIGxvYWRlci5sb2FkKGZ1bmN0aW9uIChlcnIsIGRpYykge1xuICAgICAgICBjYWxsYmFjayhlcnIsIG5ldyBUb2tlbml6ZXIoZGljKSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENhbGxiYWNrIHVzZWQgYnkgYnVpbGRcbiAqIEBjYWxsYmFjayBUb2tlbml6ZXJCdWlsZGVyfm9uTG9hZFxuICogQHBhcmFtIHtPYmplY3R9IGVyciBFcnJvciBvYmplY3RcbiAqIEBwYXJhbSB7VG9rZW5pemVyfSB0b2tlbml6ZXIgUHJlcGFyZWQgVG9rZW5pemVyXG4gKi9cblxuXG5cbm1vZHVsZS5leHBvcnRzID0gVG9rZW5pemVyQnVpbGRlcjtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==