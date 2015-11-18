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
var DictionaryLoader = require("./loader/NodeDictionaryLoader.js");


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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJUb2tlbml6ZXJCdWlsZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBUb2tlbml6ZXIgPSByZXF1aXJlKFwiLi9Ub2tlbml6ZXIuanNcIik7XG52YXIgRGljdGlvbmFyeUxvYWRlciA9IHJlcXVpcmUoXCIuL2xvYWRlci9Ob2RlRGljdGlvbmFyeUxvYWRlci5qc1wiKTtcblxuXG4vKipcbiAqIFRva2VuaXplckJ1aWxkZXIgY3JlYXRlIFRva2VuaXplciBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb24gSlNPTiBvYmplY3Qgd2hpY2ggaGF2ZSBrZXktdmFsdWUgcGFpcnMgc2V0dGluZ3NcbiAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb24uZGljUGF0aCBEaWN0aW9uYXJ5IGRpcmVjdG9yeSBwYXRoIChvciBVUkwgdXNpbmcgaW4gYnJvd3NlcilcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUb2tlbml6ZXJCdWlsZGVyKG9wdGlvbikge1xuICAgIGlmIChvcHRpb24uZGljUGF0aCAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuZGljX3BhdGggPSBvcHRpb24uZGljUGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmRpY19wYXRoID0gXCJkaWN0L1wiO1xuICAgIH1cbn1cblxuLyoqXG4gKiBCdWlsZCBUb2tlbml6ZXIgaW5zdGFuY2UgYnkgYXN5bmNocm9ub3VzIG1hbm5lclxuICogQHBhcmFtIHtUb2tlbml6ZXJCdWlsZGVyfm9uTG9hZH0gY2FsbGJhY2sgQ2FsbGJhY2sgZnVuY3Rpb25cbiAqL1xuVG9rZW5pemVyQnVpbGRlci5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgbG9hZGVyID0gbmV3IERpY3Rpb25hcnlMb2FkZXIodGhpcy5kaWNfcGF0aCk7XG4gICAgbG9hZGVyLmxvYWQoZnVuY3Rpb24gKGVyciwgZGljKSB7XG4gICAgICAgIGNhbGxiYWNrKGVyciwgbmV3IFRva2VuaXplcihkaWMpKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FsbGJhY2sgdXNlZCBieSBidWlsZFxuICogQGNhbGxiYWNrIFRva2VuaXplckJ1aWxkZXJ+b25Mb2FkXG4gKiBAcGFyYW0ge09iamVjdH0gZXJyIEVycm9yIG9iamVjdFxuICogQHBhcmFtIHtUb2tlbml6ZXJ9IHRva2VuaXplciBQcmVwYXJlZCBUb2tlbml6ZXJcbiAqL1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBUb2tlbml6ZXJCdWlsZGVyO1xuIl0sImZpbGUiOiJUb2tlbml6ZXJCdWlsZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=