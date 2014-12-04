/*
 * Copyright Copyright 2014 Takuya Asano
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9rZW5pemVyLmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsiVG9rZW5pemVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgVml0ZXJiaUJ1aWxkZXIgPSByZXF1aXJlKFwiLi92aXRlcmJpL1ZpdGVyYmlCdWlsZGVyLmpzXCIpO1xudmFyIFZpdGVyYmlTZWFyY2hlciA9IHJlcXVpcmUoXCIuL3ZpdGVyYmkvVml0ZXJiaVNlYXJjaGVyLmpzXCIpO1xudmFyIElwYWRpY0Zvcm1hdHRlciA9IHJlcXVpcmUoXCIuL3V0aWwvSXBhZGljRm9ybWF0dGVyLmpzXCIpO1xuXG52YXIgUFVOQ1RVQVRJT04gPSAv44CBfOOAgi87XG5cblxuLyoqXG4gKiBUb2tlbml6ZXJcbiAqIEBwYXJhbSB7RHluYW1pY0RpY3Rpb25hcmllc30gZGljIERpY3Rpb25hcmllcyB1c2VkIGJ5IHRoaXMgdG9rZW5pemVyXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVG9rZW5pemVyKGRpYykge1xuICAgIHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5ID0gZGljLnRva2VuX2luZm9fZGljdGlvbmFyeTtcbiAgICB0aGlzLnVua25vd25fZGljdGlvbmFyeSA9IGRpYy51bmtub3duX2RpY3Rpb25hcnk7XG4gICAgdGhpcy52aXRlcmJpX2J1aWxkZXIgPSBuZXcgVml0ZXJiaUJ1aWxkZXIoZGljKTtcbiAgICB0aGlzLnZpdGVyYmlfc2VhcmNoZXIgPSBuZXcgVml0ZXJiaVNlYXJjaGVyKGRpYy5jb25uZWN0aW9uX2Nvc3RzKTtcbiAgICB0aGlzLmZvcm1hdHRlciA9IG5ldyBJcGFkaWNGb3JtYXR0ZXIoKTsgIC8vIFRPRE8gT3RoZXIgZGljdGlvbmFyaWVzXG59XG5cbi8qKlxuICogU3BsaXQgaW50byBzZW50ZW5jZSBieSBwdW5jdHVhdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IGlucHV0IElucHV0IHRleHRcbiAqIEByZXR1cm5zIHtBcnJheS48c3RyaW5nPn0gU2VudGVuY2VzIGVuZCB3aXRoIHB1bmN0dWF0aW9uXG4gKi9cblRva2VuaXplci5zcGxpdEJ5UHVuY3R1YXRpb24gPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICB2YXIgc2VudGVuY2VzID0gW107XG4gICAgdmFyIHRhaWwgPSBpbnB1dDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAodGFpbCA9PT0gXCJcIikge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluZGV4ID0gdGFpbC5zZWFyY2goUFVOQ1RVQVRJT04pO1xuICAgICAgICBpZiAoaW5kZXggPCAwKSB7XG4gICAgICAgICAgICBzZW50ZW5jZXMucHVzaCh0YWlsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHNlbnRlbmNlcy5wdXNoKHRhaWwuc3Vic3RyaW5nKDAsIGluZGV4ICsgMSkpO1xuICAgICAgICB0YWlsID0gdGFpbC5zdWJzdHJpbmcoaW5kZXggKyAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlbnRlbmNlcztcbn07XG5cbi8qKlxuICogVG9rZW5pemUgdGV4dFxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgSW5wdXQgdGV4dCB0byBhbmFseXplXG4gKiBAcmV0dXJucyB7QXJyYXl9IFRva2Vuc1xuICovXG5Ub2tlbml6ZXIucHJvdG90eXBlLnRva2VuaXplID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICB2YXIgc2VudGVuY2VzID0gVG9rZW5pemVyLnNwbGl0QnlQdW5jdHVhdGlvbih0ZXh0KTtcbiAgICB2YXIgdG9rZW5zID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZW50ZW5jZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHNlbnRlbmNlID0gc2VudGVuY2VzW2ldO1xuICAgICAgICB0aGlzLnRva2VuaXplRm9yU2VudGVuY2Uoc2VudGVuY2UsIHRva2Vucyk7XG4gICAgfVxuICAgIHJldHVybiB0b2tlbnM7XG59O1xuXG5Ub2tlbml6ZXIucHJvdG90eXBlLnRva2VuaXplRm9yU2VudGVuY2UgPSBmdW5jdGlvbiAoc2VudGVuY2UsIHRva2Vucykge1xuICAgIGlmICh0b2tlbnMgPT0gbnVsbCkge1xuICAgICAgICB0b2tlbnMgPSBbXTtcbiAgICB9XG4gICAgdmFyIGxhdHRpY2UgPSB0aGlzLmdldExhdHRpY2Uoc2VudGVuY2UpO1xuICAgIHZhciBiZXN0X3BhdGggPSB0aGlzLnZpdGVyYmlfc2VhcmNoZXIuc2VhcmNoKGxhdHRpY2UpO1xuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBiZXN0X3BhdGgubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgdmFyIG5vZGUgPSBiZXN0X3BhdGhbal07XG5cbiAgICAgICAgdmFyIHRva2VuLCBmZWF0dXJlcywgZmVhdHVyZXNfbGluZTtcbiAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gXCJLTk9XTlwiKSB7XG4gICAgICAgICAgICBmZWF0dXJlc19saW5lID0gdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkuZ2V0RmVhdHVyZXMobm9kZS5uYW1lKTtcbiAgICAgICAgICAgIGlmIChmZWF0dXJlc19saW5lID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcyA9IFtdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcyA9IGZlYXR1cmVzX2xpbmUuc3BsaXQoXCIsXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG9rZW4gPSB0aGlzLmZvcm1hdHRlci5mb3JtYXRFbnRyeShub2RlLm5hbWUsIG5vZGUuc3RhcnRfcG9zLCBub2RlLnR5cGUsIGZlYXR1cmVzKTtcbiAgICAgICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09IFwiVU5LTk9XTlwiKSB7XG4gICAgICAgICAgICAvLyBVbmtub3duIHdvcmRcbiAgICAgICAgICAgIGZlYXR1cmVzX2xpbmUgPSB0aGlzLnVua25vd25fZGljdGlvbmFyeS5nZXRGZWF0dXJlcyhub2RlLm5hbWUpO1xuICAgICAgICAgICAgaWYgKGZlYXR1cmVzX2xpbmUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZlYXR1cmVzID0gW107XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZlYXR1cmVzID0gZmVhdHVyZXNfbGluZS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b2tlbiA9IHRoaXMuZm9ybWF0dGVyLmZvcm1hdFVua25vd25FbnRyeShub2RlLm5hbWUsIG5vZGUuc3RhcnRfcG9zLCBub2RlLnR5cGUsIGZlYXR1cmVzLCBub2RlLnN1cmZhY2VfZm9ybSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUT0RPIFVzZXIgZGljdGlvbmFyeVxuICAgICAgICAgICAgdG9rZW4gPSB0aGlzLmZvcm1hdHRlci5mb3JtYXRFbnRyeShub2RlLm5hbWUsIG5vZGUuc3RhcnRfcG9zLCBub2RlLnR5cGUsIFtdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRva2Vucy5wdXNoKHRva2VuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdG9rZW5zO1xufTtcblxuLyoqXG4gKiBCdWlsZCB3b3JkIGxhdHRpY2VcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IElucHV0IHRleHQgdG8gYW5hbHl6ZVxuICogQHJldHVybnMge1ZpdGVyYmlMYXR0aWNlfSBXb3JkIGxhdHRpY2VcbiAqL1xuVG9rZW5pemVyLnByb3RvdHlwZS5nZXRMYXR0aWNlID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICByZXR1cm4gdGhpcy52aXRlcmJpX2J1aWxkZXIuYnVpbGQodGV4dCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVG9rZW5pemVyO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9