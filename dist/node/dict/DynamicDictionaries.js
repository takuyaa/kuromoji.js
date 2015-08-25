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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0R5bmFtaWNEaWN0aW9uYXJpZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGRvdWJsZWFycmF5ID0gcmVxdWlyZShcImRvdWJsZWFycmF5XCIpO1xuXG52YXIgVG9rZW5JbmZvRGljdGlvbmFyeSA9IHJlcXVpcmUoXCIuL1Rva2VuSW5mb0RpY3Rpb25hcnkuanNcIik7XG52YXIgQ29ubmVjdGlvbkNvc3RzID0gcmVxdWlyZShcIi4vQ29ubmVjdGlvbkNvc3RzLmpzXCIpO1xudmFyIFVua25vd25EaWN0aW9uYXJ5ID0gcmVxdWlyZShcIi4vVW5rbm93bkRpY3Rpb25hcnkuanNcIik7XG5cblxuLyoqXG4gKiBEaWN0aW9uYXJpZXMgY29udGFpbmVyIGZvciBUb2tlbml6ZXJcbiAqIEBwYXJhbSB7RG91YmxlQXJyYXl9IHRyaWVcbiAqIEBwYXJhbSB7VG9rZW5JbmZvRGljdGlvbmFyeX0gdG9rZW5faW5mb19kaWN0aW9uYXJ5XG4gKiBAcGFyYW0ge0Nvbm5lY3Rpb25Db3N0c30gY29ubmVjdGlvbl9jb3N0c1xuICogQHBhcmFtIHtVbmtub3duRGljdGlvbmFyeX0gdW5rbm93bl9kaWN0aW9uYXJ5XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRHluYW1pY0RpY3Rpb25hcmllcyh0cmllLCB0b2tlbl9pbmZvX2RpY3Rpb25hcnksIGNvbm5lY3Rpb25fY29zdHMsIHVua25vd25fZGljdGlvbmFyeSkge1xuICAgIGlmICh0cmllICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy50cmllID0gdHJpZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnRyaWUgPSBkb3VibGVhcnJheS5idWlsZGVyKDApLmJ1aWxkKFtcbiAgICAgICAgICAgIHtrOiBcIlwiLCB2OiAxfVxuICAgICAgICBdKTtcbiAgICB9XG4gICAgaWYgKHRva2VuX2luZm9fZGljdGlvbmFyeSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5ID0gdG9rZW5faW5mb19kaWN0aW9uYXJ5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5ID0gbmV3IFRva2VuSW5mb0RpY3Rpb25hcnkoKTtcbiAgICB9XG4gICAgaWYgKGNvbm5lY3Rpb25fY29zdHMgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb25fY29zdHMgPSBjb25uZWN0aW9uX2Nvc3RzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGJhY2t3YXJkX3NpemUgKiBiYWNrd2FyZF9zaXplXG4gICAgICAgIHRoaXMuY29ubmVjdGlvbl9jb3N0cyA9IG5ldyBDb25uZWN0aW9uQ29zdHMoMCk7XG4gICAgfVxuICAgIGlmICh1bmtub3duX2RpY3Rpb25hcnkgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnVua25vd25fZGljdGlvbmFyeSA9IHVua25vd25fZGljdGlvbmFyeTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnVua25vd25fZGljdGlvbmFyeSA9IG5ldyBVbmtub3duRGljdGlvbmFyeSgpO1xuICAgIH1cbn1cblxuLy8gZnJvbSBiYXNlLmRhdCAmIGNoZWNrLmRhdFxuRHluYW1pY0RpY3Rpb25hcmllcy5wcm90b3R5cGUubG9hZFRyaWUgPSBmdW5jdGlvbiAoYmFzZV9idWZmZXIsIGNoZWNrX2J1ZmZlcikge1xuICAgIHRoaXMudHJpZSA9IGRvdWJsZWFycmF5LmxvYWQoYmFzZV9idWZmZXIsIGNoZWNrX2J1ZmZlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5EeW5hbWljRGljdGlvbmFyaWVzLnByb3RvdHlwZS5sb2FkVG9rZW5JbmZvRGljdGlvbmFyaWVzID0gZnVuY3Rpb24gKHRva2VuX2luZm9fYnVmZmVyLCBwb3NfYnVmZmVyLCB0YXJnZXRfbWFwX2J1ZmZlcikge1xuICAgIHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LmxvYWREaWN0aW9uYXJ5KHRva2VuX2luZm9fYnVmZmVyKTtcbiAgICB0aGlzLnRva2VuX2luZm9fZGljdGlvbmFyeS5sb2FkUG9zVmVjdG9yKHBvc19idWZmZXIpO1xuICAgIHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LmxvYWRUYXJnZXRNYXAodGFyZ2V0X21hcF9idWZmZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuRHluYW1pY0RpY3Rpb25hcmllcy5wcm90b3R5cGUubG9hZENvbm5lY3Rpb25Db3N0cyA9IGZ1bmN0aW9uIChjY19idWZmZXIpIHtcbiAgICB0aGlzLmNvbm5lY3Rpb25fY29zdHMubG9hZENvbm5lY3Rpb25Db3N0cyhjY19idWZmZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuRHluYW1pY0RpY3Rpb25hcmllcy5wcm90b3R5cGUubG9hZFVua25vd25EaWN0aW9uYXJpZXMgPSBmdW5jdGlvbiAodW5rX2J1ZmZlciwgdW5rX3Bvc19idWZmZXIsIHVua19tYXBfYnVmZmVyLCBjYXRfbWFwX2J1ZmZlciwgY29tcGF0X2NhdF9tYXBfYnVmZmVyLCBpbnZva2VfZGVmX2J1ZmZlcikge1xuICAgIHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5LmxvYWRVbmtub3duRGljdGlvbmFyaWVzKHVua19idWZmZXIsIHVua19wb3NfYnVmZmVyLCB1bmtfbWFwX2J1ZmZlciwgY2F0X21hcF9idWZmZXIsIGNvbXBhdF9jYXRfbWFwX2J1ZmZlciwgaW52b2tlX2RlZl9idWZmZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IER5bmFtaWNEaWN0aW9uYXJpZXM7XG4iXSwiZmlsZSI6ImRpY3QvRHluYW1pY0RpY3Rpb25hcmllcy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9