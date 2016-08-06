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

var ViterbiBuilder = require("./viterbi/ViterbiBuilder");
var ViterbiSearcher = require("./viterbi/ViterbiSearcher");
var IpadicFormatter = require("./util/IpadicFormatter");

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
    var last_pos = 0;
    if (tokens.length > 0) {
        last_pos = tokens[tokens.length - 1].word_position;
    }

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
            token = this.formatter.formatEntry(node.name, last_pos + node.start_pos, node.type, features);
        } else if (node.type === "UNKNOWN") {
            // Unknown word
            features_line = this.unknown_dictionary.getFeatures(node.name);
            if (features_line == null) {
                features = [];
            } else {
                features = features_line.split(",");
            }
            token = this.formatter.formatUnknownEntry(node.name, last_pos + node.start_pos, node.type, features, node.surface_form);
        } else {
            // TODO User dictionary
            token = this.formatter.formatEntry(node.name, last_pos + node.start_pos, node.type, []);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJUb2tlbml6ZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFZpdGVyYmlCdWlsZGVyID0gcmVxdWlyZShcIi4vdml0ZXJiaS9WaXRlcmJpQnVpbGRlclwiKTtcbnZhciBWaXRlcmJpU2VhcmNoZXIgPSByZXF1aXJlKFwiLi92aXRlcmJpL1ZpdGVyYmlTZWFyY2hlclwiKTtcbnZhciBJcGFkaWNGb3JtYXR0ZXIgPSByZXF1aXJlKFwiLi91dGlsL0lwYWRpY0Zvcm1hdHRlclwiKTtcblxudmFyIFBVTkNUVUFUSU9OID0gL+OAgXzjgIIvO1xuXG4vKipcbiAqIFRva2VuaXplclxuICogQHBhcmFtIHtEeW5hbWljRGljdGlvbmFyaWVzfSBkaWMgRGljdGlvbmFyaWVzIHVzZWQgYnkgdGhpcyB0b2tlbml6ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUb2tlbml6ZXIoZGljKSB7XG4gICAgdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkgPSBkaWMudG9rZW5faW5mb19kaWN0aW9uYXJ5O1xuICAgIHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5ID0gZGljLnVua25vd25fZGljdGlvbmFyeTtcbiAgICB0aGlzLnZpdGVyYmlfYnVpbGRlciA9IG5ldyBWaXRlcmJpQnVpbGRlcihkaWMpO1xuICAgIHRoaXMudml0ZXJiaV9zZWFyY2hlciA9IG5ldyBWaXRlcmJpU2VhcmNoZXIoZGljLmNvbm5lY3Rpb25fY29zdHMpO1xuICAgIHRoaXMuZm9ybWF0dGVyID0gbmV3IElwYWRpY0Zvcm1hdHRlcigpOyAgLy8gVE9ETyBPdGhlciBkaWN0aW9uYXJpZXNcbn1cblxuLyoqXG4gKiBTcGxpdCBpbnRvIHNlbnRlbmNlIGJ5IHB1bmN0dWF0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXQgSW5wdXQgdGV4dFxuICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBTZW50ZW5jZXMgZW5kIHdpdGggcHVuY3R1YXRpb25cbiAqL1xuVG9rZW5pemVyLnNwbGl0QnlQdW5jdHVhdGlvbiA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHZhciBzZW50ZW5jZXMgPSBbXTtcbiAgICB2YXIgdGFpbCA9IGlucHV0O1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGlmICh0YWlsID09PSBcIlwiKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5kZXggPSB0YWlsLnNlYXJjaChQVU5DVFVBVElPTik7XG4gICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICAgIHNlbnRlbmNlcy5wdXNoKHRhaWwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2VudGVuY2VzLnB1c2godGFpbC5zdWJzdHJpbmcoMCwgaW5kZXggKyAxKSk7XG4gICAgICAgIHRhaWwgPSB0YWlsLnN1YnN0cmluZyhpbmRleCArIDEpO1xuICAgIH1cbiAgICByZXR1cm4gc2VudGVuY2VzO1xufTtcblxuLyoqXG4gKiBUb2tlbml6ZSB0ZXh0XG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBJbnB1dCB0ZXh0IHRvIGFuYWx5emVcbiAqIEByZXR1cm5zIHtBcnJheX0gVG9rZW5zXG4gKi9cblRva2VuaXplci5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIHZhciBzZW50ZW5jZXMgPSBUb2tlbml6ZXIuc3BsaXRCeVB1bmN0dWF0aW9uKHRleHQpO1xuICAgIHZhciB0b2tlbnMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbnRlbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2VudGVuY2UgPSBzZW50ZW5jZXNbaV07XG4gICAgICAgIHRoaXMudG9rZW5pemVGb3JTZW50ZW5jZShzZW50ZW5jZSwgdG9rZW5zKTtcbiAgICB9XG4gICAgcmV0dXJuIHRva2Vucztcbn07XG5cblRva2VuaXplci5wcm90b3R5cGUudG9rZW5pemVGb3JTZW50ZW5jZSA9IGZ1bmN0aW9uIChzZW50ZW5jZSwgdG9rZW5zKSB7XG4gICAgaWYgKHRva2VucyA9PSBudWxsKSB7XG4gICAgICAgIHRva2VucyA9IFtdO1xuICAgIH1cbiAgICB2YXIgbGF0dGljZSA9IHRoaXMuZ2V0TGF0dGljZShzZW50ZW5jZSk7XG4gICAgdmFyIGJlc3RfcGF0aCA9IHRoaXMudml0ZXJiaV9zZWFyY2hlci5zZWFyY2gobGF0dGljZSk7XG4gICAgdmFyIGxhc3RfcG9zID0gMDtcbiAgICBpZiAodG9rZW5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgbGFzdF9wb3MgPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdLndvcmRfcG9zaXRpb247XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBiZXN0X3BhdGgubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBiZXN0X3BhdGhbal07XG5cbiAgICAgICAgdmFyIHRva2VuLCBmZWF0dXJlcywgZmVhdHVyZXNfbGluZTtcbiAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gXCJLTk9XTlwiKSB7XG4gICAgICAgICAgICBmZWF0dXJlc19saW5lID0gdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkuZ2V0RmVhdHVyZXMobm9kZS5uYW1lKTtcbiAgICAgICAgICAgIGlmIChmZWF0dXJlc19saW5lID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcyA9IFtdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcyA9IGZlYXR1cmVzX2xpbmUuc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9rZW4gPSB0aGlzLmZvcm1hdHRlci5mb3JtYXRFbnRyeShub2RlLm5hbWUsIGxhc3RfcG9zICsgbm9kZS5zdGFydF9wb3MsIG5vZGUudHlwZSwgZmVhdHVyZXMpO1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gXCJVTktOT1dOXCIpIHtcbiAgICAgICAgICAgIC8vIFVua25vd24gd29yZFxuICAgICAgICAgICAgZmVhdHVyZXNfbGluZSA9IHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5LmdldEZlYXR1cmVzKG5vZGUubmFtZSk7XG4gICAgICAgICAgICBpZiAoZmVhdHVyZXNfbGluZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMgPSBbXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMgPSBmZWF0dXJlc19saW5lLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRva2VuID0gdGhpcy5mb3JtYXR0ZXIuZm9ybWF0VW5rbm93bkVudHJ5KG5vZGUubmFtZSwgbGFzdF9wb3MgKyBub2RlLnN0YXJ0X3Bvcywgbm9kZS50eXBlLCBmZWF0dXJlcywgbm9kZS5zdXJmYWNlX2Zvcm0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVE9ETyBVc2VyIGRpY3Rpb25hcnlcbiAgICAgICAgICAgIHRva2VuID0gdGhpcy5mb3JtYXR0ZXIuZm9ybWF0RW50cnkobm9kZS5uYW1lLCBsYXN0X3BvcyArIG5vZGUuc3RhcnRfcG9zLCBub2RlLnR5cGUsIFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdG9rZW5zO1xufTtcblxuLyoqXG4gKiBCdWlsZCB3b3JkIGxhdHRpY2VcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IElucHV0IHRleHQgdG8gYW5hbHl6ZVxuICogQHJldHVybnMge1ZpdGVyYmlMYXR0aWNlfSBXb3JkIGxhdHRpY2VcbiAqL1xuVG9rZW5pemVyLnByb3RvdHlwZS5nZXRMYXR0aWNlID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICByZXR1cm4gdGhpcy52aXRlcmJpX2J1aWxkZXIuYnVpbGQodGV4dCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRva2VuaXplcjtcbiJdLCJmaWxlIjoiVG9rZW5pemVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
