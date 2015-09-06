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

var ByteBuffer = require("../util/ByteBuffer.js");


/**
 * TokenInfoDictionary
 * @constructor
 */
function TokenInfoDictionary() {
    this.dictionary = new ByteBuffer(10 * 1024 * 1024);
    this.target_map = {};  // trie_id (of surface form) -> token_info_id (of token)
    this.pos_buffer = new ByteBuffer(10 * 1024 * 1024);
}

// left_id right_id word_cost ...
// ^ this position is token_info_id
TokenInfoDictionary.prototype.buildDictionary = function (entries) {
    var dictionary_entries = {};  // using as hashmap, string -> string (word_id -> surface_form) to build dictionary

    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];

        if (entry.length < 4) {
            continue;
        }

        var surface_form = entry[0];
        var left_id = entry[1];
        var right_id = entry[2];
        var word_cost = entry[3];
        var feature = entry.slice(4).join(",");  // TODO Optimize

        // Assertion
        if (!isFinite(left_id) || !isFinite(right_id) || !isFinite(word_cost)) {
            console.log(entry);
        }

        var token_info_id = this.put(left_id, right_id, word_cost, surface_form, feature);
        dictionary_entries[token_info_id] = surface_form;
    }

    // Remove last unused area
    this.dictionary.shrink();
    this.pos_buffer.shrink();

    return dictionary_entries;
};

TokenInfoDictionary.prototype.put = function (left_id, right_id, word_cost, surface_form, feature) {
    var token_info_id = this.dictionary.position;
    var pos_id = this.pos_buffer.position;

    this.dictionary.putShort(left_id);
    this.dictionary.putShort(right_id);
    this.dictionary.putShort(word_cost);
    this.dictionary.putInt(pos_id);
    this.pos_buffer.putString(surface_form + "," + feature);

    return token_info_id;
};

TokenInfoDictionary.prototype.addMapping = function (source, target) {
    var mapping = this.target_map[source];
    if (mapping == null) {
        mapping = [];
    }
    mapping.push(target);

    this.target_map[source] = mapping;
};

TokenInfoDictionary.prototype.targetMapToBuffer = function () {
    var buffer = new ByteBuffer();
    var map_keys_size = Object.keys(this.target_map).length;
    buffer.putInt(map_keys_size);
    for (var key in this.target_map) {
        var values = this.target_map[key];  // Array
        var map_values_size = values.length;
        buffer.putInt(parseInt(key));
        buffer.putInt(map_values_size);
        for (var i = 0; i < values.length; i++) {
            buffer.putInt(values[i]);
        }
    }
    return buffer.shrink();  // Shrink-ed Typed Array
};

// from tid.dat
TokenInfoDictionary.prototype.loadDictionary = function (array_buffer) {
    this.dictionary = new ByteBuffer(array_buffer);
    return this;
};

// from tid_pos.dat
TokenInfoDictionary.prototype.loadPosVector = function (array_buffer) {
    this.pos_buffer = new ByteBuffer(array_buffer);
    return this;
};

// from tid_map.dat
TokenInfoDictionary.prototype.loadTargetMap = function (array_buffer) {
    var buffer = new ByteBuffer(array_buffer);
    buffer.position = 0;
    this.target_map = {};
    buffer.readInt();  // map_keys_size
    while (true) {
        if (buffer.buffer.length < buffer.position + 1) {
            break;
        }
        var key = buffer.readInt();
        var map_values_size = buffer.readInt();
        for (var i = 0; i < map_values_size; i++) {
            var value = buffer.readInt();
            this.addMapping(key, value);
        }
    }
    return this;
};

/**
 * Look up features in the dictionary
 * @param {string} token_info_id_str Word ID to look up
 * @returns {string} Features string concatenated by ","
 */
TokenInfoDictionary.prototype.getFeatures = function (token_info_id_str) {
    var token_info_id = parseInt(token_info_id_str);
    if (isNaN(token_info_id)) {
        // TODO throw error
        return "";
    }
    var pos_id = this.dictionary.getInt(token_info_id + 6);
    return this.pos_buffer.getString(pos_id);
};


module.exports = TokenInfoDictionary;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L1Rva2VuSW5mb0RpY3Rpb25hcnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEJ5dGVCdWZmZXIgPSByZXF1aXJlKFwiLi4vdXRpbC9CeXRlQnVmZmVyLmpzXCIpO1xuXG5cbi8qKlxuICogVG9rZW5JbmZvRGljdGlvbmFyeVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRva2VuSW5mb0RpY3Rpb25hcnkoKSB7XG4gICAgdGhpcy5kaWN0aW9uYXJ5ID0gbmV3IEJ5dGVCdWZmZXIoMTAgKiAxMDI0ICogMTAyNCk7XG4gICAgdGhpcy50YXJnZXRfbWFwID0ge307ICAvLyB0cmllX2lkIChvZiBzdXJmYWNlIGZvcm0pIC0+IHRva2VuX2luZm9faWQgKG9mIHRva2VuKVxuICAgIHRoaXMucG9zX2J1ZmZlciA9IG5ldyBCeXRlQnVmZmVyKDEwICogMTAyNCAqIDEwMjQpO1xufVxuXG4vLyBsZWZ0X2lkIHJpZ2h0X2lkIHdvcmRfY29zdCAuLi5cbi8vIF4gdGhpcyBwb3NpdGlvbiBpcyB0b2tlbl9pbmZvX2lkXG5Ub2tlbkluZm9EaWN0aW9uYXJ5LnByb3RvdHlwZS5idWlsZERpY3Rpb25hcnkgPSBmdW5jdGlvbiAoZW50cmllcykge1xuICAgIHZhciBkaWN0aW9uYXJ5X2VudHJpZXMgPSB7fTsgIC8vIHVzaW5nIGFzIGhhc2htYXAsIHN0cmluZyAtPiBzdHJpbmcgKHdvcmRfaWQgLT4gc3VyZmFjZV9mb3JtKSB0byBidWlsZCBkaWN0aW9uYXJ5XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGVudHJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gZW50cmllc1tpXTtcblxuICAgICAgICBpZiAoZW50cnkubGVuZ3RoIDwgNCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3VyZmFjZV9mb3JtID0gZW50cnlbMF07XG4gICAgICAgIHZhciBsZWZ0X2lkID0gZW50cnlbMV07XG4gICAgICAgIHZhciByaWdodF9pZCA9IGVudHJ5WzJdO1xuICAgICAgICB2YXIgd29yZF9jb3N0ID0gZW50cnlbM107XG4gICAgICAgIHZhciBmZWF0dXJlID0gZW50cnkuc2xpY2UoNCkuam9pbihcIixcIik7ICAvLyBUT0RPIE9wdGltaXplXG5cbiAgICAgICAgLy8gQXNzZXJ0aW9uXG4gICAgICAgIGlmICghaXNGaW5pdGUobGVmdF9pZCkgfHwgIWlzRmluaXRlKHJpZ2h0X2lkKSB8fCAhaXNGaW5pdGUod29yZF9jb3N0KSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZW50cnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHRva2VuX2luZm9faWQgPSB0aGlzLnB1dChsZWZ0X2lkLCByaWdodF9pZCwgd29yZF9jb3N0LCBzdXJmYWNlX2Zvcm0sIGZlYXR1cmUpO1xuICAgICAgICBkaWN0aW9uYXJ5X2VudHJpZXNbdG9rZW5faW5mb19pZF0gPSBzdXJmYWNlX2Zvcm07XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGxhc3QgdW51c2VkIGFyZWFcbiAgICB0aGlzLmRpY3Rpb25hcnkuc2hyaW5rKCk7XG4gICAgdGhpcy5wb3NfYnVmZmVyLnNocmluaygpO1xuXG4gICAgcmV0dXJuIGRpY3Rpb25hcnlfZW50cmllcztcbn07XG5cblRva2VuSW5mb0RpY3Rpb25hcnkucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uIChsZWZ0X2lkLCByaWdodF9pZCwgd29yZF9jb3N0LCBzdXJmYWNlX2Zvcm0sIGZlYXR1cmUpIHtcbiAgICB2YXIgdG9rZW5faW5mb19pZCA9IHRoaXMuZGljdGlvbmFyeS5wb3NpdGlvbjtcbiAgICB2YXIgcG9zX2lkID0gdGhpcy5wb3NfYnVmZmVyLnBvc2l0aW9uO1xuXG4gICAgdGhpcy5kaWN0aW9uYXJ5LnB1dFNob3J0KGxlZnRfaWQpO1xuICAgIHRoaXMuZGljdGlvbmFyeS5wdXRTaG9ydChyaWdodF9pZCk7XG4gICAgdGhpcy5kaWN0aW9uYXJ5LnB1dFNob3J0KHdvcmRfY29zdCk7XG4gICAgdGhpcy5kaWN0aW9uYXJ5LnB1dEludChwb3NfaWQpO1xuICAgIHRoaXMucG9zX2J1ZmZlci5wdXRTdHJpbmcoc3VyZmFjZV9mb3JtICsgXCIsXCIgKyBmZWF0dXJlKTtcblxuICAgIHJldHVybiB0b2tlbl9pbmZvX2lkO1xufTtcblxuVG9rZW5JbmZvRGljdGlvbmFyeS5wcm90b3R5cGUuYWRkTWFwcGluZyA9IGZ1bmN0aW9uIChzb3VyY2UsIHRhcmdldCkge1xuICAgIHZhciBtYXBwaW5nID0gdGhpcy50YXJnZXRfbWFwW3NvdXJjZV07XG4gICAgaWYgKG1hcHBpbmcgPT0gbnVsbCkge1xuICAgICAgICBtYXBwaW5nID0gW107XG4gICAgfVxuICAgIG1hcHBpbmcucHVzaCh0YXJnZXQpO1xuXG4gICAgdGhpcy50YXJnZXRfbWFwW3NvdXJjZV0gPSBtYXBwaW5nO1xufTtcblxuVG9rZW5JbmZvRGljdGlvbmFyeS5wcm90b3R5cGUudGFyZ2V0TWFwVG9CdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJ1ZmZlciA9IG5ldyBCeXRlQnVmZmVyKCk7XG4gICAgdmFyIG1hcF9rZXlzX3NpemUgPSBPYmplY3Qua2V5cyh0aGlzLnRhcmdldF9tYXApLmxlbmd0aDtcbiAgICBidWZmZXIucHV0SW50KG1hcF9rZXlzX3NpemUpO1xuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLnRhcmdldF9tYXApIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IHRoaXMudGFyZ2V0X21hcFtrZXldOyAgLy8gQXJyYXlcbiAgICAgICAgdmFyIG1hcF92YWx1ZXNfc2l6ZSA9IHZhbHVlcy5sZW5ndGg7XG4gICAgICAgIGJ1ZmZlci5wdXRJbnQocGFyc2VJbnQoa2V5KSk7XG4gICAgICAgIGJ1ZmZlci5wdXRJbnQobWFwX3ZhbHVlc19zaXplKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGJ1ZmZlci5wdXRJbnQodmFsdWVzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYnVmZmVyLnNocmluaygpOyAgLy8gU2hyaW5rLWVkIFR5cGVkIEFycmF5XG59O1xuXG4vLyBmcm9tIHRpZC5kYXRcblRva2VuSW5mb0RpY3Rpb25hcnkucHJvdG90eXBlLmxvYWREaWN0aW9uYXJ5ID0gZnVuY3Rpb24gKGFycmF5X2J1ZmZlcikge1xuICAgIHRoaXMuZGljdGlvbmFyeSA9IG5ldyBCeXRlQnVmZmVyKGFycmF5X2J1ZmZlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBmcm9tIHRpZF9wb3MuZGF0XG5Ub2tlbkluZm9EaWN0aW9uYXJ5LnByb3RvdHlwZS5sb2FkUG9zVmVjdG9yID0gZnVuY3Rpb24gKGFycmF5X2J1ZmZlcikge1xuICAgIHRoaXMucG9zX2J1ZmZlciA9IG5ldyBCeXRlQnVmZmVyKGFycmF5X2J1ZmZlcik7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBmcm9tIHRpZF9tYXAuZGF0XG5Ub2tlbkluZm9EaWN0aW9uYXJ5LnByb3RvdHlwZS5sb2FkVGFyZ2V0TWFwID0gZnVuY3Rpb24gKGFycmF5X2J1ZmZlcikge1xuICAgIHZhciBidWZmZXIgPSBuZXcgQnl0ZUJ1ZmZlcihhcnJheV9idWZmZXIpO1xuICAgIGJ1ZmZlci5wb3NpdGlvbiA9IDA7XG4gICAgdGhpcy50YXJnZXRfbWFwID0ge307XG4gICAgYnVmZmVyLnJlYWRJbnQoKTsgIC8vIG1hcF9rZXlzX3NpemVcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAoYnVmZmVyLmJ1ZmZlci5sZW5ndGggPCBidWZmZXIucG9zaXRpb24gKyAxKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5ID0gYnVmZmVyLnJlYWRJbnQoKTtcbiAgICAgICAgdmFyIG1hcF92YWx1ZXNfc2l6ZSA9IGJ1ZmZlci5yZWFkSW50KCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWFwX3ZhbHVlc19zaXplOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGJ1ZmZlci5yZWFkSW50KCk7XG4gICAgICAgICAgICB0aGlzLmFkZE1hcHBpbmcoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIExvb2sgdXAgZmVhdHVyZXMgaW4gdGhlIGRpY3Rpb25hcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbl9pbmZvX2lkX3N0ciBXb3JkIElEIHRvIGxvb2sgdXBcbiAqIEByZXR1cm5zIHtzdHJpbmd9IEZlYXR1cmVzIHN0cmluZyBjb25jYXRlbmF0ZWQgYnkgXCIsXCJcbiAqL1xuVG9rZW5JbmZvRGljdGlvbmFyeS5wcm90b3R5cGUuZ2V0RmVhdHVyZXMgPSBmdW5jdGlvbiAodG9rZW5faW5mb19pZF9zdHIpIHtcbiAgICB2YXIgdG9rZW5faW5mb19pZCA9IHBhcnNlSW50KHRva2VuX2luZm9faWRfc3RyKTtcbiAgICBpZiAoaXNOYU4odG9rZW5faW5mb19pZCkpIHtcbiAgICAgICAgLy8gVE9ETyB0aHJvdyBlcnJvclxuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgdmFyIHBvc19pZCA9IHRoaXMuZGljdGlvbmFyeS5nZXRJbnQodG9rZW5faW5mb19pZCArIDYpO1xuICAgIHJldHVybiB0aGlzLnBvc19idWZmZXIuZ2V0U3RyaW5nKHBvc19pZCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVG9rZW5JbmZvRGljdGlvbmFyeTtcbiJdLCJmaWxlIjoiZGljdC9Ub2tlbkluZm9EaWN0aW9uYXJ5LmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=