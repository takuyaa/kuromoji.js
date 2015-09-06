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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9rZW5pemVyLmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsiVG9rZW5pemVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBWaXRlcmJpQnVpbGRlciA9IHJlcXVpcmUoXCIuL3ZpdGVyYmkvVml0ZXJiaUJ1aWxkZXIuanNcIik7XG52YXIgVml0ZXJiaVNlYXJjaGVyID0gcmVxdWlyZShcIi4vdml0ZXJiaS9WaXRlcmJpU2VhcmNoZXIuanNcIik7XG52YXIgSXBhZGljRm9ybWF0dGVyID0gcmVxdWlyZShcIi4vdXRpbC9JcGFkaWNGb3JtYXR0ZXIuanNcIik7XG5cbnZhciBQVU5DVFVBVElPTiA9IC/jgIF844CCLztcblxuXG4vKipcbiAqIFRva2VuaXplclxuICogQHBhcmFtIHtEeW5hbWljRGljdGlvbmFyaWVzfSBkaWMgRGljdGlvbmFyaWVzIHVzZWQgYnkgdGhpcyB0b2tlbml6ZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUb2tlbml6ZXIoZGljKSB7XG4gICAgdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkgPSBkaWMudG9rZW5faW5mb19kaWN0aW9uYXJ5O1xuICAgIHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5ID0gZGljLnVua25vd25fZGljdGlvbmFyeTtcbiAgICB0aGlzLnZpdGVyYmlfYnVpbGRlciA9IG5ldyBWaXRlcmJpQnVpbGRlcihkaWMpO1xuICAgIHRoaXMudml0ZXJiaV9zZWFyY2hlciA9IG5ldyBWaXRlcmJpU2VhcmNoZXIoZGljLmNvbm5lY3Rpb25fY29zdHMpO1xuICAgIHRoaXMuZm9ybWF0dGVyID0gbmV3IElwYWRpY0Zvcm1hdHRlcigpOyAgLy8gVE9ETyBPdGhlciBkaWN0aW9uYXJpZXNcbn1cblxuLyoqXG4gKiBTcGxpdCBpbnRvIHNlbnRlbmNlIGJ5IHB1bmN0dWF0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gaW5wdXQgSW5wdXQgdGV4dFxuICogQHJldHVybnMge0FycmF5LjxzdHJpbmc+fSBTZW50ZW5jZXMgZW5kIHdpdGggcHVuY3R1YXRpb25cbiAqL1xuVG9rZW5pemVyLnNwbGl0QnlQdW5jdHVhdGlvbiA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHZhciBzZW50ZW5jZXMgPSBbXTtcbiAgICB2YXIgdGFpbCA9IGlucHV0O1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGlmICh0YWlsID09PSBcIlwiKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5kZXggPSB0YWlsLnNlYXJjaChQVU5DVFVBVElPTik7XG4gICAgICAgIGlmIChpbmRleCA8IDApIHtcbiAgICAgICAgICAgIHNlbnRlbmNlcy5wdXNoKHRhaWwpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgc2VudGVuY2VzLnB1c2godGFpbC5zdWJzdHJpbmcoMCwgaW5kZXggKyAxKSk7XG4gICAgICAgIHRhaWwgPSB0YWlsLnN1YnN0cmluZyhpbmRleCArIDEpO1xuICAgIH1cbiAgICByZXR1cm4gc2VudGVuY2VzO1xufTtcblxuLyoqXG4gKiBUb2tlbml6ZSB0ZXh0XG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBJbnB1dCB0ZXh0IHRvIGFuYWx5emVcbiAqIEByZXR1cm5zIHtBcnJheX0gVG9rZW5zXG4gKi9cblRva2VuaXplci5wcm90b3R5cGUudG9rZW5pemUgPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIHZhciBzZW50ZW5jZXMgPSBUb2tlbml6ZXIuc3BsaXRCeVB1bmN0dWF0aW9uKHRleHQpO1xuICAgIHZhciB0b2tlbnMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbnRlbmNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgc2VudGVuY2UgPSBzZW50ZW5jZXNbaV07XG4gICAgICAgIHRoaXMudG9rZW5pemVGb3JTZW50ZW5jZShzZW50ZW5jZSwgdG9rZW5zKTtcbiAgICB9XG4gICAgcmV0dXJuIHRva2Vucztcbn07XG5cblRva2VuaXplci5wcm90b3R5cGUudG9rZW5pemVGb3JTZW50ZW5jZSA9IGZ1bmN0aW9uIChzZW50ZW5jZSwgdG9rZW5zKSB7XG4gICAgaWYgKHRva2VucyA9PSBudWxsKSB7XG4gICAgICAgIHRva2VucyA9IFtdO1xuICAgIH1cbiAgICB2YXIgbGF0dGljZSA9IHRoaXMuZ2V0TGF0dGljZShzZW50ZW5jZSk7XG4gICAgdmFyIGJlc3RfcGF0aCA9IHRoaXMudml0ZXJiaV9zZWFyY2hlci5zZWFyY2gobGF0dGljZSk7XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGJlc3RfcGF0aC5sZW5ndGg7IGorKykge1xuICAgICAgICB2YXIgbm9kZSA9IGJlc3RfcGF0aFtqXTtcblxuICAgICAgICB2YXIgdG9rZW4sIGZlYXR1cmVzLCBmZWF0dXJlc19saW5lO1xuICAgICAgICBpZiAobm9kZS50eXBlID09PSBcIktOT1dOXCIpIHtcbiAgICAgICAgICAgIGZlYXR1cmVzX2xpbmUgPSB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeS5nZXRGZWF0dXJlcyhub2RlLm5hbWUpO1xuICAgICAgICAgICAgaWYgKGZlYXR1cmVzX2xpbmUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZlYXR1cmVzID0gW107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZlYXR1cmVzID0gZmVhdHVyZXNfbGluZS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b2tlbiA9IHRoaXMuZm9ybWF0dGVyLmZvcm1hdEVudHJ5KG5vZGUubmFtZSwgbm9kZS5zdGFydF9wb3MsIG5vZGUudHlwZSwgZmVhdHVyZXMpO1xuICAgICAgICB9IGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gXCJVTktOT1dOXCIpIHtcbiAgICAgICAgICAgIC8vIFVua25vd24gd29yZFxuICAgICAgICAgICAgZmVhdHVyZXNfbGluZSA9IHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5LmdldEZlYXR1cmVzKG5vZGUubmFtZSk7XG4gICAgICAgICAgICBpZiAoZmVhdHVyZXNfbGluZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMgPSBbXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMgPSBmZWF0dXJlc19saW5lLnNwbGl0KFwiLFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRva2VuID0gdGhpcy5mb3JtYXR0ZXIuZm9ybWF0VW5rbm93bkVudHJ5KG5vZGUubmFtZSwgbm9kZS5zdGFydF9wb3MsIG5vZGUudHlwZSwgZmVhdHVyZXMsIG5vZGUuc3VyZmFjZV9mb3JtKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRPRE8gVXNlciBkaWN0aW9uYXJ5XG4gICAgICAgICAgICB0b2tlbiA9IHRoaXMuZm9ybWF0dGVyLmZvcm1hdEVudHJ5KG5vZGUubmFtZSwgbm9kZS5zdGFydF9wb3MsIG5vZGUudHlwZSwgW10pO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9rZW5zLnB1c2godG9rZW4pO1xuICAgIH1cblxuICAgIHJldHVybiB0b2tlbnM7XG59O1xuXG4vKipcbiAqIEJ1aWxkIHdvcmQgbGF0dGljZVxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgSW5wdXQgdGV4dCB0byBhbmFseXplXG4gKiBAcmV0dXJucyB7Vml0ZXJiaUxhdHRpY2V9IFdvcmQgbGF0dGljZVxuICovXG5Ub2tlbml6ZXIucHJvdG90eXBlLmdldExhdHRpY2UgPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIHJldHVybiB0aGlzLnZpdGVyYmlfYnVpbGRlci5idWlsZCh0ZXh0KTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBUb2tlbml6ZXI7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=