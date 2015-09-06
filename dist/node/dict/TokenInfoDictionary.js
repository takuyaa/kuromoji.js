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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdC9Ub2tlbkluZm9EaWN0aW9uYXJ5LmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsiZGljdC9Ub2tlbkluZm9EaWN0aW9uYXJ5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBCeXRlQnVmZmVyID0gcmVxdWlyZShcIi4uL3V0aWwvQnl0ZUJ1ZmZlci5qc1wiKTtcblxuXG4vKipcbiAqIFRva2VuSW5mb0RpY3Rpb25hcnlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBUb2tlbkluZm9EaWN0aW9uYXJ5KCkge1xuICAgIHRoaXMuZGljdGlvbmFyeSA9IG5ldyBCeXRlQnVmZmVyKDEwICogMTAyNCAqIDEwMjQpO1xuICAgIHRoaXMudGFyZ2V0X21hcCA9IHt9OyAgLy8gdHJpZV9pZCAob2Ygc3VyZmFjZSBmb3JtKSAtPiB0b2tlbl9pbmZvX2lkIChvZiB0b2tlbilcbiAgICB0aGlzLnBvc19idWZmZXIgPSBuZXcgQnl0ZUJ1ZmZlcigxMCAqIDEwMjQgKiAxMDI0KTtcbn1cblxuLy8gbGVmdF9pZCByaWdodF9pZCB3b3JkX2Nvc3QgLi4uXG4vLyBeIHRoaXMgcG9zaXRpb24gaXMgdG9rZW5faW5mb19pZFxuVG9rZW5JbmZvRGljdGlvbmFyeS5wcm90b3R5cGUuYnVpbGREaWN0aW9uYXJ5ID0gZnVuY3Rpb24gKGVudHJpZXMpIHtcbiAgICB2YXIgZGljdGlvbmFyeV9lbnRyaWVzID0ge307ICAvLyB1c2luZyBhcyBoYXNobWFwLCBzdHJpbmcgLT4gc3RyaW5nICh3b3JkX2lkIC0+IHN1cmZhY2VfZm9ybSkgdG8gYnVpbGQgZGljdGlvbmFyeVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbnRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaV07XG5cbiAgICAgICAgaWYgKGVudHJ5Lmxlbmd0aCA8IDQpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN1cmZhY2VfZm9ybSA9IGVudHJ5WzBdO1xuICAgICAgICB2YXIgbGVmdF9pZCA9IGVudHJ5WzFdO1xuICAgICAgICB2YXIgcmlnaHRfaWQgPSBlbnRyeVsyXTtcbiAgICAgICAgdmFyIHdvcmRfY29zdCA9IGVudHJ5WzNdO1xuICAgICAgICB2YXIgZmVhdHVyZSA9IGVudHJ5LnNsaWNlKDQpLmpvaW4oXCIsXCIpOyAgLy8gVE9ETyBPcHRpbWl6ZVxuXG4gICAgICAgIC8vIEFzc2VydGlvblxuICAgICAgICBpZiAoIWlzRmluaXRlKGxlZnRfaWQpIHx8ICFpc0Zpbml0ZShyaWdodF9pZCkgfHwgIWlzRmluaXRlKHdvcmRfY29zdCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVudHJ5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB0b2tlbl9pbmZvX2lkID0gdGhpcy5wdXQobGVmdF9pZCwgcmlnaHRfaWQsIHdvcmRfY29zdCwgc3VyZmFjZV9mb3JtLCBmZWF0dXJlKTtcbiAgICAgICAgZGljdGlvbmFyeV9lbnRyaWVzW3Rva2VuX2luZm9faWRdID0gc3VyZmFjZV9mb3JtO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBsYXN0IHVudXNlZCBhcmVhXG4gICAgdGhpcy5kaWN0aW9uYXJ5LnNocmluaygpO1xuICAgIHRoaXMucG9zX2J1ZmZlci5zaHJpbmsoKTtcblxuICAgIHJldHVybiBkaWN0aW9uYXJ5X2VudHJpZXM7XG59O1xuXG5Ub2tlbkluZm9EaWN0aW9uYXJ5LnByb3RvdHlwZS5wdXQgPSBmdW5jdGlvbiAobGVmdF9pZCwgcmlnaHRfaWQsIHdvcmRfY29zdCwgc3VyZmFjZV9mb3JtLCBmZWF0dXJlKSB7XG4gICAgdmFyIHRva2VuX2luZm9faWQgPSB0aGlzLmRpY3Rpb25hcnkucG9zaXRpb247XG4gICAgdmFyIHBvc19pZCA9IHRoaXMucG9zX2J1ZmZlci5wb3NpdGlvbjtcblxuICAgIHRoaXMuZGljdGlvbmFyeS5wdXRTaG9ydChsZWZ0X2lkKTtcbiAgICB0aGlzLmRpY3Rpb25hcnkucHV0U2hvcnQocmlnaHRfaWQpO1xuICAgIHRoaXMuZGljdGlvbmFyeS5wdXRTaG9ydCh3b3JkX2Nvc3QpO1xuICAgIHRoaXMuZGljdGlvbmFyeS5wdXRJbnQocG9zX2lkKTtcbiAgICB0aGlzLnBvc19idWZmZXIucHV0U3RyaW5nKHN1cmZhY2VfZm9ybSArIFwiLFwiICsgZmVhdHVyZSk7XG5cbiAgICByZXR1cm4gdG9rZW5faW5mb19pZDtcbn07XG5cblRva2VuSW5mb0RpY3Rpb25hcnkucHJvdG90eXBlLmFkZE1hcHBpbmcgPSBmdW5jdGlvbiAoc291cmNlLCB0YXJnZXQpIHtcbiAgICB2YXIgbWFwcGluZyA9IHRoaXMudGFyZ2V0X21hcFtzb3VyY2VdO1xuICAgIGlmIChtYXBwaW5nID09IG51bGwpIHtcbiAgICAgICAgbWFwcGluZyA9IFtdO1xuICAgIH1cbiAgICBtYXBwaW5nLnB1c2godGFyZ2V0KTtcblxuICAgIHRoaXMudGFyZ2V0X21hcFtzb3VyY2VdID0gbWFwcGluZztcbn07XG5cblRva2VuSW5mb0RpY3Rpb25hcnkucHJvdG90eXBlLnRhcmdldE1hcFRvQnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBidWZmZXIgPSBuZXcgQnl0ZUJ1ZmZlcigpO1xuICAgIHZhciBtYXBfa2V5c19zaXplID0gT2JqZWN0LmtleXModGhpcy50YXJnZXRfbWFwKS5sZW5ndGg7XG4gICAgYnVmZmVyLnB1dEludChtYXBfa2V5c19zaXplKTtcbiAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy50YXJnZXRfbWFwKSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSB0aGlzLnRhcmdldF9tYXBba2V5XTsgIC8vIEFycmF5XG4gICAgICAgIHZhciBtYXBfdmFsdWVzX3NpemUgPSB2YWx1ZXMubGVuZ3RoO1xuICAgICAgICBidWZmZXIucHV0SW50KHBhcnNlSW50KGtleSkpO1xuICAgICAgICBidWZmZXIucHV0SW50KG1hcF92YWx1ZXNfc2l6ZSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBidWZmZXIucHV0SW50KHZhbHVlc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlci5zaHJpbmsoKTsgIC8vIFNocmluay1lZCBUeXBlZCBBcnJheVxufTtcblxuLy8gZnJvbSB0aWQuZGF0XG5Ub2tlbkluZm9EaWN0aW9uYXJ5LnByb3RvdHlwZS5sb2FkRGljdGlvbmFyeSA9IGZ1bmN0aW9uIChhcnJheV9idWZmZXIpIHtcbiAgICB0aGlzLmRpY3Rpb25hcnkgPSBuZXcgQnl0ZUJ1ZmZlcihhcnJheV9idWZmZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gZnJvbSB0aWRfcG9zLmRhdFxuVG9rZW5JbmZvRGljdGlvbmFyeS5wcm90b3R5cGUubG9hZFBvc1ZlY3RvciA9IGZ1bmN0aW9uIChhcnJheV9idWZmZXIpIHtcbiAgICB0aGlzLnBvc19idWZmZXIgPSBuZXcgQnl0ZUJ1ZmZlcihhcnJheV9idWZmZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gZnJvbSB0aWRfbWFwLmRhdFxuVG9rZW5JbmZvRGljdGlvbmFyeS5wcm90b3R5cGUubG9hZFRhcmdldE1hcCA9IGZ1bmN0aW9uIChhcnJheV9idWZmZXIpIHtcbiAgICB2YXIgYnVmZmVyID0gbmV3IEJ5dGVCdWZmZXIoYXJyYXlfYnVmZmVyKTtcbiAgICBidWZmZXIucG9zaXRpb24gPSAwO1xuICAgIHRoaXMudGFyZ2V0X21hcCA9IHt9O1xuICAgIGJ1ZmZlci5yZWFkSW50KCk7ICAvLyBtYXBfa2V5c19zaXplXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgaWYgKGJ1ZmZlci5idWZmZXIubGVuZ3RoIDwgYnVmZmVyLnBvc2l0aW9uICsgMSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleSA9IGJ1ZmZlci5yZWFkSW50KCk7XG4gICAgICAgIHZhciBtYXBfdmFsdWVzX3NpemUgPSBidWZmZXIucmVhZEludCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hcF92YWx1ZXNfc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBidWZmZXIucmVhZEludCgpO1xuICAgICAgICAgICAgdGhpcy5hZGRNYXBwaW5nKGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBMb29rIHVwIGZlYXR1cmVzIGluIHRoZSBkaWN0aW9uYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gdG9rZW5faW5mb19pZF9zdHIgV29yZCBJRCB0byBsb29rIHVwXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBGZWF0dXJlcyBzdHJpbmcgY29uY2F0ZW5hdGVkIGJ5IFwiLFwiXG4gKi9cblRva2VuSW5mb0RpY3Rpb25hcnkucHJvdG90eXBlLmdldEZlYXR1cmVzID0gZnVuY3Rpb24gKHRva2VuX2luZm9faWRfc3RyKSB7XG4gICAgdmFyIHRva2VuX2luZm9faWQgPSBwYXJzZUludCh0b2tlbl9pbmZvX2lkX3N0cik7XG4gICAgaWYgKGlzTmFOKHRva2VuX2luZm9faWQpKSB7XG4gICAgICAgIC8vIFRPRE8gdGhyb3cgZXJyb3JcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHZhciBwb3NfaWQgPSB0aGlzLmRpY3Rpb25hcnkuZ2V0SW50KHRva2VuX2luZm9faWQgKyA2KTtcbiAgICByZXR1cm4gdGhpcy5wb3NfYnVmZmVyLmdldFN0cmluZyhwb3NfaWQpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFRva2VuSW5mb0RpY3Rpb25hcnk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=