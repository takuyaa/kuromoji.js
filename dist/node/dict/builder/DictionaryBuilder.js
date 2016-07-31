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
var DynamicDictionaries = require("../DynamicDictionaries");
var TokenInfoDictionary = require("../TokenInfoDictionary");
var ConnectionCosts = require("../ConnectionCosts");
var UnknownDictionary = require("../UnknownDictionary");
var CharacterDefinition = require("../CharacterDefinition");  // TODO Remove this dependency

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

    this.connection_costs = new ConnectionCosts();
    this.char_text = "";
}

DictionaryBuilder.prototype.addTokenInfoDictionary = function (line) {
    var new_entry = line.split(",");
    this.tid_entries.push(new_entry);
    return this;
};

/**
 * Put one line of "matrix.def" file for building ConnectionCost object
 * @param {string} line is a line of "matrix.def"
 */
DictionaryBuilder.prototype.putCostMatrixLine = function (line) {
    this.connection_costs.putLine(line);
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
    var unknown_dictionary = this.buildUnknownDictionary();

    return new DynamicDictionaries(dictionaries.trie, dictionaries.token_info_dictionary, this.connection_costs, unknown_dictionary);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L2J1aWxkZXIvRGljdGlvbmFyeUJ1aWxkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGRvdWJsZWFycmF5ID0gcmVxdWlyZShcImRvdWJsZWFycmF5XCIpO1xudmFyIER5bmFtaWNEaWN0aW9uYXJpZXMgPSByZXF1aXJlKFwiLi4vRHluYW1pY0RpY3Rpb25hcmllc1wiKTtcbnZhciBUb2tlbkluZm9EaWN0aW9uYXJ5ID0gcmVxdWlyZShcIi4uL1Rva2VuSW5mb0RpY3Rpb25hcnlcIik7XG52YXIgQ29ubmVjdGlvbkNvc3RzID0gcmVxdWlyZShcIi4uL0Nvbm5lY3Rpb25Db3N0c1wiKTtcbnZhciBVbmtub3duRGljdGlvbmFyeSA9IHJlcXVpcmUoXCIuLi9Vbmtub3duRGljdGlvbmFyeVwiKTtcbnZhciBDaGFyYWN0ZXJEZWZpbml0aW9uID0gcmVxdWlyZShcIi4uL0NoYXJhY3RlckRlZmluaXRpb25cIik7ICAvLyBUT0RPIFJlbW92ZSB0aGlzIGRlcGVuZGVuY3lcblxuLyoqXG4gKiBCdWlsZCBkaWN0aW9uYXJpZXMgKHRva2VuIGluZm8sIGNvbm5lY3Rpb24gY29zdHMpXG4gKlxuICogR2VuZXJhdGVzIGZyb20gbWF0cml4LmRlZlxuICogY2MuZGF0OiBDb25uZWN0aW9uIGNvc3RzXG4gKlxuICogR2VuZXJhdGVzIGZyb20gKi5jc3ZcbiAqIGRhdC5kYXQ6IERvdWJsZSBhcnJheVxuICogdGlkLmRhdDogVG9rZW4gaW5mbyBkaWN0aW9uYXJ5XG4gKiB0aWRfbWFwLmRhdDogdGFyZ2V0TWFwXG4gKiB0aWRfcG9zLmRhdDogcG9zTGlzdCAocGFydCBvZiBzcGVlY2gpXG4gKi9cbmZ1bmN0aW9uIERpY3Rpb25hcnlCdWlsZGVyKCkge1xuICAgIC8vIEFycmF5IG9mIGVudHJpZXMsIGVhY2ggZW50cnkgaW4gTWVjYWIgZm9ybVxuICAgIC8vICgwOiBzdXJmYWNlIGZvcm0sIDE6IGxlZnQgaWQsIDI6IHJpZ2h0IGlkLCAzOiB3b3JkIGNvc3QsIDQ6IHBhcnQgb2Ygc3BlZWNoIGlkLCA1LTogb3RoZXIgZmVhdHVyZXMpXG4gICAgdGhpcy50aWRfZW50cmllcyA9IFtdO1xuICAgIHRoaXMudW5rX2VudHJpZXMgPSBbXTtcblxuICAgIHRoaXMuY29ubmVjdGlvbl9jb3N0cyA9IG5ldyBDb25uZWN0aW9uQ29zdHMoKTtcbiAgICB0aGlzLmNoYXJfdGV4dCA9IFwiXCI7XG59XG5cbkRpY3Rpb25hcnlCdWlsZGVyLnByb3RvdHlwZS5hZGRUb2tlbkluZm9EaWN0aW9uYXJ5ID0gZnVuY3Rpb24gKGxpbmUpIHtcbiAgICB2YXIgbmV3X2VudHJ5ID0gbGluZS5zcGxpdChcIixcIik7XG4gICAgdGhpcy50aWRfZW50cmllcy5wdXNoKG5ld19lbnRyeSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFB1dCBvbmUgbGluZSBvZiBcIm1hdHJpeC5kZWZcIiBmaWxlIGZvciBidWlsZGluZyBDb25uZWN0aW9uQ29zdCBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBsaW5lIGlzIGEgbGluZSBvZiBcIm1hdHJpeC5kZWZcIlxuICovXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUucHV0Q29zdE1hdHJpeExpbmUgPSBmdW5jdGlvbiAobGluZSkge1xuICAgIHRoaXMuY29ubmVjdGlvbl9jb3N0cy5wdXRMaW5lKGxpbmUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuRGljdGlvbmFyeUJ1aWxkZXIucHJvdG90eXBlLmNoYXJEZWYgPSBmdW5jdGlvbiAoY2hhcl90ZXh0KSB7XG4gICAgdGhpcy5jaGFyX3RleHQgPSBjaGFyX3RleHQ7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUudW5rRGVmID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICB0aGlzLnVua19lbnRyaWVzID0gdGV4dC5zcGxpdCgvXFxuLykubWFwKGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgcmV0dXJuIHJvdy5zcGxpdChcIixcIik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGRpY3Rpb25hcmllcyA9IHRoaXMuYnVpbGRUb2tlbkluZm9EaWN0aW9uYXJ5KCk7XG4gICAgdmFyIHVua25vd25fZGljdGlvbmFyeSA9IHRoaXMuYnVpbGRVbmtub3duRGljdGlvbmFyeSgpO1xuXG4gICAgcmV0dXJuIG5ldyBEeW5hbWljRGljdGlvbmFyaWVzKGRpY3Rpb25hcmllcy50cmllLCBkaWN0aW9uYXJpZXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LCB0aGlzLmNvbm5lY3Rpb25fY29zdHMsIHVua25vd25fZGljdGlvbmFyeSk7XG59O1xuXG4vKipcbiAqIEJ1aWxkIFRva2VuSW5mb0RpY3Rpb25hcnlcbiAqXG4gKiBAcmV0dXJucyB7e3RyaWU6ICosIHRva2VuX2luZm9fZGljdGlvbmFyeTogKn19XG4gKi9cbkRpY3Rpb25hcnlCdWlsZGVyLnByb3RvdHlwZS5idWlsZFRva2VuSW5mb0RpY3Rpb25hcnkgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICB2YXIgdG9rZW5faW5mb19kaWN0aW9uYXJ5ID0gbmV3IFRva2VuSW5mb0RpY3Rpb25hcnkoKTtcblxuICAgIC8vIHVzaW5nIGFzIGhhc2htYXAsIHN0cmluZyAtPiBzdHJpbmcgKHdvcmRfaWQgLT4gc3VyZmFjZV9mb3JtKSB0byBidWlsZCBkaWN0aW9uYXJ5XG4gICAgdmFyIGRpY3Rpb25hcnlfZW50cmllcyA9IHRva2VuX2luZm9fZGljdGlvbmFyeS5idWlsZERpY3Rpb25hcnkodGhpcy50aWRfZW50cmllcyk7XG5cbiAgICB2YXIgdHJpZSA9IHRoaXMuYnVpbGREb3VibGVBcnJheSgpO1xuXG4gICAgZm9yICh2YXIgdG9rZW5faW5mb19pZCBpbiBkaWN0aW9uYXJ5X2VudHJpZXMpIHtcbiAgICAgICAgdmFyIHN1cmZhY2VfZm9ybSA9IGRpY3Rpb25hcnlfZW50cmllc1t0b2tlbl9pbmZvX2lkXTtcbiAgICAgICAgdmFyIHRyaWVfaWQgPSB0cmllLmxvb2t1cChzdXJmYWNlX2Zvcm0pO1xuXG4gICAgICAgIC8vIEFzc2VydGlvblxuICAgICAgICAvLyBpZiAodHJpZV9pZCA8IDApIHtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwiTm90IEZvdW5kOlwiICsgc3VyZmFjZV9mb3JtKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHRva2VuX2luZm9fZGljdGlvbmFyeS5hZGRNYXBwaW5nKHRyaWVfaWQsIHRva2VuX2luZm9faWQpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHRyaWU6IHRyaWUsXG4gICAgICAgIHRva2VuX2luZm9fZGljdGlvbmFyeTogdG9rZW5faW5mb19kaWN0aW9uYXJ5XG4gICAgfTtcbn07XG5cbkRpY3Rpb25hcnlCdWlsZGVyLnByb3RvdHlwZS5idWlsZFVua25vd25EaWN0aW9uYXJ5ID0gZnVuY3Rpb24gKCkge1xuXG4gICAgdmFyIHVua19kaWN0aW9uYXJ5ID0gbmV3IFVua25vd25EaWN0aW9uYXJ5KCk7XG5cbiAgICAvLyB1c2luZyBhcyBoYXNobWFwLCBzdHJpbmcgLT4gc3RyaW5nICh3b3JkX2lkIC0+IHN1cmZhY2VfZm9ybSkgdG8gYnVpbGQgZGljdGlvbmFyeVxuICAgIHZhciBkaWN0aW9uYXJ5X2VudHJpZXMgPSB1bmtfZGljdGlvbmFyeS5idWlsZERpY3Rpb25hcnkodGhpcy51bmtfZW50cmllcyk7XG5cbiAgICB2YXIgY2hhcl9kZWYgPSBDaGFyYWN0ZXJEZWZpbml0aW9uLnJlYWRDaGFyYWN0ZXJEZWZpbml0aW9uKHRoaXMuY2hhcl90ZXh0KTsgLy8gQ3JlYXRlIENoYXJhY3RlckRlZmluaXRpb24gKGZhY3RvcnkgbWV0aG9kKVxuXG4gICAgdW5rX2RpY3Rpb25hcnkuY2hhcmFjdGVyRGVmaW5pdGlvbihjaGFyX2RlZik7XG5cbiAgICBmb3IgKHZhciB0b2tlbl9pbmZvX2lkIGluIGRpY3Rpb25hcnlfZW50cmllcykge1xuICAgICAgICB2YXIgY2xhc3NfbmFtZSA9IGRpY3Rpb25hcnlfZW50cmllc1t0b2tlbl9pbmZvX2lkXTtcbiAgICAgICAgdmFyIGNsYXNzX2lkID0gY2hhcl9kZWYuaW52b2tlX2RlZmluaXRpb25fbWFwLmxvb2t1cChjbGFzc19uYW1lKTtcblxuICAgICAgICAvLyBBc3NlcnRpb25cbiAgICAgICAgLy8gaWYgKHRyaWVfaWQgPCAwKSB7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhcIk5vdCBGb3VuZDpcIiArIHN1cmZhY2VfZm9ybSk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICB1bmtfZGljdGlvbmFyeS5hZGRNYXBwaW5nKGNsYXNzX2lkLCB0b2tlbl9pbmZvX2lkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5rX2RpY3Rpb25hcnk7XG59O1xuXG4vKipcbiAqIEJ1aWxkIGRvdWJsZSBhcnJheSB0cmllXG4gKlxuICogQHJldHVybnMge0RvdWJsZUFycmF5fSBEb3VibGUtQXJyYXkgdHJpZVxuICovXG5EaWN0aW9uYXJ5QnVpbGRlci5wcm90b3R5cGUuYnVpbGREb3VibGVBcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdHJpZV9pZCA9IDA7XG4gICAgdmFyIHdvcmRzID0gdGhpcy50aWRfZW50cmllcy5tYXAoZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICAgIHZhciBzdXJmYWNlX2Zvcm0gPSBlbnRyeVswXTtcbiAgICAgICAgcmV0dXJuIHsgazogc3VyZmFjZV9mb3JtLCB2OiB0cmllX2lkKysgfTtcbiAgICB9KTtcblxuICAgIHZhciBidWlsZGVyID0gZG91YmxlYXJyYXkuYnVpbGRlcigxMDI0ICogMTAyNCk7XG4gICAgcmV0dXJuIGJ1aWxkZXIuYnVpbGQod29yZHMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEaWN0aW9uYXJ5QnVpbGRlcjtcbiJdLCJmaWxlIjoiZGljdC9idWlsZGVyL0RpY3Rpb25hcnlCdWlsZGVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
