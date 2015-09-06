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

var ViterbiBuilder = require("./viterbi/ViterbiBuilder.js");
var ViterbiSearcher = require("./viterbi/ViterbiSearcher.js");
var IpadicFormatter = require("./util/IpadicFormatter.js");

var PUNCTUATION = /、|。/;


/**
 * Tokenizer
 * @param {DynamicDictionaries} dic Dictionaries used by this tokenizer
 * @constructor
 */
function Tokenizer(dic) {
    this.token_info_dictionary = dic.token_info_dictionary;
    this.unknown_dictionary = dic.unknown_dictionary;
    this.viterbi_builder = new ViterbiBuilder(dic);
    this.viterbi_searcher = new ViterbiSearcher(dic.connection_costs);
    this.formatter = new IpadicFormatter();  // TODO Other dictionaries
}

/**
 * Split into sentence by punctuation
 * @param {string} input Input text
 * @returns {Array.<string>} Sentences end with punctuation
 */
Tokenizer.splitByPunctuation = function (input) {
    var sentences = [];
    var tail = input;
    while (true) {
        if (tail === "") {
            break;
        }
        var index = tail.search(PUNCTUATION);
        if (index < 0) {
            sentences.push(tail);
            break;
        }
        sentences.push(tail.substring(0, index + 1));
        tail = tail.substring(index + 1);
    }
    return sentences;
};

/**
 * Tokenize text
 * @param {string} text Input text to analyze
 * @returns {Array} Tokens
 */
Tokenizer.prototype.tokenize = function (text) {
    var sentences = Tokenizer.splitByPunctuation(text);
    var tokens = [];
    for (var i = 0; i < sentences.length; i++) {
        var sentence = sentences[i];
        this.tokenizeForSentence(sentence, tokens);
    }
    return tokens;
};

Tokenizer.prototype.tokenizeForSentence = function (sentence, tokens) {
    if (tokens == null) {
        tokens = [];
    }
    var lattice = this.getLattice(sentence);
    var best_path = this.viterbi_searcher.search(lattice);

    for (var j = 0; j < best_path.length; j++) {
        var node = best_path[j];

        var token, features, features_line;
        if (node.type === "KNOWN") {
            features_line = this.token_info_dictionary.getFeatures(node.name);
            if (features_line == null) {
                features = [];
            } else {
                features = features_line.split(",");
            }
            token = this.formatter.formatEntry(node.name, node.start_pos, node.type, features);
        } else if (node.type === "UNKNOWN") {
            // Unknown word
            features_line = this.unknown_dictionary.getFeatures(node.name);
            if (features_line == null) {
                features = [];
            } else {
                features = features_line.split(",");
            }
            token = this.formatter.formatUnknownEntry(node.name, node.start_pos, node.type, features, node.surface_form);
        } else {
            // TODO User dictionary
            token = this.formatter.formatEntry(node.name, node.start_pos, node.type, []);
        }

        tokens.push(token);
    }

    return tokens;
};

/**
 * Build word lattice
 * @param {string} text Input text to analyze
 * @returns {ViterbiLattice} Word lattice
 */
Tokenizer.prototype.getLattice = function (text) {
    return this.viterbi_builder.build(text);
};


module.exports = Tokenizer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJUb2tlbml6ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFZpdGVyYmlCdWlsZGVyID0gcmVxdWlyZShcIi4vdml0ZXJiaS9WaXRlcmJpQnVpbGRlci5qc1wiKTtcbnZhciBWaXRlcmJpU2VhcmNoZXIgPSByZXF1aXJlKFwiLi92aXRlcmJpL1ZpdGVyYmlTZWFyY2hlci5qc1wiKTtcbnZhciBJcGFkaWNGb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi91dGlsL0lwYWRpY0Zvcm1hdHRlci5qc1wiKTtcblxudmFyIFBVTkNUVUFUSU9OID0gL+OAgXzjgIIvO1xuXG5cbi8qKlxuICogVG9rZW5pemVyXG4gKiBAcGFyYW0ge0R5bmFtaWNEaWN0aW9uYXJpZXN9IGRpYyBEaWN0aW9uYXJpZXMgdXNlZCBieSB0aGlzIHRva2VuaXplclxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRva2VuaXplcihkaWMpIHtcbiAgICB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeSA9IGRpYy50b2tlbl9pbmZvX2RpY3Rpb25hcnk7XG4gICAgdGhpcy51bmtub3duX2RpY3Rpb25hcnkgPSBkaWMudW5rbm93bl9kaWN0aW9uYXJ5O1xuICAgIHRoaXMudml0ZXJiaV9idWlsZGVyID0gbmV3IFZpdGVyYmlCdWlsZGVyKGRpYyk7XG4gICAgdGhpcy52aXRlcmJpX3NlYXJjaGVyID0gbmV3IFZpdGVyYmlTZWFyY2hlcihkaWMuY29ubmVjdGlvbl9jb3N0cyk7XG4gICAgdGhpcy5mb3JtYXR0ZXIgPSBuZXcgSXBhZGljRm9ybWF0dGVyKCk7ICAvLyBUT0RPIE90aGVyIGRpY3Rpb25hcmllc1xufVxuXG4vKipcbiAqIFNwbGl0IGludG8gc2VudGVuY2UgYnkgcHVuY3R1YXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSBpbnB1dCBJbnB1dCB0ZXh0XG4gKiBAcmV0dXJucyB7QXJyYXkuPHN0cmluZz59IFNlbnRlbmNlcyBlbmQgd2l0aCBwdW5jdHVhdGlvblxuICovXG5Ub2tlbml6ZXIuc3BsaXRCeVB1bmN0dWF0aW9uID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgdmFyIHNlbnRlbmNlcyA9IFtdO1xuICAgIHZhciB0YWlsID0gaW5wdXQ7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgaWYgKHRhaWwgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpbmRleCA9IHRhaWwuc2VhcmNoKFBVTkNUVUFUSU9OKTtcbiAgICAgICAgaWYgKGluZGV4IDwgMCkge1xuICAgICAgICAgICAgc2VudGVuY2VzLnB1c2godGFpbCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBzZW50ZW5jZXMucHVzaCh0YWlsLnN1YnN0cmluZygwLCBpbmRleCArIDEpKTtcbiAgICAgICAgdGFpbCA9IHRhaWwuc3Vic3RyaW5nKGluZGV4ICsgMSk7XG4gICAgfVxuICAgIHJldHVybiBzZW50ZW5jZXM7XG59O1xuXG4vKipcbiAqIFRva2VuaXplIHRleHRcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IElucHV0IHRleHQgdG8gYW5hbHl6ZVxuICogQHJldHVybnMge0FycmF5fSBUb2tlbnNcbiAqL1xuVG9rZW5pemVyLnByb3RvdHlwZS50b2tlbml6ZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdmFyIHNlbnRlbmNlcyA9IFRva2VuaXplci5zcGxpdEJ5UHVuY3R1YXRpb24odGV4dCk7XG4gICAgdmFyIHRva2VucyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VudGVuY2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBzZW50ZW5jZSA9IHNlbnRlbmNlc1tpXTtcbiAgICAgICAgdGhpcy50b2tlbml6ZUZvclNlbnRlbmNlKHNlbnRlbmNlLCB0b2tlbnMpO1xuICAgIH1cbiAgICByZXR1cm4gdG9rZW5zO1xufTtcblxuVG9rZW5pemVyLnByb3RvdHlwZS50b2tlbml6ZUZvclNlbnRlbmNlID0gZnVuY3Rpb24gKHNlbnRlbmNlLCB0b2tlbnMpIHtcbiAgICBpZiAodG9rZW5zID09IG51bGwpIHtcbiAgICAgICAgdG9rZW5zID0gW107XG4gICAgfVxuICAgIHZhciBsYXR0aWNlID0gdGhpcy5nZXRMYXR0aWNlKHNlbnRlbmNlKTtcbiAgICB2YXIgYmVzdF9wYXRoID0gdGhpcy52aXRlcmJpX3NlYXJjaGVyLnNlYXJjaChsYXR0aWNlKTtcblxuICAgIGZvciAodmFyIGogPSAwOyBqIDwgYmVzdF9wYXRoLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBub2RlID0gYmVzdF9wYXRoW2pdO1xuXG4gICAgICAgIHZhciB0b2tlbiwgZmVhdHVyZXMsIGZlYXR1cmVzX2xpbmU7XG4gICAgICAgIGlmIChub2RlLnR5cGUgPT09IFwiS05PV05cIikge1xuICAgICAgICAgICAgZmVhdHVyZXNfbGluZSA9IHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LmdldEZlYXR1cmVzKG5vZGUubmFtZSk7XG4gICAgICAgICAgICBpZiAoZmVhdHVyZXNfbGluZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMgPSBbXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMgPSBmZWF0dXJlc19saW5lLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRva2VuID0gdGhpcy5mb3JtYXR0ZXIuZm9ybWF0RW50cnkobm9kZS5uYW1lLCBub2RlLnN0YXJ0X3Bvcywgbm9kZS50eXBlLCBmZWF0dXJlcyk7XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS50eXBlID09PSBcIlVOS05PV05cIikge1xuICAgICAgICAgICAgLy8gVW5rbm93biB3b3JkXG4gICAgICAgICAgICBmZWF0dXJlc19saW5lID0gdGhpcy51bmtub3duX2RpY3Rpb25hcnkuZ2V0RmVhdHVyZXMobm9kZS5uYW1lKTtcbiAgICAgICAgICAgIGlmIChmZWF0dXJlc19saW5lID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcyA9IFtdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcyA9IGZlYXR1cmVzX2xpbmUuc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9rZW4gPSB0aGlzLmZvcm1hdHRlci5mb3JtYXRVbmtub3duRW50cnkobm9kZS5uYW1lLCBub2RlLnN0YXJ0X3Bvcywgbm9kZS50eXBlLCBmZWF0dXJlcywgbm9kZS5zdXJmYWNlX2Zvcm0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyBVc2VyIGRpY3Rpb25hcnlcbiAgICAgICAgICAgIHRva2VuID0gdGhpcy5mb3JtYXR0ZXIuZm9ybWF0RW50cnkobm9kZS5uYW1lLCBub2RlLnN0YXJ0X3Bvcywgbm9kZS50eXBlLCBbXSk7XG4gICAgICAgIH1cblxuICAgICAgICB0b2tlbnMucHVzaCh0b2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRva2Vucztcbn07XG5cbi8qKlxuICogQnVpbGQgd29yZCBsYXR0aWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBJbnB1dCB0ZXh0IHRvIGFuYWx5emVcbiAqIEByZXR1cm5zIHtWaXRlcmJpTGF0dGljZX0gV29yZCBsYXR0aWNlXG4gKi9cblRva2VuaXplci5wcm90b3R5cGUuZ2V0TGF0dGljZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgcmV0dXJuIHRoaXMudml0ZXJiaV9idWlsZGVyLmJ1aWxkKHRleHQpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFRva2VuaXplcjtcbiJdLCJmaWxlIjoiVG9rZW5pemVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=