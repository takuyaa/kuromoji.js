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

var ViterbiNode = require("./ViterbiNode");
var ViterbiLattice = require("./ViterbiLattice");
var SurrogateAwareString = require("../util/SurrogateAwareString");

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXRlcmJpL1ZpdGVyYmlCdWlsZGVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBWaXRlcmJpTm9kZSA9IHJlcXVpcmUoXCIuL1ZpdGVyYmlOb2RlXCIpO1xudmFyIFZpdGVyYmlMYXR0aWNlID0gcmVxdWlyZShcIi4vVml0ZXJiaUxhdHRpY2VcIik7XG52YXIgU3Vycm9nYXRlQXdhcmVTdHJpbmcgPSByZXF1aXJlKFwiLi4vdXRpbC9TdXJyb2dhdGVBd2FyZVN0cmluZ1wiKTtcblxuLyoqXG4gKiBWaXRlcmJpQnVpbGRlciBidWlsZHMgd29yZCBsYXR0aWNlIChWaXRlcmJpTGF0dGljZSlcbiAqIEBwYXJhbSB7RHluYW1pY0RpY3Rpb25hcmllc30gZGljIGRpY3Rpb25hcnlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBWaXRlcmJpQnVpbGRlcihkaWMpIHtcbiAgICB0aGlzLnRyaWUgPSBkaWMudHJpZTtcbiAgICB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeSA9IGRpYy50b2tlbl9pbmZvX2RpY3Rpb25hcnk7XG4gICAgdGhpcy51bmtub3duX2RpY3Rpb25hcnkgPSBkaWMudW5rbm93bl9kaWN0aW9uYXJ5O1xufVxuXG4vKipcbiAqIEJ1aWxkIHdvcmQgbGF0dGljZVxuICogQHBhcmFtIHtzdHJpbmd9IHNlbnRlbmNlX3N0ciBJbnB1dCB0ZXh0XG4gKiBAcmV0dXJucyB7Vml0ZXJiaUxhdHRpY2V9IFdvcmQgbGF0dGljZVxuICovXG5WaXRlcmJpQnVpbGRlci5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbiAoc2VudGVuY2Vfc3RyKSB7XG4gICAgdmFyIGxhdHRpY2UgPSBuZXcgVml0ZXJiaUxhdHRpY2UoKTtcbiAgICB2YXIgc2VudGVuY2UgPSBuZXcgU3Vycm9nYXRlQXdhcmVTdHJpbmcoc2VudGVuY2Vfc3RyKTtcblxuICAgIHZhciBrZXksIHRyaWVfaWQsIGxlZnRfaWQsIHJpZ2h0X2lkLCB3b3JkX2Nvc3Q7XG4gICAgZm9yICh2YXIgcG9zID0gMDsgcG9zIDwgc2VudGVuY2UubGVuZ3RoOyBwb3MrKykge1xuICAgICAgICB2YXIgdGFpbCA9IHNlbnRlbmNlLnNsaWNlKHBvcyk7XG4gICAgICAgIHZhciB2b2NhYnVsYXJ5ID0gdGhpcy50cmllLmNvbW1vblByZWZpeFNlYXJjaCh0YWlsKTtcbiAgICAgICAgZm9yICh2YXIgbiA9IDA7IG4gPCB2b2NhYnVsYXJ5Lmxlbmd0aDsgbisrKSB7ICAvLyBXb3JkcyBpbiBkaWN0aW9uYXJ5IGRvIG5vdCBoYXZlIHN1cnJvZ2F0ZSBwYWlyIChvbmx5IFVDUzIgc2V0KVxuICAgICAgICAgICAgdHJpZV9pZCA9IHZvY2FidWxhcnlbbl0udjtcbiAgICAgICAgICAgIGtleSA9IHZvY2FidWxhcnlbbl0uaztcblxuICAgICAgICAgICAgdmFyIHRva2VuX2luZm9faWRzID0gdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkudGFyZ2V0X21hcFt0cmllX2lkXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5faW5mb19pZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdG9rZW5faW5mb19pZCA9IHBhcnNlSW50KHRva2VuX2luZm9faWRzW2ldKTtcblxuICAgICAgICAgICAgICAgIGxlZnRfaWQgPSB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeS5kaWN0aW9uYXJ5LmdldFNob3J0KHRva2VuX2luZm9faWQpO1xuICAgICAgICAgICAgICAgIHJpZ2h0X2lkID0gdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkuZGljdGlvbmFyeS5nZXRTaG9ydCh0b2tlbl9pbmZvX2lkICsgMik7XG4gICAgICAgICAgICAgICAgd29yZF9jb3N0ID0gdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkuZGljdGlvbmFyeS5nZXRTaG9ydCh0b2tlbl9pbmZvX2lkICsgNCk7XG5cbiAgICAgICAgICAgICAgICAvLyBub2RlX25hbWUsIGNvc3QsIHN0YXJ0X2luZGV4LCBsZW5ndGgsIHR5cGUsIGxlZnRfaWQsIHJpZ2h0X2lkLCBzdXJmYWNlX2Zvcm1cbiAgICAgICAgICAgICAgICBsYXR0aWNlLmFwcGVuZChuZXcgVml0ZXJiaU5vZGUodG9rZW5faW5mb19pZCwgd29yZF9jb3N0LCBwb3MgKyAxLCBrZXkubGVuZ3RoLCBcIktOT1dOXCIsIGxlZnRfaWQsIHJpZ2h0X2lkLCBrZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVua25vd24gd29yZCBwcm9jZXNzaW5nXG4gICAgICAgIHZhciBzdXJyb2dhdGVfYXdhcmVfdGFpbCA9IG5ldyBTdXJyb2dhdGVBd2FyZVN0cmluZyh0YWlsKTtcbiAgICAgICAgdmFyIGhlYWRfY2hhciA9IG5ldyBTdXJyb2dhdGVBd2FyZVN0cmluZyhzdXJyb2dhdGVfYXdhcmVfdGFpbC5jaGFyQXQoMCkpO1xuICAgICAgICB2YXIgaGVhZF9jaGFyX2NsYXNzID0gdGhpcy51bmtub3duX2RpY3Rpb25hcnkubG9va3VwKGhlYWRfY2hhci50b1N0cmluZygpKTtcbiAgICAgICAgaWYgKHZvY2FidWxhcnkgPT0gbnVsbCB8fCB2b2NhYnVsYXJ5Lmxlbmd0aCA9PT0gMCB8fCBoZWFkX2NoYXJfY2xhc3MuaXNfYWx3YXlzX2ludm9rZSA9PT0gMSkge1xuICAgICAgICAgICAgLy8gUHJvY2VzcyB1bmtub3duIHdvcmRcbiAgICAgICAgICAgIGtleSA9IGhlYWRfY2hhcjtcbiAgICAgICAgICAgIGlmIChoZWFkX2NoYXJfY2xhc3MuaXNfZ3JvdXBpbmcgPT09IDEgJiYgMSA8IHN1cnJvZ2F0ZV9hd2FyZV90YWlsLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSAxOyBrIDwgc3Vycm9nYXRlX2F3YXJlX3RhaWwubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRfY2hhciA9IHN1cnJvZ2F0ZV9hd2FyZV90YWlsLmNoYXJBdChrKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRfY2hhcl9jbGFzcyA9IHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5Lmxvb2t1cChuZXh0X2NoYXIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaGVhZF9jaGFyX2NsYXNzLmNsYXNzX25hbWUgIT09IG5leHRfY2hhcl9jbGFzcy5jbGFzc19uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBrZXkgKz0gbmV4dF9jaGFyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHVua19pZHMgPSB0aGlzLnVua25vd25fZGljdGlvbmFyeS50YXJnZXRfbWFwW2hlYWRfY2hhcl9jbGFzcy5jbGFzc19pZF07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHVua19pZHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdW5rX2lkID0gcGFyc2VJbnQodW5rX2lkc1tqXSk7XG5cbiAgICAgICAgICAgICAgICBsZWZ0X2lkID0gdGhpcy51bmtub3duX2RpY3Rpb25hcnkuZGljdGlvbmFyeS5nZXRTaG9ydCh1bmtfaWQpO1xuICAgICAgICAgICAgICAgIHJpZ2h0X2lkID0gdGhpcy51bmtub3duX2RpY3Rpb25hcnkuZGljdGlvbmFyeS5nZXRTaG9ydCh1bmtfaWQgKyAyKTtcbiAgICAgICAgICAgICAgICB3b3JkX2Nvc3QgPSB0aGlzLnVua25vd25fZGljdGlvbmFyeS5kaWN0aW9uYXJ5LmdldFNob3J0KHVua19pZCArIDQpO1xuXG4gICAgICAgICAgICAgICAgLy8gbm9kZV9uYW1lLCBjb3N0LCBzdGFydF9pbmRleCwgbGVuZ3RoLCB0eXBlLCBsZWZ0X2lkLCByaWdodF9pZCwgc3VyZmFjZV9mb3JtXG4gICAgICAgICAgICAgICAgbGF0dGljZS5hcHBlbmQobmV3IFZpdGVyYmlOb2RlKHVua19pZCwgd29yZF9jb3N0LCBwb3MgKyAxLCBrZXkubGVuZ3RoLCBcIlVOS05PV05cIiwgbGVmdF9pZCwgcmlnaHRfaWQsIGtleS50b1N0cmluZygpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGF0dGljZS5hcHBlbmRFb3MoKTtcblxuICAgIHJldHVybiBsYXR0aWNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaXRlcmJpQnVpbGRlcjtcbiJdLCJmaWxlIjoidml0ZXJiaS9WaXRlcmJpQnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
