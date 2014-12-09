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

var TokenInfoDictionary = require("./TokenInfoDictionary.js");
var ConnectionCosts = require("./ConnectionCosts.js");
var UnknownDictionary = require("./UnknownDictionary.js");


/**
 * Dictionaries container for Tokenizer
 * @param {DoubleArray} trie
 * @param {TokenInfoDictionary} token_info_dictionary
 * @param {ConnectionCosts} connection_costs
 * @param {UnknownDictionary} unknown_dictionary
 * @constructor
 */
function DynamicDictionaries(trie, token_info_dictionary, connection_costs, unknown_dictionary) {
    if (trie != null) {
        this.trie = trie;
    } else {
        this.trie = doublearray.builder(0).build([
            {k: "", v: 1}
        ]);
    }
    if (token_info_dictionary != null) {
        this.token_info_dictionary = token_info_dictionary;
    } else {
        this.token_info_dictionary = new TokenInfoDictionary();
    }
    if (connection_costs != null) {
        this.connection_costs = connection_costs;
    } else {
        // backward_size * backward_size
        this.connection_costs = new ConnectionCosts(0);
    }
    if (unknown_dictionary != null) {
        this.unknown_dictionary = unknown_dictionary;
    } else {
        this.unknown_dictionary = new UnknownDictionary();
    }
}

// from base.dat & check.dat
DynamicDictionaries.prototype.loadTrie = function (base_buffer, check_buffer) {
    this.trie = doublearray.load(base_buffer, check_buffer);
    return this;
};

DynamicDictionaries.prototype.loadTokenInfoDictionaries = function (token_info_buffer, pos_buffer, target_map_buffer) {
    this.token_info_dictionary.loadDictionary(token_info_buffer);
    this.token_info_dictionary.loadPosVector(pos_buffer);
    this.token_info_dictionary.loadTargetMap(target_map_buffer);
    return this;
};

DynamicDictionaries.prototype.loadConnectionCosts = function (cc_buffer) {
    this.connection_costs.loadConnectionCosts(cc_buffer);
    return this;
};

DynamicDictionaries.prototype.loadUnknownDictionaries = function (unk_buffer, unk_pos_buffer, unk_map_buffer, cat_map_buffer, compat_cat_map_buffer, invoke_def_buffer) {
    this.unknown_dictionary.loadUnknownDictionaries(unk_buffer, unk_pos_buffer, unk_map_buffer, cat_map_buffer, compat_cat_map_buffer, invoke_def_buffer);
    return this;
};


module.exports = DynamicDictionaries;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdC9EeW5hbWljRGljdGlvbmFyaWVzLmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsiZGljdC9EeW5hbWljRGljdGlvbmFyaWVzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBkb3VibGVhcnJheSA9IHJlcXVpcmUoXCJkb3VibGVhcnJheVwiKTtcblxudmFyIFRva2VuSW5mb0RpY3Rpb25hcnkgPSByZXF1aXJlKFwiLi9Ub2tlbkluZm9EaWN0aW9uYXJ5LmpzXCIpO1xudmFyIENvbm5lY3Rpb25Db3N0cyA9IHJlcXVpcmUoXCIuL0Nvbm5lY3Rpb25Db3N0cy5qc1wiKTtcbnZhciBVbmtub3duRGljdGlvbmFyeSA9IHJlcXVpcmUoXCIuL1Vua25vd25EaWN0aW9uYXJ5LmpzXCIpO1xuXG5cbi8qKlxuICogRGljdGlvbmFyaWVzIGNvbnRhaW5lciBmb3IgVG9rZW5pemVyXG4gKiBAcGFyYW0ge0RvdWJsZUFycmF5fSB0cmllXG4gKiBAcGFyYW0ge1Rva2VuSW5mb0RpY3Rpb25hcnl9IHRva2VuX2luZm9fZGljdGlvbmFyeVxuICogQHBhcmFtIHtDb25uZWN0aW9uQ29zdHN9IGNvbm5lY3Rpb25fY29zdHNcbiAqIEBwYXJhbSB7VW5rbm93bkRpY3Rpb25hcnl9IHVua25vd25fZGljdGlvbmFyeVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIER5bmFtaWNEaWN0aW9uYXJpZXModHJpZSwgdG9rZW5faW5mb19kaWN0aW9uYXJ5LCBjb25uZWN0aW9uX2Nvc3RzLCB1bmtub3duX2RpY3Rpb25hcnkpIHtcbiAgICBpZiAodHJpZSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMudHJpZSA9IHRyaWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50cmllID0gZG91YmxlYXJyYXkuYnVpbGRlcigwKS5idWlsZChbXG4gICAgICAgICAgICB7azogXCJcIiwgdjogMX1cbiAgICAgICAgXSk7XG4gICAgfVxuICAgIGlmICh0b2tlbl9pbmZvX2RpY3Rpb25hcnkgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeSA9IHRva2VuX2luZm9fZGljdGlvbmFyeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeSA9IG5ldyBUb2tlbkluZm9EaWN0aW9uYXJ5KCk7XG4gICAgfVxuICAgIGlmIChjb25uZWN0aW9uX2Nvc3RzICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uX2Nvc3RzID0gY29ubmVjdGlvbl9jb3N0cztcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBiYWNrd2FyZF9zaXplICogYmFja3dhcmRfc2l6ZVxuICAgICAgICB0aGlzLmNvbm5lY3Rpb25fY29zdHMgPSBuZXcgQ29ubmVjdGlvbkNvc3RzKDApO1xuICAgIH1cbiAgICBpZiAodW5rbm93bl9kaWN0aW9uYXJ5ICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy51bmtub3duX2RpY3Rpb25hcnkgPSB1bmtub3duX2RpY3Rpb25hcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy51bmtub3duX2RpY3Rpb25hcnkgPSBuZXcgVW5rbm93bkRpY3Rpb25hcnkoKTtcbiAgICB9XG59XG5cbi8vIGZyb20gYmFzZS5kYXQgJiBjaGVjay5kYXRcbkR5bmFtaWNEaWN0aW9uYXJpZXMucHJvdG90eXBlLmxvYWRUcmllID0gZnVuY3Rpb24gKGJhc2VfYnVmZmVyLCBjaGVja19idWZmZXIpIHtcbiAgICB0aGlzLnRyaWUgPSBkb3VibGVhcnJheS5sb2FkKGJhc2VfYnVmZmVyLCBjaGVja19idWZmZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuRHluYW1pY0RpY3Rpb25hcmllcy5wcm90b3R5cGUubG9hZFRva2VuSW5mb0RpY3Rpb25hcmllcyA9IGZ1bmN0aW9uICh0b2tlbl9pbmZvX2J1ZmZlciwgcG9zX2J1ZmZlciwgdGFyZ2V0X21hcF9idWZmZXIpIHtcbiAgICB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeS5sb2FkRGljdGlvbmFyeSh0b2tlbl9pbmZvX2J1ZmZlcik7XG4gICAgdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkubG9hZFBvc1ZlY3Rvcihwb3NfYnVmZmVyKTtcbiAgICB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeS5sb2FkVGFyZ2V0TWFwKHRhcmdldF9tYXBfYnVmZmVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbkR5bmFtaWNEaWN0aW9uYXJpZXMucHJvdG90eXBlLmxvYWRDb25uZWN0aW9uQ29zdHMgPSBmdW5jdGlvbiAoY2NfYnVmZmVyKSB7XG4gICAgdGhpcy5jb25uZWN0aW9uX2Nvc3RzLmxvYWRDb25uZWN0aW9uQ29zdHMoY2NfYnVmZmVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbkR5bmFtaWNEaWN0aW9uYXJpZXMucHJvdG90eXBlLmxvYWRVbmtub3duRGljdGlvbmFyaWVzID0gZnVuY3Rpb24gKHVua19idWZmZXIsIHVua19wb3NfYnVmZmVyLCB1bmtfbWFwX2J1ZmZlciwgY2F0X21hcF9idWZmZXIsIGNvbXBhdF9jYXRfbWFwX2J1ZmZlciwgaW52b2tlX2RlZl9idWZmZXIpIHtcbiAgICB0aGlzLnVua25vd25fZGljdGlvbmFyeS5sb2FkVW5rbm93bkRpY3Rpb25hcmllcyh1bmtfYnVmZmVyLCB1bmtfcG9zX2J1ZmZlciwgdW5rX21hcF9idWZmZXIsIGNhdF9tYXBfYnVmZmVyLCBjb21wYXRfY2F0X21hcF9idWZmZXIsIGludm9rZV9kZWZfYnVmZmVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBEeW5hbWljRGljdGlvbmFyaWVzO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9