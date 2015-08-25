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

var doublearray = require("doublearray");

var DynamicDictionaries = require("../dict/DynamicDictionaries.js");
var TokenInfoDictionary = require("../dict/TokenInfoDictionary.js");
var ConnectionCosts = require("../dict/ConnectionCosts.js");
var UnknownDictionary = require("../dict/UnknownDictionary.js");
var CharacterDefinition = require("../dict/CharacterDefinition.js");  // TODO Remove this dependency


/**
 * Build dictionaries (token info, connection costs)
 *
 * Generates from matrix.def
 * cc.dat: Connection costs
 *
 * Generates from *.csv
 * dat.dat: Double array
 * tid.dat: Token info dictionary
 * tid_map.dat: targetMap
 * tid_pos.dat: posList (part of speech)
 */
function DictionaryBuilder() {
    // Array of entries, each entry in Mecab form
    // (0: surface form, 1: left id, 2: right id, 3: word cost, 4: part of speech id, 5-: other features)
    this.tid_entries = [];
    this.unk_entries = [];

    this.matrix_text = "0 0";
    this.char_text = "";
}

DictionaryBuilder.prototype.addTokenInfoDictionary = function (text) {
    var new_entries = text.split(/\n/).map(function (row) {
        return row.split(",");
    });
    this.tid_entries = this.tid_entries.concat(new_entries);
    return this;
};

/**
 *
 * @param {string} matrix_text Contents of file "matrix.def"
 * @returns {DictionaryBuilder}
 */
DictionaryBuilder.prototype.costMatrix = function (matrix_text) {
    this.matrix_text = matrix_text;
    return this;
};

DictionaryBuilder.prototype.charDef = function (char_text) {
    this.char_text = char_text;
    return this;
};

DictionaryBuilder.prototype.unkDef = function (text) {
    this.unk_entries = text.split(/\n/).map(function (row) {
        return row.split(",");
    });
    return this;
};

DictionaryBuilder.prototype.build = function () {
    var dictionaries = this.buildTokenInfoDictionary();
    var connection_costs = this.buildConnectionCosts();
    var unknown_dictionary = this.buildUnknownDictionary();

    return new DynamicDictionaries(dictionaries.trie, dictionaries.token_info_dictionary, connection_costs, unknown_dictionary);
};

/**
 * Build TokenInfoDictionary
 *
 * @returns {{trie: *, token_info_dictionary: *}}
 */
DictionaryBuilder.prototype.buildTokenInfoDictionary = function () {

    var token_info_dictionary = new TokenInfoDictionary();

    // using as hashmap, string -> string (word_id -> surface_form) to build dictionary
    var dictionary_entries = token_info_dictionary.buildDictionary(this.tid_entries);

    var trie = this.buildDoubleArray();

    for (var token_info_id in dictionary_entries) {
        var surface_form = dictionary_entries[token_info_id];
        var trie_id = trie.lookup(surface_form);

        // Assertion
        // if (trie_id < 0) {
        //     console.log("Not Found:" + surface_form);
        // }

        token_info_dictionary.addMapping(trie_id, token_info_id);
    }

    return {
        trie: trie,
        token_info_dictionary: token_info_dictionary
    };
};

DictionaryBuilder.prototype.buildUnknownDictionary = function () {

    var unk_dictionary = new UnknownDictionary();

    // using as hashmap, string -> string (word_id -> surface_form) to build dictionary
    var dictionary_entries = unk_dictionary.buildDictionary(this.unk_entries);

    var char_def = CharacterDefinition.readCharacterDefinition(this.char_text); // Create CharacterDefinition (factory method)

    unk_dictionary.characterDefinition(char_def);

    for (var token_info_id in dictionary_entries) {
        var class_name = dictionary_entries[token_info_id];
        var class_id = char_def.invoke_definition_map.lookup(class_name);

        // Assertion
        // if (trie_id < 0) {
        //     console.log("Not Found:" + surface_form);
        // }

        unk_dictionary.addMapping(class_id, token_info_id);
    }

    return unk_dictionary;
};

/**
 * Build connection costs dictionary
 */
DictionaryBuilder.prototype.buildConnectionCosts = function () {
    return ConnectionCosts.build(this.matrix_text);
};

/**
 * Build double array trie
 *
 * @returns {DoubleArray} Double-Array trie
 */
DictionaryBuilder.prototype.buildDoubleArray = function () {
    var trie_id = 0;
    var words = this.tid_entries.map(function (entry) {
        var surface_form = entry[0];
        return { k: surface_form, v: trie_id++ };
    });

    var builder = doublearray.builder(1024 * 1024);
    return builder.build(words);
};


module.exports = DictionaryBuilder;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1dGlsL0RpY3Rpb25hcnlCdWlsZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBkb3VibGVhcnJheSA9IHJlcXVpcmUoXCJkb3VibGVhcnJheVwiKTtcblxudmFyIER5bmFtaWNEaWN0aW9uYXJpZXMgPSByZXF1aXJlKFwiLi4vZGljdC9EeW5hbWljRGljdGlvbmFyaWVzLmpzXCIpO1xudmFyIFRva2VuSW5mb0RpY3Rpb25hcnkgPSByZXF1aXJlKFwiLi4vZGljdC9Ub2tlbkluZm9EaWN0aW9uYXJ5LmpzXCIpO1xudmFyIENvbm5lY3Rpb25Db3N0cyA9IHJlcXVpcmUoXCIuLi9kaWN0L0Nvbm5lY3Rpb25Db3N0cy5qc1wiKTtcbnZhciBVbmtub3duRGljdGlvbmFyeSA9IHJlcXVpcmUoXCIuLi9kaWN0L1Vua25vd25EaWN0aW9uYXJ5LmpzXCIpO1xudmFyIENoYXJhY3RlckRlZmluaXRpb24gPSByZXF1aXJlKFwiLi4vZGljdC9DaGFyYWN0ZXJEZWZpbml0aW9uLmpzXCIpOyAgLy8gVE9ETyBSZW1vdmUgdGhpcyBkZXBlbmRlbmN5XG5cblxuLyoqXG4gKiBCdWlsZCBkaWN0aW9uYXJpZXMgKHRva2VuIGluZm8sIGNvbm5lY3Rpb24gY29zdHMpXG4gKlxuICogR2VuZXJhdGVzIGZyb20gbWF0cml4LmRlZlxuICogY2MuZGF0OiBDb25uZWN0aW9uIGNvc3RzXG4gKlxuICogR2VuZXJhdGVzIGZyb20gKi5jc3ZcbiAqIGRhdC5kYXQ6IERvdWJsZSBhcnJheVxuICogdGlkLmRhdDogVG9rZW4gaW5mbyBkaWN0aW9uYXJ5XG4gKiB0aWRfbWFwLmRhdDogdGFyZ2V0TWFwXG4gKiB0aWRfcG9zLmRhdDogcG9zTGlzdCAocGFydCBvZiBzcGVlY2gpXG4gKi9cbmZ1bmN0aW9uIERpY3Rpb25hcnlCdWlsZGVyKCkge1xuICAgIC8vIEFycmF5IG9mIGVudHJpZXMsIGVhY2ggZW50cnkgaW4gTWVjYWIgZm9ybVxuICAgIC8vICgwOiBzdXJmYWNlIGZvcm0sIDE6IGxlZnQgaWQsIDI6IHJpZ2h0IGlkLCAzOiB3b3JkIGNvc3QsIDQ6IHBhcnQgb2Ygc3BlZWNoIGlkLCA1LTogb3RoZXIgZmVhdHVyZXMpXG4gICAgdGhpcy50aWRfZW50cmllcyA9IFtdO1xuICAgIHRoaXMudW5rX2VudHJpZXMgPSBbXTtcblxuICAgIHRoaXMubWF0cml4X3RleHQgPSBcIjAgMFwiO1xuICAgIHRoaXMuY2hhcl90ZXh0ID0gXCJcIjtcbn1cblxuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLmFkZFRva2VuSW5mb0RpY3Rpb25hcnkgPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIHZhciBuZXdfZW50cmllcyA9IHRleHQuc3BsaXQoL1xcbi8pLm1hcChmdW5jdGlvbiAocm93KSB7XG4gICAgICAgIHJldHVybiByb3cuc3BsaXQoXCIsXCIpO1xuICAgIH0pO1xuICAgIHRoaXMudGlkX2VudHJpZXMgPSB0aGlzLnRpZF9lbnRyaWVzLmNvbmNhdChuZXdfZW50cmllcyk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gbWF0cml4X3RleHQgQ29udGVudHMgb2YgZmlsZSBcIm1hdHJpeC5kZWZcIlxuICogQHJldHVybnMge0RpY3Rpb25hcnlCdWlsZGVyfVxuICovXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUuY29zdE1hdHJpeCA9IGZ1bmN0aW9uIChtYXRyaXhfdGV4dCkge1xuICAgIHRoaXMubWF0cml4X3RleHQgPSBtYXRyaXhfdGV4dDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbkRpY3Rpb25hcnlCdWlsZGVyLnByb3RvdHlwZS5jaGFyRGVmID0gZnVuY3Rpb24gKGNoYXJfdGV4dCkge1xuICAgIHRoaXMuY2hhcl90ZXh0ID0gY2hhcl90ZXh0O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLnVua0RlZiA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdGhpcy51bmtfZW50cmllcyA9IHRleHQuc3BsaXQoL1xcbi8pLm1hcChmdW5jdGlvbiAocm93KSB7XG4gICAgICAgIHJldHVybiByb3cuc3BsaXQoXCIsXCIpO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBkaWN0aW9uYXJpZXMgPSB0aGlzLmJ1aWxkVG9rZW5JbmZvRGljdGlvbmFyeSgpO1xuICAgIHZhciBjb25uZWN0aW9uX2Nvc3RzID0gdGhpcy5idWlsZENvbm5lY3Rpb25Db3N0cygpO1xuICAgIHZhciB1bmtub3duX2RpY3Rpb25hcnkgPSB0aGlzLmJ1aWxkVW5rbm93bkRpY3Rpb25hcnkoKTtcblxuICAgIHJldHVybiBuZXcgRHluYW1pY0RpY3Rpb25hcmllcyhkaWN0aW9uYXJpZXMudHJpZSwgZGljdGlvbmFyaWVzLnRva2VuX2luZm9fZGljdGlvbmFyeSwgY29ubmVjdGlvbl9jb3N0cywgdW5rbm93bl9kaWN0aW9uYXJ5KTtcbn07XG5cbi8qKlxuICogQnVpbGQgVG9rZW5JbmZvRGljdGlvbmFyeVxuICpcbiAqIEByZXR1cm5zIHt7dHJpZTogKiwgdG9rZW5faW5mb19kaWN0aW9uYXJ5OiAqfX1cbiAqL1xuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkVG9rZW5JbmZvRGljdGlvbmFyeSA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciB0b2tlbl9pbmZvX2RpY3Rpb25hcnkgPSBuZXcgVG9rZW5JbmZvRGljdGlvbmFyeSgpO1xuXG4gICAgLy8gdXNpbmcgYXMgaGFzaG1hcCwgc3RyaW5nIC0+IHN0cmluZyAod29yZF9pZCAtPiBzdXJmYWNlX2Zvcm0pIHRvIGJ1aWxkIGRpY3Rpb25hcnlcbiAgICB2YXIgZGljdGlvbmFyeV9lbnRyaWVzID0gdG9rZW5faW5mb19kaWN0aW9uYXJ5LmJ1aWxkRGljdGlvbmFyeSh0aGlzLnRpZF9lbnRyaWVzKTtcblxuICAgIHZhciB0cmllID0gdGhpcy5idWlsZERvdWJsZUFycmF5KCk7XG5cbiAgICBmb3IgKHZhciB0b2tlbl9pbmZvX2lkIGluIGRpY3Rpb25hcnlfZW50cmllcykge1xuICAgICAgICB2YXIgc3VyZmFjZV9mb3JtID0gZGljdGlvbmFyeV9lbnRyaWVzW3Rva2VuX2luZm9faWRdO1xuICAgICAgICB2YXIgdHJpZV9pZCA9IHRyaWUubG9va3VwKHN1cmZhY2VfZm9ybSk7XG5cbiAgICAgICAgLy8gQXNzZXJ0aW9uXG4gICAgICAgIC8vIGlmICh0cmllX2lkIDwgMCkge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coXCJOb3QgRm91bmQ6XCIgKyBzdXJmYWNlX2Zvcm0pO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgdG9rZW5faW5mb19kaWN0aW9uYXJ5LmFkZE1hcHBpbmcodHJpZV9pZCwgdG9rZW5faW5mb19pZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHJpZTogdHJpZSxcbiAgICAgICAgdG9rZW5faW5mb19kaWN0aW9uYXJ5OiB0b2tlbl9pbmZvX2RpY3Rpb25hcnlcbiAgICB9O1xufTtcblxuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkVW5rbm93bkRpY3Rpb25hcnkgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgdW5rX2RpY3Rpb25hcnkgPSBuZXcgVW5rbm93bkRpY3Rpb25hcnkoKTtcblxuICAgIC8vIHVzaW5nIGFzIGhhc2htYXAsIHN0cmluZyAtPiBzdHJpbmcgKHdvcmRfaWQgLT4gc3VyZmFjZV9mb3JtKSB0byBidWlsZCBkaWN0aW9uYXJ5XG4gICAgdmFyIGRpY3Rpb25hcnlfZW50cmllcyA9IHVua19kaWN0aW9uYXJ5LmJ1aWxkRGljdGlvbmFyeSh0aGlzLnVua19lbnRyaWVzKTtcblxuICAgIHZhciBjaGFyX2RlZiA9IENoYXJhY3RlckRlZmluaXRpb24ucmVhZENoYXJhY3RlckRlZmluaXRpb24odGhpcy5jaGFyX3RleHQpOyAvLyBDcmVhdGUgQ2hhcmFjdGVyRGVmaW5pdGlvbiAoZmFjdG9yeSBtZXRob2QpXG5cbiAgICB1bmtfZGljdGlvbmFyeS5jaGFyYWN0ZXJEZWZpbml0aW9uKGNoYXJfZGVmKTtcblxuICAgIGZvciAodmFyIHRva2VuX2luZm9faWQgaW4gZGljdGlvbmFyeV9lbnRyaWVzKSB7XG4gICAgICAgIHZhciBjbGFzc19uYW1lID0gZGljdGlvbmFyeV9lbnRyaWVzW3Rva2VuX2luZm9faWRdO1xuICAgICAgICB2YXIgY2xhc3NfaWQgPSBjaGFyX2RlZi5pbnZva2VfZGVmaW5pdGlvbl9tYXAubG9va3VwKGNsYXNzX25hbWUpO1xuXG4gICAgICAgIC8vIEFzc2VydGlvblxuICAgICAgICAvLyBpZiAodHJpZV9pZCA8IDApIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwiTm90IEZvdW5kOlwiICsgc3VyZmFjZV9mb3JtKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHVua19kaWN0aW9uYXJ5LmFkZE1hcHBpbmcoY2xhc3NfaWQsIHRva2VuX2luZm9faWQpO1xuICAgIH1cblxuICAgIHJldHVybiB1bmtfZGljdGlvbmFyeTtcbn07XG5cbi8qKlxuICogQnVpbGQgY29ubmVjdGlvbiBjb3N0cyBkaWN0aW9uYXJ5XG4gKi9cbkRpY3Rpb25hcnlCdWlsZGVyLnByb3RvdHlwZS5idWlsZENvbm5lY3Rpb25Db3N0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gQ29ubmVjdGlvbkNvc3RzLmJ1aWxkKHRoaXMubWF0cml4X3RleHQpO1xufTtcblxuLyoqXG4gKiBCdWlsZCBkb3VibGUgYXJyYXkgdHJpZVxuICpcbiAqIEByZXR1cm5zIHtEb3VibGVBcnJheX0gRG91YmxlLUFycmF5IHRyaWVcbiAqL1xuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkRG91YmxlQXJyYXkgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRyaWVfaWQgPSAwO1xuICAgIHZhciB3b3JkcyA9IHRoaXMudGlkX2VudHJpZXMubWFwKGZ1bmN0aW9uIChlbnRyeSkge1xuICAgICAgICB2YXIgc3VyZmFjZV9mb3JtID0gZW50cnlbMF07XG4gICAgICAgIHJldHVybiB7IGs6IHN1cmZhY2VfZm9ybSwgdjogdHJpZV9pZCsrIH07XG4gICAgfSk7XG5cbiAgICB2YXIgYnVpbGRlciA9IGRvdWJsZWFycmF5LmJ1aWxkZXIoMTAyNCAqIDEwMjQpO1xuICAgIHJldHVybiBidWlsZGVyLmJ1aWxkKHdvcmRzKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBEaWN0aW9uYXJ5QnVpbGRlcjtcbiJdLCJmaWxlIjoidXRpbC9EaWN0aW9uYXJ5QnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9