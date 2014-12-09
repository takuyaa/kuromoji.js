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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC9EaWN0aW9uYXJ5QnVpbGRlci5qcyIsIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzIjpbInV0aWwvRGljdGlvbmFyeUJ1aWxkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGRvdWJsZWFycmF5ID0gcmVxdWlyZShcImRvdWJsZWFycmF5XCIpO1xuXG52YXIgRHluYW1pY0RpY3Rpb25hcmllcyA9IHJlcXVpcmUoXCIuLi9kaWN0L0R5bmFtaWNEaWN0aW9uYXJpZXMuanNcIik7XG52YXIgVG9rZW5JbmZvRGljdGlvbmFyeSA9IHJlcXVpcmUoXCIuLi9kaWN0L1Rva2VuSW5mb0RpY3Rpb25hcnkuanNcIik7XG52YXIgQ29ubmVjdGlvbkNvc3RzID0gcmVxdWlyZShcIi4uL2RpY3QvQ29ubmVjdGlvbkNvc3RzLmpzXCIpO1xudmFyIFVua25vd25EaWN0aW9uYXJ5ID0gcmVxdWlyZShcIi4uL2RpY3QvVW5rbm93bkRpY3Rpb25hcnkuanNcIik7XG52YXIgQ2hhcmFjdGVyRGVmaW5pdGlvbiA9IHJlcXVpcmUoXCIuLi9kaWN0L0NoYXJhY3RlckRlZmluaXRpb24uanNcIik7ICAvLyBUT0RPIFJlbW92ZSB0aGlzIGRlcGVuZGVuY3lcblxuXG4vKipcbiAqIEJ1aWxkIGRpY3Rpb25hcmllcyAodG9rZW4gaW5mbywgY29ubmVjdGlvbiBjb3N0cylcbiAqXG4gKiBHZW5lcmF0ZXMgZnJvbSBtYXRyaXguZGVmXG4gKiBjYy5kYXQ6IENvbm5lY3Rpb24gY29zdHNcbiAqXG4gKiBHZW5lcmF0ZXMgZnJvbSAqLmNzdlxuICogZGF0LmRhdDogRG91YmxlIGFycmF5XG4gKiB0aWQuZGF0OiBUb2tlbiBpbmZvIGRpY3Rpb25hcnlcbiAqIHRpZF9tYXAuZGF0OiB0YXJnZXRNYXBcbiAqIHRpZF9wb3MuZGF0OiBwb3NMaXN0IChwYXJ0IG9mIHNwZWVjaClcbiAqL1xuZnVuY3Rpb24gRGljdGlvbmFyeUJ1aWxkZXIoKSB7XG4gICAgLy8gQXJyYXkgb2YgZW50cmllcywgZWFjaCBlbnRyeSBpbiBNZWNhYiBmb3JtXG4gICAgLy8gKDA6IHN1cmZhY2UgZm9ybSwgMTogbGVmdCBpZCwgMjogcmlnaHQgaWQsIDM6IHdvcmQgY29zdCwgNDogcGFydCBvZiBzcGVlY2ggaWQsIDUtOiBvdGhlciBmZWF0dXJlcylcbiAgICB0aGlzLnRpZF9lbnRyaWVzID0gW107XG4gICAgdGhpcy51bmtfZW50cmllcyA9IFtdO1xuXG4gICAgdGhpcy5tYXRyaXhfdGV4dCA9IFwiMCAwXCI7XG4gICAgdGhpcy5jaGFyX3RleHQgPSBcIlwiO1xufVxuXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUuYWRkVG9rZW5JbmZvRGljdGlvbmFyeSA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdmFyIG5ld19lbnRyaWVzID0gdGV4dC5zcGxpdCgvXFxuLykubWFwKGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgcmV0dXJuIHJvdy5zcGxpdChcIixcIik7XG4gICAgfSk7XG4gICAgdGhpcy50aWRfZW50cmllcyA9IHRoaXMudGlkX2VudHJpZXMuY29uY2F0KG5ld19lbnRyaWVzKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBtYXRyaXhfdGV4dCBDb250ZW50cyBvZiBmaWxlIFwibWF0cml4LmRlZlwiXG4gKiBAcmV0dXJucyB7RGljdGlvbmFyeUJ1aWxkZXJ9XG4gKi9cbkRpY3Rpb25hcnlCdWlsZGVyLnByb3RvdHlwZS5jb3N0TWF0cml4ID0gZnVuY3Rpb24gKG1hdHJpeF90ZXh0KSB7XG4gICAgdGhpcy5tYXRyaXhfdGV4dCA9IG1hdHJpeF90ZXh0O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLmNoYXJEZWYgPSBmdW5jdGlvbiAoY2hhcl90ZXh0KSB7XG4gICAgdGhpcy5jaGFyX3RleHQgPSBjaGFyX3RleHQ7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUudW5rRGVmID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICB0aGlzLnVua19lbnRyaWVzID0gdGV4dC5zcGxpdCgvXFxuLykubWFwKGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgcmV0dXJuIHJvdy5zcGxpdChcIixcIik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRpY3Rpb25hcmllcyA9IHRoaXMuYnVpbGRUb2tlbkluZm9EaWN0aW9uYXJ5KCk7XG4gICAgdmFyIGNvbm5lY3Rpb25fY29zdHMgPSB0aGlzLmJ1aWxkQ29ubmVjdGlvbkNvc3RzKCk7XG4gICAgdmFyIHVua25vd25fZGljdGlvbmFyeSA9IHRoaXMuYnVpbGRVbmtub3duRGljdGlvbmFyeSgpO1xuXG4gICAgcmV0dXJuIG5ldyBEeW5hbWljRGljdGlvbmFyaWVzKGRpY3Rpb25hcmllcy50cmllLCBkaWN0aW9uYXJpZXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LCBjb25uZWN0aW9uX2Nvc3RzLCB1bmtub3duX2RpY3Rpb25hcnkpO1xufTtcblxuLyoqXG4gKiBCdWlsZCBUb2tlbkluZm9EaWN0aW9uYXJ5XG4gKlxuICogQHJldHVybnMge3t0cmllOiAqLCB0b2tlbl9pbmZvX2RpY3Rpb25hcnk6ICp9fVxuICovXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUuYnVpbGRUb2tlbkluZm9EaWN0aW9uYXJ5ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIHRva2VuX2luZm9fZGljdGlvbmFyeSA9IG5ldyBUb2tlbkluZm9EaWN0aW9uYXJ5KCk7XG5cbiAgICAvLyB1c2luZyBhcyBoYXNobWFwLCBzdHJpbmcgLT4gc3RyaW5nICh3b3JkX2lkIC0+IHN1cmZhY2VfZm9ybSkgdG8gYnVpbGQgZGljdGlvbmFyeVxuICAgIHZhciBkaWN0aW9uYXJ5X2VudHJpZXMgPSB0b2tlbl9pbmZvX2RpY3Rpb25hcnkuYnVpbGREaWN0aW9uYXJ5KHRoaXMudGlkX2VudHJpZXMpO1xuXG4gICAgdmFyIHRyaWUgPSB0aGlzLmJ1aWxkRG91YmxlQXJyYXkoKTtcblxuICAgIGZvciAodmFyIHRva2VuX2luZm9faWQgaW4gZGljdGlvbmFyeV9lbnRyaWVzKSB7XG4gICAgICAgIHZhciBzdXJmYWNlX2Zvcm0gPSBkaWN0aW9uYXJ5X2VudHJpZXNbdG9rZW5faW5mb19pZF07XG4gICAgICAgIHZhciB0cmllX2lkID0gdHJpZS5sb29rdXAoc3VyZmFjZV9mb3JtKTtcblxuICAgICAgICAvLyBBc3NlcnRpb25cbiAgICAgICAgLy8gaWYgKHRyaWVfaWQgPCAwKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhcIk5vdCBGb3VuZDpcIiArIHN1cmZhY2VfZm9ybSk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICB0b2tlbl9pbmZvX2RpY3Rpb25hcnkuYWRkTWFwcGluZyh0cmllX2lkLCB0b2tlbl9pbmZvX2lkKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICB0cmllOiB0cmllLFxuICAgICAgICB0b2tlbl9pbmZvX2RpY3Rpb25hcnk6IHRva2VuX2luZm9fZGljdGlvbmFyeVxuICAgIH07XG59O1xuXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUuYnVpbGRVbmtub3duRGljdGlvbmFyeSA9IGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciB1bmtfZGljdGlvbmFyeSA9IG5ldyBVbmtub3duRGljdGlvbmFyeSgpO1xuXG4gICAgLy8gdXNpbmcgYXMgaGFzaG1hcCwgc3RyaW5nIC0+IHN0cmluZyAod29yZF9pZCAtPiBzdXJmYWNlX2Zvcm0pIHRvIGJ1aWxkIGRpY3Rpb25hcnlcbiAgICB2YXIgZGljdGlvbmFyeV9lbnRyaWVzID0gdW5rX2RpY3Rpb25hcnkuYnVpbGREaWN0aW9uYXJ5KHRoaXMudW5rX2VudHJpZXMpO1xuXG4gICAgdmFyIGNoYXJfZGVmID0gQ2hhcmFjdGVyRGVmaW5pdGlvbi5yZWFkQ2hhcmFjdGVyRGVmaW5pdGlvbih0aGlzLmNoYXJfdGV4dCk7IC8vIENyZWF0ZSBDaGFyYWN0ZXJEZWZpbml0aW9uIChmYWN0b3J5IG1ldGhvZClcblxuICAgIHVua19kaWN0aW9uYXJ5LmNoYXJhY3RlckRlZmluaXRpb24oY2hhcl9kZWYpO1xuXG4gICAgZm9yICh2YXIgdG9rZW5faW5mb19pZCBpbiBkaWN0aW9uYXJ5X2VudHJpZXMpIHtcbiAgICAgICAgdmFyIGNsYXNzX25hbWUgPSBkaWN0aW9uYXJ5X2VudHJpZXNbdG9rZW5faW5mb19pZF07XG4gICAgICAgIHZhciBjbGFzc19pZCA9IGNoYXJfZGVmLmludm9rZV9kZWZpbml0aW9uX21hcC5sb29rdXAoY2xhc3NfbmFtZSk7XG5cbiAgICAgICAgLy8gQXNzZXJ0aW9uXG4gICAgICAgIC8vIGlmICh0cmllX2lkIDwgMCkge1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coXCJOb3QgRm91bmQ6XCIgKyBzdXJmYWNlX2Zvcm0pO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgdW5rX2RpY3Rpb25hcnkuYWRkTWFwcGluZyhjbGFzc19pZCwgdG9rZW5faW5mb19pZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVua19kaWN0aW9uYXJ5O1xufTtcblxuLyoqXG4gKiBCdWlsZCBjb25uZWN0aW9uIGNvc3RzIGRpY3Rpb25hcnlcbiAqL1xuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkQ29ubmVjdGlvbkNvc3RzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBDb25uZWN0aW9uQ29zdHMuYnVpbGQodGhpcy5tYXRyaXhfdGV4dCk7XG59O1xuXG4vKipcbiAqIEJ1aWxkIGRvdWJsZSBhcnJheSB0cmllXG4gKlxuICogQHJldHVybnMge0RvdWJsZUFycmF5fSBEb3VibGUtQXJyYXkgdHJpZVxuICovXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUuYnVpbGREb3VibGVBcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdHJpZV9pZCA9IDA7XG4gICAgdmFyIHdvcmRzID0gdGhpcy50aWRfZW50cmllcy5tYXAoZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICAgIHZhciBzdXJmYWNlX2Zvcm0gPSBlbnRyeVswXTtcbiAgICAgICAgcmV0dXJuIHsgazogc3VyZmFjZV9mb3JtLCB2OiB0cmllX2lkKysgfTtcbiAgICB9KTtcblxuICAgIHZhciBidWlsZGVyID0gZG91YmxlYXJyYXkuYnVpbGRlcigxMDI0ICogMTAyNCk7XG4gICAgcmV0dXJuIGJ1aWxkZXIuYnVpbGQod29yZHMpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IERpY3Rpb25hcnlCdWlsZGVyO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9