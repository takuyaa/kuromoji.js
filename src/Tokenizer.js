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

/**
 * Tokenize sentence
 * @param {string} sentence Sentence splitted by punctuation
 * @param {Array} tokens tokens Already computed tokens array
 * @returns {Array} Tokens concatenated with given tokens array
 */
Tokenizer.prototype.tokenizeForSentence = function (sentence, tokens) {
    var lattice = this.getLattice(sentence);
    return this.getBestPath(lattice, tokens);
};

/**
 * Get shortest path tokens by Viterbi algorithm
 * @param {ViterbiLattice} lattice Lattice to compute
 * @param {Array} tokens Already computed tokens array
 * @returns {Array} Tokens concatenated with given tokens array
 */
Tokenizer.prototype.getBestPath = function (lattice, tokens) {
    if (tokens == null) {
        tokens = [];
    }
    var best_path = this.viterbi_searcher.search(lattice);

    for (var j = 0; j < best_path.length; j++) {
        var node = best_path[j];
        var token = this.formatNode(node);
        tokens.push(token);
    }
    return tokens;
};

/**
 * Format ViterbiNode to token
 * @param {ViterbiNode} node
 * @returns {*} JSON token constructed by formatter
 */
Tokenizer.prototype.formatNode = function (node) {
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

    return token;
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
