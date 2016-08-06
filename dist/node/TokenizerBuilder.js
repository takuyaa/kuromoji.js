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

var Tokenizer = require("./Tokenizer");
var DictionaryLoader = require("./loader/NodeDictionaryLoader");

/**
 * TokenizerBuilder create Tokenizer instance.
 * @param {Object} option JSON object which have key-value pairs settings
 * @param {string} option.dicPath Dictionary directory path (or URL using in browser)
 * @constructor
 */
function TokenizerBuilder(option) {
    if (option.dicPath == null) {
        this.dic_path = "dict/";
    } else {
        this.dic_path = option.dicPath;
    }
}

/**
 * Build Tokenizer instance by asynchronous manner
 * @param {TokenizerBuilder~onLoad} callback Callback function
 */
TokenizerBuilder.prototype.build = function (callback) {
    var loader = new DictionaryLoader(this.dic_path);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJUb2tlbml6ZXJCdWlsZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBUb2tlbml6ZXIgPSByZXF1aXJlKFwiLi9Ub2tlbml6ZXJcIik7XG52YXIgRGljdGlvbmFyeUxvYWRlciA9IHJlcXVpcmUoXCIuL2xvYWRlci9Ob2RlRGljdGlvbmFyeUxvYWRlclwiKTtcblxuLyoqXG4gKiBUb2tlbml6ZXJCdWlsZGVyIGNyZWF0ZSBUb2tlbml6ZXIgaW5zdGFuY2UuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uIEpTT04gb2JqZWN0IHdoaWNoIGhhdmUga2V5LXZhbHVlIHBhaXJzIHNldHRpbmdzXG4gKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9uLmRpY1BhdGggRGljdGlvbmFyeSBkaXJlY3RvcnkgcGF0aCAob3IgVVJMIHVzaW5nIGluIGJyb3dzZXIpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVG9rZW5pemVyQnVpbGRlcihvcHRpb24pIHtcbiAgICBpZiAob3B0aW9uLmRpY1BhdGggPT0gbnVsbCkge1xuICAgICAgICB0aGlzLmRpY19wYXRoID0gXCJkaWN0L1wiO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGljX3BhdGggPSBvcHRpb24uZGljUGF0aDtcbiAgICB9XG59XG5cbi8qKlxuICogQnVpbGQgVG9rZW5pemVyIGluc3RhbmNlIGJ5IGFzeW5jaHJvbm91cyBtYW5uZXJcbiAqIEBwYXJhbSB7VG9rZW5pemVyQnVpbGRlcn5vbkxvYWR9IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uXG4gKi9cblRva2VuaXplckJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdmFyIGxvYWRlciA9IG5ldyBEaWN0aW9uYXJ5TG9hZGVyKHRoaXMuZGljX3BhdGgpO1xuICAgIGxvYWRlci5sb2FkKGZ1bmN0aW9uIChlcnIsIGRpYykge1xuICAgICAgICBjYWxsYmFjayhlcnIsIG5ldyBUb2tlbml6ZXIoZGljKSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENhbGxiYWNrIHVzZWQgYnkgYnVpbGRcbiAqIEBjYWxsYmFjayBUb2tlbml6ZXJCdWlsZGVyfm9uTG9hZFxuICogQHBhcmFtIHtPYmplY3R9IGVyciBFcnJvciBvYmplY3RcbiAqIEBwYXJhbSB7VG9rZW5pemVyfSB0b2tlbml6ZXIgUHJlcGFyZWQgVG9rZW5pemVyXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBUb2tlbml6ZXJCdWlsZGVyO1xuIl0sImZpbGUiOiJUb2tlbml6ZXJCdWlsZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
