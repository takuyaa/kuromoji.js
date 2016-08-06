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
var TokenInfoDictionary = require("./TokenInfoDictionary");
var ConnectionCosts = require("./ConnectionCosts");
var UnknownDictionary = require("./UnknownDictionary");

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
        this.connection_costs = new ConnectionCosts(0, 0);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0R5bmFtaWNEaWN0aW9uYXJpZXMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGRvdWJsZWFycmF5ID0gcmVxdWlyZShcImRvdWJsZWFycmF5XCIpO1xudmFyIFRva2VuSW5mb0RpY3Rpb25hcnkgPSByZXF1aXJlKFwiLi9Ub2tlbkluZm9EaWN0aW9uYXJ5XCIpO1xudmFyIENvbm5lY3Rpb25Db3N0cyA9IHJlcXVpcmUoXCIuL0Nvbm5lY3Rpb25Db3N0c1wiKTtcbnZhciBVbmtub3duRGljdGlvbmFyeSA9IHJlcXVpcmUoXCIuL1Vua25vd25EaWN0aW9uYXJ5XCIpO1xuXG4vKipcbiAqIERpY3Rpb25hcmllcyBjb250YWluZXIgZm9yIFRva2VuaXplclxuICogQHBhcmFtIHtEb3VibGVBcnJheX0gdHJpZVxuICogQHBhcmFtIHtUb2tlbkluZm9EaWN0aW9uYXJ5fSB0b2tlbl9pbmZvX2RpY3Rpb25hcnlcbiAqIEBwYXJhbSB7Q29ubmVjdGlvbkNvc3RzfSBjb25uZWN0aW9uX2Nvc3RzXG4gKiBAcGFyYW0ge1Vua25vd25EaWN0aW9uYXJ5fSB1bmtub3duX2RpY3Rpb25hcnlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBEeW5hbWljRGljdGlvbmFyaWVzKHRyaWUsIHRva2VuX2luZm9fZGljdGlvbmFyeSwgY29ubmVjdGlvbl9jb3N0cywgdW5rbm93bl9kaWN0aW9uYXJ5KSB7XG4gICAgaWYgKHRyaWUgIT0gbnVsbCkge1xuICAgICAgICB0aGlzLnRyaWUgPSB0cmllO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudHJpZSA9IGRvdWJsZWFycmF5LmJ1aWxkZXIoMCkuYnVpbGQoW1xuICAgICAgICAgICAge2s6IFwiXCIsIHY6IDF9XG4gICAgICAgIF0pO1xuICAgIH1cbiAgICBpZiAodG9rZW5faW5mb19kaWN0aW9uYXJ5ICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkgPSB0b2tlbl9pbmZvX2RpY3Rpb25hcnk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkgPSBuZXcgVG9rZW5JbmZvRGljdGlvbmFyeSgpO1xuICAgIH1cbiAgICBpZiAoY29ubmVjdGlvbl9jb3N0cyAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbl9jb3N0cyA9IGNvbm5lY3Rpb25fY29zdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gYmFja3dhcmRfc2l6ZSAqIGJhY2t3YXJkX3NpemVcbiAgICAgICAgdGhpcy5jb25uZWN0aW9uX2Nvc3RzID0gbmV3IENvbm5lY3Rpb25Db3N0cygwLCAwKTtcbiAgICB9XG4gICAgaWYgKHVua25vd25fZGljdGlvbmFyeSAhPSBudWxsKSB7XG4gICAgICAgIHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5ID0gdW5rbm93bl9kaWN0aW9uYXJ5O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMudW5rbm93bl9kaWN0aW9uYXJ5ID0gbmV3IFVua25vd25EaWN0aW9uYXJ5KCk7XG4gICAgfVxufVxuXG4vLyBmcm9tIGJhc2UuZGF0ICYgY2hlY2suZGF0XG5EeW5hbWljRGljdGlvbmFyaWVzLnByb3RvdHlwZS5sb2FkVHJpZSA9IGZ1bmN0aW9uIChiYXNlX2J1ZmZlciwgY2hlY2tfYnVmZmVyKSB7XG4gICAgdGhpcy50cmllID0gZG91YmxlYXJyYXkubG9hZChiYXNlX2J1ZmZlciwgY2hlY2tfYnVmZmVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbkR5bmFtaWNEaWN0aW9uYXJpZXMucHJvdG90eXBlLmxvYWRUb2tlbkluZm9EaWN0aW9uYXJpZXMgPSBmdW5jdGlvbiAodG9rZW5faW5mb19idWZmZXIsIHBvc19idWZmZXIsIHRhcmdldF9tYXBfYnVmZmVyKSB7XG4gICAgdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkubG9hZERpY3Rpb25hcnkodG9rZW5faW5mb19idWZmZXIpO1xuICAgIHRoaXMudG9rZW5faW5mb19kaWN0aW9uYXJ5LmxvYWRQb3NWZWN0b3IocG9zX2J1ZmZlcik7XG4gICAgdGhpcy50b2tlbl9pbmZvX2RpY3Rpb25hcnkubG9hZFRhcmdldE1hcCh0YXJnZXRfbWFwX2J1ZmZlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5EeW5hbWljRGljdGlvbmFyaWVzLnByb3RvdHlwZS5sb2FkQ29ubmVjdGlvbkNvc3RzID0gZnVuY3Rpb24gKGNjX2J1ZmZlcikge1xuICAgIHRoaXMuY29ubmVjdGlvbl9jb3N0cy5sb2FkQ29ubmVjdGlvbkNvc3RzKGNjX2J1ZmZlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5EeW5hbWljRGljdGlvbmFyaWVzLnByb3RvdHlwZS5sb2FkVW5rbm93bkRpY3Rpb25hcmllcyA9IGZ1bmN0aW9uICh1bmtfYnVmZmVyLCB1bmtfcG9zX2J1ZmZlciwgdW5rX21hcF9idWZmZXIsIGNhdF9tYXBfYnVmZmVyLCBjb21wYXRfY2F0X21hcF9idWZmZXIsIGludm9rZV9kZWZfYnVmZmVyKSB7XG4gICAgdGhpcy51bmtub3duX2RpY3Rpb25hcnkubG9hZFVua25vd25EaWN0aW9uYXJpZXModW5rX2J1ZmZlciwgdW5rX3Bvc19idWZmZXIsIHVua19tYXBfYnVmZmVyLCBjYXRfbWFwX2J1ZmZlciwgY29tcGF0X2NhdF9tYXBfYnVmZmVyLCBpbnZva2VfZGVmX2J1ZmZlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IER5bmFtaWNEaWN0aW9uYXJpZXM7XG4iXSwiZmlsZSI6ImRpY3QvRHluYW1pY0RpY3Rpb25hcmllcy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
