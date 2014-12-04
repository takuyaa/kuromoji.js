/*
 * Copyright Copyright 2014 Takuya Asano
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdC9Ub2tlbkluZm9EaWN0aW9uYXJ5LmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsiZGljdC9Ub2tlbkluZm9EaWN0aW9uYXJ5LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgQnl0ZUJ1ZmZlciA9IHJlcXVpcmUoXCIuLi91dGlsL0J5dGVCdWZmZXIuanNcIik7XG5cblxuLyoqXG4gKiBUb2tlbkluZm9EaWN0aW9uYXJ5XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVG9rZW5JbmZvRGljdGlvbmFyeSgpIHtcbiAgICB0aGlzLmRpY3Rpb25hcnkgPSBuZXcgQnl0ZUJ1ZmZlcigxMCAqIDEwMjQgKiAxMDI0KTtcbiAgICB0aGlzLnRhcmdldF9tYXAgPSB7fTsgIC8vIHRyaWVfaWQgKG9mIHN1cmZhY2UgZm9ybSkgLT4gdG9rZW5faW5mb19pZCAob2YgdG9rZW4pXG4gICAgdGhpcy5wb3NfYnVmZmVyID0gbmV3IEJ5dGVCdWZmZXIoMTAgKiAxMDI0ICogMTAyNCk7XG59XG5cbi8vIGxlZnRfaWQgcmlnaHRfaWQgd29yZF9jb3N0IC4uLlxuLy8gXiB0aGlzIHBvc2l0aW9uIGlzIHRva2VuX2luZm9faWRcblRva2VuSW5mb0RpY3Rpb25hcnkucHJvdG90eXBlLmJ1aWxkRGljdGlvbmFyeSA9IGZ1bmN0aW9uIChlbnRyaWVzKSB7XG4gICAgdmFyIGRpY3Rpb25hcnlfZW50cmllcyA9IHt9OyAgLy8gdXNpbmcgYXMgaGFzaG1hcCwgc3RyaW5nIC0+IHN0cmluZyAod29yZF9pZCAtPiBzdXJmYWNlX2Zvcm0pIHRvIGJ1aWxkIGRpY3Rpb25hcnlcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW50cmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZW50cnkgPSBlbnRyaWVzW2ldO1xuXG4gICAgICAgIGlmIChlbnRyeS5sZW5ndGggPCA0KSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdXJmYWNlX2Zvcm0gPSBlbnRyeVswXTtcbiAgICAgICAgdmFyIGxlZnRfaWQgPSBlbnRyeVsxXTtcbiAgICAgICAgdmFyIHJpZ2h0X2lkID0gZW50cnlbMl07XG4gICAgICAgIHZhciB3b3JkX2Nvc3QgPSBlbnRyeVszXTtcbiAgICAgICAgdmFyIGZlYXR1cmUgPSBlbnRyeS5zbGljZSg0KS5qb2luKFwiLFwiKTsgIC8vIFRPRE8gT3B0aW1pemVcblxuICAgICAgICAvLyBBc3NlcnRpb25cbiAgICAgICAgaWYgKCFpc0Zpbml0ZShsZWZ0X2lkKSB8fCAhaXNGaW5pdGUocmlnaHRfaWQpIHx8ICFpc0Zpbml0ZSh3b3JkX2Nvc3QpKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlbnRyeSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG9rZW5faW5mb19pZCA9IHRoaXMucHV0KGxlZnRfaWQsIHJpZ2h0X2lkLCB3b3JkX2Nvc3QsIHN1cmZhY2VfZm9ybSwgZmVhdHVyZSk7XG4gICAgICAgIGRpY3Rpb25hcnlfZW50cmllc1t0b2tlbl9pbmZvX2lkXSA9IHN1cmZhY2VfZm9ybTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgbGFzdCB1bnVzZWQgYXJlYVxuICAgIHRoaXMuZGljdGlvbmFyeS5zaHJpbmsoKTtcbiAgICB0aGlzLnBvc19idWZmZXIuc2hyaW5rKCk7XG5cbiAgICByZXR1cm4gZGljdGlvbmFyeV9lbnRyaWVzO1xufTtcblxuVG9rZW5JbmZvRGljdGlvbmFyeS5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gKGxlZnRfaWQsIHJpZ2h0X2lkLCB3b3JkX2Nvc3QsIHN1cmZhY2VfZm9ybSwgZmVhdHVyZSkge1xuICAgIHZhciB0b2tlbl9pbmZvX2lkID0gdGhpcy5kaWN0aW9uYXJ5LnBvc2l0aW9uO1xuICAgIHZhciBwb3NfaWQgPSB0aGlzLnBvc19idWZmZXIucG9zaXRpb247XG5cbiAgICB0aGlzLmRpY3Rpb25hcnkucHV0U2hvcnQobGVmdF9pZCk7XG4gICAgdGhpcy5kaWN0aW9uYXJ5LnB1dFNob3J0KHJpZ2h0X2lkKTtcbiAgICB0aGlzLmRpY3Rpb25hcnkucHV0U2hvcnQod29yZF9jb3N0KTtcbiAgICB0aGlzLmRpY3Rpb25hcnkucHV0SW50KHBvc19pZCk7XG4gICAgdGhpcy5wb3NfYnVmZmVyLnB1dFN0cmluZyhzdXJmYWNlX2Zvcm0gKyBcIixcIiArIGZlYXR1cmUpO1xuXG4gICAgcmV0dXJuIHRva2VuX2luZm9faWQ7XG59O1xuXG5Ub2tlbkluZm9EaWN0aW9uYXJ5LnByb3RvdHlwZS5hZGRNYXBwaW5nID0gZnVuY3Rpb24gKHNvdXJjZSwgdGFyZ2V0KSB7XG4gICAgdmFyIG1hcHBpbmcgPSB0aGlzLnRhcmdldF9tYXBbc291cmNlXTtcbiAgICBpZiAobWFwcGluZyA9PSBudWxsKSB7XG4gICAgICAgIG1hcHBpbmcgPSBbXTtcbiAgICB9XG4gICAgbWFwcGluZy5wdXNoKHRhcmdldCk7XG5cbiAgICB0aGlzLnRhcmdldF9tYXBbc291cmNlXSA9IG1hcHBpbmc7XG59O1xuXG5Ub2tlbkluZm9EaWN0aW9uYXJ5LnByb3RvdHlwZS50YXJnZXRNYXBUb0J1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYnVmZmVyID0gbmV3IEJ5dGVCdWZmZXIoKTtcbiAgICB2YXIgbWFwX2tleXNfc2l6ZSA9IE9iamVjdC5rZXlzKHRoaXMudGFyZ2V0X21hcCkubGVuZ3RoO1xuICAgIGJ1ZmZlci5wdXRJbnQobWFwX2tleXNfc2l6ZSk7XG4gICAgZm9yICh2YXIga2V5IGluIHRoaXMudGFyZ2V0X21hcCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gdGhpcy50YXJnZXRfbWFwW2tleV07ICAvLyBBcnJheVxuICAgICAgICB2YXIgbWFwX3ZhbHVlc19zaXplID0gdmFsdWVzLmxlbmd0aDtcbiAgICAgICAgYnVmZmVyLnB1dEludChwYXJzZUludChrZXkpKTtcbiAgICAgICAgYnVmZmVyLnB1dEludChtYXBfdmFsdWVzX3NpemUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYnVmZmVyLnB1dEludCh2YWx1ZXNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBidWZmZXIuc2hyaW5rKCk7ICAvLyBTaHJpbmstZWQgVHlwZWQgQXJyYXlcbn07XG5cbi8vIGZyb20gdGlkLmRhdFxuVG9rZW5JbmZvRGljdGlvbmFyeS5wcm90b3R5cGUubG9hZERpY3Rpb25hcnkgPSBmdW5jdGlvbiAoYXJyYXlfYnVmZmVyKSB7XG4gICAgdGhpcy5kaWN0aW9uYXJ5ID0gbmV3IEJ5dGVCdWZmZXIoYXJyYXlfYnVmZmVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGZyb20gdGlkX3Bvcy5kYXRcblRva2VuSW5mb0RpY3Rpb25hcnkucHJvdG90eXBlLmxvYWRQb3NWZWN0b3IgPSBmdW5jdGlvbiAoYXJyYXlfYnVmZmVyKSB7XG4gICAgdGhpcy5wb3NfYnVmZmVyID0gbmV3IEJ5dGVCdWZmZXIoYXJyYXlfYnVmZmVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGZyb20gdGlkX21hcC5kYXRcblRva2VuSW5mb0RpY3Rpb25hcnkucHJvdG90eXBlLmxvYWRUYXJnZXRNYXAgPSBmdW5jdGlvbiAoYXJyYXlfYnVmZmVyKSB7XG4gICAgdmFyIGJ1ZmZlciA9IG5ldyBCeXRlQnVmZmVyKGFycmF5X2J1ZmZlcik7XG4gICAgYnVmZmVyLnBvc2l0aW9uID0gMDtcbiAgICB0aGlzLnRhcmdldF9tYXAgPSB7fTtcbiAgICBidWZmZXIucmVhZEludCgpOyAgLy8gbWFwX2tleXNfc2l6ZVxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGlmIChidWZmZXIuYnVmZmVyLmxlbmd0aCA8IGJ1ZmZlci5wb3NpdGlvbiArIDEpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXkgPSBidWZmZXIucmVhZEludCgpO1xuICAgICAgICB2YXIgbWFwX3ZhbHVlc19zaXplID0gYnVmZmVyLnJlYWRJbnQoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXBfdmFsdWVzX3NpemU7IGkrKykge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYnVmZmVyLnJlYWRJbnQoKTtcbiAgICAgICAgICAgIHRoaXMuYWRkTWFwcGluZyhrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTG9vayB1cCBmZWF0dXJlcyBpbiB0aGUgZGljdGlvbmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IHRva2VuX2luZm9faWRfc3RyIFdvcmQgSUQgdG8gbG9vayB1cFxuICogQHJldHVybnMge3N0cmluZ30gRmVhdHVyZXMgc3RyaW5nIGNvbmNhdGVuYXRlZCBieSBcIixcIlxuICovXG5Ub2tlbkluZm9EaWN0aW9uYXJ5LnByb3RvdHlwZS5nZXRGZWF0dXJlcyA9IGZ1bmN0aW9uICh0b2tlbl9pbmZvX2lkX3N0cikge1xuICAgIHZhciB0b2tlbl9pbmZvX2lkID0gcGFyc2VJbnQodG9rZW5faW5mb19pZF9zdHIpO1xuICAgIGlmIChpc05hTih0b2tlbl9pbmZvX2lkKSkge1xuICAgICAgICAvLyBUT0RPIHRocm93IGVycm9yXG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICB2YXIgcG9zX2lkID0gdGhpcy5kaWN0aW9uYXJ5LmdldEludCh0b2tlbl9pbmZvX2lkICsgNik7XG4gICAgcmV0dXJuIHRoaXMucG9zX2J1ZmZlci5nZXRTdHJpbmcocG9zX2lkKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBUb2tlbkluZm9EaWN0aW9uYXJ5O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9