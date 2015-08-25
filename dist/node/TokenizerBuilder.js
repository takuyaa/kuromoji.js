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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJUb2tlbml6ZXJCdWlsZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBUb2tlbml6ZXIgPSByZXF1aXJlKFwiLi9Ub2tlbml6ZXIuanNcIik7XG52YXIgRGljdGlvbmFyeUxvYWRlciA9IHJlcXVpcmUoXCIuL2xvYWRlci9EaWN0aW9uYXJ5TG9hZGVyLmpzXCIpO1xuXG5cbi8qKlxuICogVG9rZW5pemVyQnVpbGRlciBjcmVhdGUgVG9rZW5pemVyIGluc3RhbmNlLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbiBKU09OIG9iamVjdCB3aGljaCBoYXZlIGtleS12YWx1ZSBwYWlycyBzZXR0aW5nc1xuICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbi5kaWNQYXRoIERpY3Rpb25hcnkgZGlyZWN0b3J5IHBhdGggKG9yIFVSTCB1c2luZyBpbiBicm93c2VyKVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRva2VuaXplckJ1aWxkZXIob3B0aW9uKSB7XG4gICAgaWYgKG9wdGlvbi5kaWNQYXRoICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5kaWNfcGF0aCA9IG9wdGlvbi5kaWNQYXRoO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGljX3BhdGggPSBcImRpY3QvXCI7XG4gICAgfVxufVxuXG4vKipcbiAqIEJ1aWxkIFRva2VuaXplciBpbnN0YW5jZSBieSBhc3luY2hyb25vdXMgbWFubmVyXG4gKiBAcGFyYW0ge1Rva2VuaXplckJ1aWxkZXJ+b25Mb2FkfSBjYWxsYmFjayBDYWxsYmFjayBmdW5jdGlvblxuICovXG5Ub2tlbml6ZXJCdWlsZGVyLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIHZhciBsb2FkZXIgPSBEaWN0aW9uYXJ5TG9hZGVyLmdldExvYWRlcih0aGlzLmRpY19wYXRoKTtcbiAgICBsb2FkZXIubG9hZChmdW5jdGlvbiAoZXJyLCBkaWMpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyLCBuZXcgVG9rZW5pemVyKGRpYykpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBDYWxsYmFjayB1c2VkIGJ5IGJ1aWxkXG4gKiBAY2FsbGJhY2sgVG9rZW5pemVyQnVpbGRlcn5vbkxvYWRcbiAqIEBwYXJhbSB7T2JqZWN0fSBlcnIgRXJyb3Igb2JqZWN0XG4gKiBAcGFyYW0ge1Rva2VuaXplcn0gdG9rZW5pemVyIFByZXBhcmVkIFRva2VuaXplclxuICovXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFRva2VuaXplckJ1aWxkZXI7XG4iXSwiZmlsZSI6IlRva2VuaXplckJ1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==