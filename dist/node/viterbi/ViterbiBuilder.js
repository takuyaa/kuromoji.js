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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZXJiaS9WaXRlcmJpQnVpbGRlci5qcyIsIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzIjpbInZpdGVyYmkvVml0ZXJiaUJ1aWxkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFZpdGVyYmlOb2RlID0gcmVxdWlyZShcIi4vVml0ZXJiaU5vZGUuanNcIik7XG52YXIgVml0ZXJiaUxhdHRpY2UgPSByZXF1aXJlKFwiLi9WaXRlcmJpTGF0dGljZS5qc1wiKTtcbnZhciBTdXJyb2dhdGVBd2FyZVN0cmluZyA9IHJlcXVpcmUoXCIuLi91dGlsL1N1cnJvZ2F0ZUF3YXJlU3RyaW5nLmpzXCIpO1xuXG5cbi8qKlxuICogVml0ZXJiaUJ1aWxkZXIgYnVpbGRzIHdvcmQgbGF0dGljZSAoVml0ZXJiaUxhdHRpY2UpXG4gKiBAcGFyYW0ge0R5bmFtaWNEaWN0aW9uYXJpZXN9IGRpYyBkaWN0aW9uYXJ5XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVml0ZXJiaUJ1aWxkZXIoZGljKSB7XG4gICAgdGhpcy50cmllID0gZGljLnRyaWU7XG4gICAgdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkgPSBkaWMudG9rZW5faW5mb19kaWN0aW9uYXJ5O1xuICAgIHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5ID0gZGljLnVua25vd25fZGljdGlvbmFyeTtcbn1cblxuLyoqXG4gKiBCdWlsZCB3b3JkIGxhdHRpY2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBzZW50ZW5jZV9zdHIgSW5wdXQgdGV4dFxuICogQHJldHVybnMge1ZpdGVyYmlMYXR0aWNlfSBXb3JkIGxhdHRpY2VcbiAqL1xuVml0ZXJiaUJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24gKHNlbnRlbmNlX3N0cikge1xuICAgIHZhciBsYXR0aWNlID0gbmV3IFZpdGVyYmlMYXR0aWNlKCk7XG4gICAgdmFyIHNlbnRlbmNlID0gbmV3IFN1cnJvZ2F0ZUF3YXJlU3RyaW5nKHNlbnRlbmNlX3N0cik7XG5cbiAgICB2YXIga2V5LCB0cmllX2lkLCBsZWZ0X2lkLCByaWdodF9pZCwgd29yZF9jb3N0O1xuICAgIGZvciAodmFyIHBvcyA9IDA7IHBvcyA8IHNlbnRlbmNlLmxlbmd0aDsgcG9zKyspIHtcbiAgICAgICAgdmFyIHRhaWwgPSBzZW50ZW5jZS5zbGljZShwb3MpO1xuICAgICAgICB2YXIgdm9jYWJ1bGFyeSA9IHRoaXMudHJpZS5jb21tb25QcmVmaXhTZWFyY2godGFpbCk7XG4gICAgICAgIGZvciAodmFyIG4gPSAwOyBuIDwgdm9jYWJ1bGFyeS5sZW5ndGg7IG4rKykgeyAgLy8gV29yZHMgaW4gZGljdGlvbmFyeSBkbyBub3QgaGF2ZSBzdXJyb2dhdGUgcGFpciAob25seSBVQ1MyIHNldClcbiAgICAgICAgICAgIHRyaWVfaWQgPSB2b2NhYnVsYXJ5W25dLnY7XG4gICAgICAgICAgICBrZXkgPSB2b2NhYnVsYXJ5W25dLms7XG5cbiAgICAgICAgICAgIHZhciB0b2tlbl9pbmZvX2lkcyA9IHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LnRhcmdldF9tYXBbdHJpZV9pZF07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2VuX2luZm9faWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRva2VuX2luZm9faWQgPSBwYXJzZUludCh0b2tlbl9pbmZvX2lkc1tpXSk7XG5cbiAgICAgICAgICAgICAgICBsZWZ0X2lkID0gdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkuZGljdGlvbmFyeS5nZXRTaG9ydCh0b2tlbl9pbmZvX2lkKTtcbiAgICAgICAgICAgICAgICByaWdodF9pZCA9IHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LmRpY3Rpb25hcnkuZ2V0U2hvcnQodG9rZW5faW5mb19pZCArIDIpO1xuICAgICAgICAgICAgICAgIHdvcmRfY29zdCA9IHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LmRpY3Rpb25hcnkuZ2V0U2hvcnQodG9rZW5faW5mb19pZCArIDQpO1xuXG4gICAgICAgICAgICAgICAgLy8gbm9kZV9uYW1lLCBjb3N0LCBzdGFydF9pbmRleCwgbGVuZ3RoLCB0eXBlLCBsZWZ0X2lkLCByaWdodF9pZCwgc3VyZmFjZV9mb3JtXG4gICAgICAgICAgICAgICAgbGF0dGljZS5hcHBlbmQobmV3IFZpdGVyYmlOb2RlKHRva2VuX2luZm9faWQsIHdvcmRfY29zdCwgcG9zICsgMSwga2V5Lmxlbmd0aCwgXCJLTk9XTlwiLCBsZWZ0X2lkLCByaWdodF9pZCwga2V5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVbmtub3duIHdvcmQgcHJvY2Vzc2luZ1xuICAgICAgICB2YXIgc3Vycm9nYXRlX2F3YXJlX3RhaWwgPSBuZXcgU3Vycm9nYXRlQXdhcmVTdHJpbmcodGFpbCk7XG4gICAgICAgIHZhciBoZWFkX2NoYXIgPSBuZXcgU3Vycm9nYXRlQXdhcmVTdHJpbmcoc3Vycm9nYXRlX2F3YXJlX3RhaWwuY2hhckF0KDApKTtcbiAgICAgICAgdmFyIGhlYWRfY2hhcl9jbGFzcyA9IHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5Lmxvb2t1cChoZWFkX2NoYXIudG9TdHJpbmcoKSk7XG4gICAgICAgIGlmICh2b2NhYnVsYXJ5ID09IG51bGwgfHwgdm9jYWJ1bGFyeS5sZW5ndGggPT09IDAgfHwgaGVhZF9jaGFyX2NsYXNzLmlzX2Fsd2F5c19pbnZva2UgPT09IDEpIHtcbiAgICAgICAgICAgIC8vIFByb2Nlc3MgdW5rbm93biB3b3JkXG4gICAgICAgICAgICBrZXkgPSBoZWFkX2NoYXI7XG4gICAgICAgICAgICBpZiAoaGVhZF9jaGFyX2NsYXNzLmlzX2dyb3VwaW5nID09PSAxICYmIDEgPCBzdXJyb2dhdGVfYXdhcmVfdGFpbC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMTsgayA8IHN1cnJvZ2F0ZV9hd2FyZV90YWlsLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0X2NoYXIgPSBzdXJyb2dhdGVfYXdhcmVfdGFpbC5jaGFyQXQoayk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0X2NoYXJfY2xhc3MgPSB0aGlzLnVua25vd25fZGljdGlvbmFyeS5sb29rdXAobmV4dF9jaGFyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhlYWRfY2hhcl9jbGFzcy5jbGFzc19uYW1lICE9PSBuZXh0X2NoYXJfY2xhc3MuY2xhc3NfbmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAga2V5ICs9IG5leHRfY2hhcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB1bmtfaWRzID0gdGhpcy51bmtub3duX2RpY3Rpb25hcnkudGFyZ2V0X21hcFtoZWFkX2NoYXJfY2xhc3MuY2xhc3NfaWRdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB1bmtfaWRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVua19pZCA9IHBhcnNlSW50KHVua19pZHNbal0pO1xuXG4gICAgICAgICAgICAgICAgbGVmdF9pZCA9IHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5LmRpY3Rpb25hcnkuZ2V0U2hvcnQodW5rX2lkKTtcbiAgICAgICAgICAgICAgICByaWdodF9pZCA9IHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5LmRpY3Rpb25hcnkuZ2V0U2hvcnQodW5rX2lkICsgMik7XG4gICAgICAgICAgICAgICAgd29yZF9jb3N0ID0gdGhpcy51bmtub3duX2RpY3Rpb25hcnkuZGljdGlvbmFyeS5nZXRTaG9ydCh1bmtfaWQgKyA0KTtcblxuICAgICAgICAgICAgICAgIC8vIG5vZGVfbmFtZSwgY29zdCwgc3RhcnRfaW5kZXgsIGxlbmd0aCwgdHlwZSwgbGVmdF9pZCwgcmlnaHRfaWQsIHN1cmZhY2VfZm9ybVxuICAgICAgICAgICAgICAgIGxhdHRpY2UuYXBwZW5kKG5ldyBWaXRlcmJpTm9kZSh1bmtfaWQsIHdvcmRfY29zdCwgcG9zICsgMSwga2V5Lmxlbmd0aCwgXCJVTktOT1dOXCIsIGxlZnRfaWQsIHJpZ2h0X2lkLCBrZXkudG9TdHJpbmcoKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxhdHRpY2UuYXBwZW5kRW9zKCk7XG5cbiAgICByZXR1cm4gbGF0dGljZTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBWaXRlcmJpQnVpbGRlcjtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==