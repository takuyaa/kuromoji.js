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

var ViterbiNode = require("./ViterbiNode.js");
var ViterbiLattice = require("./ViterbiLattice.js");
var SurrogateAwareString = require("../util/SurrogateAwareString.js");


/**
 * ViterbiBuilder builds word lattice (ViterbiLattice)
 * @param {DynamicDictionaries} dic dictionary
 * @constructor
 */
function ViterbiBuilder(dic) {
    this.trie = dic.trie;
    this.token_info_dictionary = dic.token_info_dictionary;
    this.unknown_dictionary = dic.unknown_dictionary;
}

/**
 * Build word lattice
 * @param {string} sentence_str Input text
 * @returns {ViterbiLattice} Word lattice
 */
ViterbiBuilder.prototype.build = function (sentence_str) {
    var lattice = new ViterbiLattice();
    var sentence = new SurrogateAwareString(sentence_str);

    var key, trie_id, left_id, right_id, word_cost;
    for (var pos = 0; pos < sentence.length; pos++) {
        var tail = sentence.slice(pos);
        var vocabulary = this.trie.commonPrefixSearch(tail);
        for (var n = 0; n < vocabulary.length; n++) {  // Words in dictionary do not have surrogate pair (only UCS2 set)
            trie_id = vocabulary[n].v;
            key = vocabulary[n].k;

            var token_info_ids = this.token_info_dictionary.target_map[trie_id];
            for (var i = 0; i < token_info_ids.length; i++) {
                var token_info_id = parseInt(token_info_ids[i]);

                left_id = this.token_info_dictionary.dictionary.getShort(token_info_id);
                right_id = this.token_info_dictionary.dictionary.getShort(token_info_id + 2);
                word_cost = this.token_info_dictionary.dictionary.getShort(token_info_id + 4);

                // node_name, cost, start_index, length, type, left_id, right_id, surface_form
                lattice.append(new ViterbiNode(token_info_id, word_cost, pos + 1, key.length, "KNOWN", left_id, right_id, key));
            }
        }

        // Unknown word processing
        var surrogate_aware_tail = new SurrogateAwareString(tail);
        var head_char = new SurrogateAwareString(surrogate_aware_tail.charAt(0));
        var head_char_class = this.unknown_dictionary.lookup(head_char.toString());
        if (vocabulary == null || vocabulary.length === 0 || head_char_class.is_always_invoke === 1) {
            // Process unknown word
            key = head_char;
            if (head_char_class.is_grouping === 1 && 1 < surrogate_aware_tail.length) {
                for (var k = 1; k < surrogate_aware_tail.length; k++) {
                    var next_char = surrogate_aware_tail.charAt(k);
                    var next_char_class = this.unknown_dictionary.lookup(next_char);
                    if (head_char_class.class_name !== next_char_class.class_name) {
                        break;
                    }
                    key += next_char;
                }
            }

            var unk_ids = this.unknown_dictionary.target_map[head_char_class.class_id];
            for (var j = 0; j < unk_ids.length; j++) {
                var unk_id = parseInt(unk_ids[j]);

                left_id = this.unknown_dictionary.dictionary.getShort(unk_id);
                right_id = this.unknown_dictionary.dictionary.getShort(unk_id + 2);
                word_cost = this.unknown_dictionary.dictionary.getShort(unk_id + 4);

                // node_name, cost, start_index, length, type, left_id, right_id, surface_form
                lattice.append(new ViterbiNode(unk_id, word_cost, pos + 1, key.length, "UNKNOWN", left_id, right_id, key.toString()));
            }
        }
    }
    lattice.appendEos();

    return lattice;
};


module.exports = ViterbiBuilder;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXRlcmJpL1ZpdGVyYmlCdWlsZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBWaXRlcmJpTm9kZSA9IHJlcXVpcmUoXCIuL1ZpdGVyYmlOb2RlLmpzXCIpO1xudmFyIFZpdGVyYmlMYXR0aWNlID0gcmVxdWlyZShcIi4vVml0ZXJiaUxhdHRpY2UuanNcIik7XG52YXIgU3Vycm9nYXRlQXdhcmVTdHJpbmcgPSByZXF1aXJlKFwiLi4vdXRpbC9TdXJyb2dhdGVBd2FyZVN0cmluZy5qc1wiKTtcblxuXG4vKipcbiAqIFZpdGVyYmlCdWlsZGVyIGJ1aWxkcyB3b3JkIGxhdHRpY2UgKFZpdGVyYmlMYXR0aWNlKVxuICogQHBhcmFtIHtEeW5hbWljRGljdGlvbmFyaWVzfSBkaWMgZGljdGlvbmFyeVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFZpdGVyYmlCdWlsZGVyKGRpYykge1xuICAgIHRoaXMudHJpZSA9IGRpYy50cmllO1xuICAgIHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5ID0gZGljLnRva2VuX2luZm9fZGljdGlvbmFyeTtcbiAgICB0aGlzLnVua25vd25fZGljdGlvbmFyeSA9IGRpYy51bmtub3duX2RpY3Rpb25hcnk7XG59XG5cbi8qKlxuICogQnVpbGQgd29yZCBsYXR0aWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gc2VudGVuY2Vfc3RyIElucHV0IHRleHRcbiAqIEByZXR1cm5zIHtWaXRlcmJpTGF0dGljZX0gV29yZCBsYXR0aWNlXG4gKi9cblZpdGVyYmlCdWlsZGVyLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uIChzZW50ZW5jZV9zdHIpIHtcbiAgICB2YXIgbGF0dGljZSA9IG5ldyBWaXRlcmJpTGF0dGljZSgpO1xuICAgIHZhciBzZW50ZW5jZSA9IG5ldyBTdXJyb2dhdGVBd2FyZVN0cmluZyhzZW50ZW5jZV9zdHIpO1xuXG4gICAgdmFyIGtleSwgdHJpZV9pZCwgbGVmdF9pZCwgcmlnaHRfaWQsIHdvcmRfY29zdDtcbiAgICBmb3IgKHZhciBwb3MgPSAwOyBwb3MgPCBzZW50ZW5jZS5sZW5ndGg7IHBvcysrKSB7XG4gICAgICAgIHZhciB0YWlsID0gc2VudGVuY2Uuc2xpY2UocG9zKTtcbiAgICAgICAgdmFyIHZvY2FidWxhcnkgPSB0aGlzLnRyaWUuY29tbW9uUHJlZml4U2VhcmNoKHRhaWwpO1xuICAgICAgICBmb3IgKHZhciBuID0gMDsgbiA8IHZvY2FidWxhcnkubGVuZ3RoOyBuKyspIHsgIC8vIFdvcmRzIGluIGRpY3Rpb25hcnkgZG8gbm90IGhhdmUgc3Vycm9nYXRlIHBhaXIgKG9ubHkgVUNTMiBzZXQpXG4gICAgICAgICAgICB0cmllX2lkID0gdm9jYWJ1bGFyeVtuXS52O1xuICAgICAgICAgICAga2V5ID0gdm9jYWJ1bGFyeVtuXS5rO1xuXG4gICAgICAgICAgICB2YXIgdG9rZW5faW5mb19pZHMgPSB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeS50YXJnZXRfbWFwW3RyaWVfaWRdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbl9pbmZvX2lkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciB0b2tlbl9pbmZvX2lkID0gcGFyc2VJbnQodG9rZW5faW5mb19pZHNbaV0pO1xuXG4gICAgICAgICAgICAgICAgbGVmdF9pZCA9IHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LmRpY3Rpb25hcnkuZ2V0U2hvcnQodG9rZW5faW5mb19pZCk7XG4gICAgICAgICAgICAgICAgcmlnaHRfaWQgPSB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeS5kaWN0aW9uYXJ5LmdldFNob3J0KHRva2VuX2luZm9faWQgKyAyKTtcbiAgICAgICAgICAgICAgICB3b3JkX2Nvc3QgPSB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeS5kaWN0aW9uYXJ5LmdldFNob3J0KHRva2VuX2luZm9faWQgKyA0KTtcblxuICAgICAgICAgICAgICAgIC8vIG5vZGVfbmFtZSwgY29zdCwgc3RhcnRfaW5kZXgsIGxlbmd0aCwgdHlwZSwgbGVmdF9pZCwgcmlnaHRfaWQsIHN1cmZhY2VfZm9ybVxuICAgICAgICAgICAgICAgIGxhdHRpY2UuYXBwZW5kKG5ldyBWaXRlcmJpTm9kZSh0b2tlbl9pbmZvX2lkLCB3b3JkX2Nvc3QsIHBvcyArIDEsIGtleS5sZW5ndGgsIFwiS05PV05cIiwgbGVmdF9pZCwgcmlnaHRfaWQsIGtleSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVW5rbm93biB3b3JkIHByb2Nlc3NpbmdcbiAgICAgICAgdmFyIHN1cnJvZ2F0ZV9hd2FyZV90YWlsID0gbmV3IFN1cnJvZ2F0ZUF3YXJlU3RyaW5nKHRhaWwpO1xuICAgICAgICB2YXIgaGVhZF9jaGFyID0gbmV3IFN1cnJvZ2F0ZUF3YXJlU3RyaW5nKHN1cnJvZ2F0ZV9hd2FyZV90YWlsLmNoYXJBdCgwKSk7XG4gICAgICAgIHZhciBoZWFkX2NoYXJfY2xhc3MgPSB0aGlzLnVua25vd25fZGljdGlvbmFyeS5sb29rdXAoaGVhZF9jaGFyLnRvU3RyaW5nKCkpO1xuICAgICAgICBpZiAodm9jYWJ1bGFyeSA9PSBudWxsIHx8IHZvY2FidWxhcnkubGVuZ3RoID09PSAwIHx8IGhlYWRfY2hhcl9jbGFzcy5pc19hbHdheXNfaW52b2tlID09PSAxKSB7XG4gICAgICAgICAgICAvLyBQcm9jZXNzIHVua25vd24gd29yZFxuICAgICAgICAgICAga2V5ID0gaGVhZF9jaGFyO1xuICAgICAgICAgICAgaWYgKGhlYWRfY2hhcl9jbGFzcy5pc19ncm91cGluZyA9PT0gMSAmJiAxIDwgc3Vycm9nYXRlX2F3YXJlX3RhaWwubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDE7IGsgPCBzdXJyb2dhdGVfYXdhcmVfdGFpbC5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dF9jaGFyID0gc3Vycm9nYXRlX2F3YXJlX3RhaWwuY2hhckF0KGspO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV4dF9jaGFyX2NsYXNzID0gdGhpcy51bmtub3duX2RpY3Rpb25hcnkubG9va3VwKG5leHRfY2hhcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoZWFkX2NoYXJfY2xhc3MuY2xhc3NfbmFtZSAhPT0gbmV4dF9jaGFyX2NsYXNzLmNsYXNzX25hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGtleSArPSBuZXh0X2NoYXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdW5rX2lkcyA9IHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5LnRhcmdldF9tYXBbaGVhZF9jaGFyX2NsYXNzLmNsYXNzX2lkXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdW5rX2lkcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHZhciB1bmtfaWQgPSBwYXJzZUludCh1bmtfaWRzW2pdKTtcblxuICAgICAgICAgICAgICAgIGxlZnRfaWQgPSB0aGlzLnVua25vd25fZGljdGlvbmFyeS5kaWN0aW9uYXJ5LmdldFNob3J0KHVua19pZCk7XG4gICAgICAgICAgICAgICAgcmlnaHRfaWQgPSB0aGlzLnVua25vd25fZGljdGlvbmFyeS5kaWN0aW9uYXJ5LmdldFNob3J0KHVua19pZCArIDIpO1xuICAgICAgICAgICAgICAgIHdvcmRfY29zdCA9IHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5LmRpY3Rpb25hcnkuZ2V0U2hvcnQodW5rX2lkICsgNCk7XG5cbiAgICAgICAgICAgICAgICAvLyBub2RlX25hbWUsIGNvc3QsIHN0YXJ0X2luZGV4LCBsZW5ndGgsIHR5cGUsIGxlZnRfaWQsIHJpZ2h0X2lkLCBzdXJmYWNlX2Zvcm1cbiAgICAgICAgICAgICAgICBsYXR0aWNlLmFwcGVuZChuZXcgVml0ZXJiaU5vZGUodW5rX2lkLCB3b3JkX2Nvc3QsIHBvcyArIDEsIGtleS5sZW5ndGgsIFwiVU5LTk9XTlwiLCBsZWZ0X2lkLCByaWdodF9pZCwga2V5LnRvU3RyaW5nKCkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsYXR0aWNlLmFwcGVuZEVvcygpO1xuXG4gICAgcmV0dXJuIGxhdHRpY2U7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVml0ZXJiaUJ1aWxkZXI7XG4iXSwiZmlsZSI6InZpdGVyYmkvVml0ZXJiaUJ1aWxkZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==