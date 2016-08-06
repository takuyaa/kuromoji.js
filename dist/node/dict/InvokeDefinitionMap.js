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

var ByteBuffer = require("../util/ByteBuffer");
var CharacterClass = require("./CharacterClass");

/**
 * InvokeDefinitionMap represents invoke definition a part of char.def
 * @constructor
 */
function InvokeDefinitionMap() {
    this.map = [];
    this.lookup_table = {};  // Just for building dictionary
}

/**
 * Load InvokeDefinitionMap from buffer
 * @param {Uint8Array} invoke_def_buffer
 * @returns {InvokeDefinitionMap}
 */
InvokeDefinitionMap.load = function (invoke_def_buffer) {
    var invoke_def = new InvokeDefinitionMap();
    var character_category_definition = [];

    var buffer = new ByteBuffer(invoke_def_buffer);
    while (buffer.position + 1 < buffer.size()) {
        var class_id = character_category_definition.length;
        var is_always_invoke = buffer.get();
        var is_grouping = buffer.get();
        var max_length = buffer.getInt();
        var class_name = buffer.getString();
        character_category_definition.push(new CharacterClass(class_id, class_name, is_always_invoke, is_grouping, max_length));
    }

    invoke_def.init(character_category_definition);

    return invoke_def;
};

/**
 * Initializing method
 * @param {Array.<CharacterClass>} character_category_definition Array of CharacterClass
 */
InvokeDefinitionMap.prototype.init = function (character_category_definition) {
    if (character_category_definition == null) {
        return;
    }
    for (var i = 0; i < character_category_definition.length; i++) {
        var character_class = character_category_definition[i];
        this.map[i] = character_class;
        this.lookup_table[character_class.class_name] = i;
    }
};

/**
 * Get class information by class ID
 * @param {number} class_id
 * @returns {CharacterClass}
 */
InvokeDefinitionMap.prototype.getCharacterClass = function (class_id) {
    return this.map[class_id];
};

/**
 * For building character definition dictionary
 * @param {string} class_name character
 * @returns {number} class_id
 */
InvokeDefinitionMap.prototype.lookup = function (class_name) {
    var class_id = this.lookup_table[class_name];
    if (class_id == null) {
        return null;
    }
    return class_id;
};

/**
 * Transform from map to binary buffer
 * @returns {Uint8Array}
 */
InvokeDefinitionMap.prototype.toBuffer = function () {
    var buffer = new ByteBuffer();
    for (var i = 0; i < this.map.length; i++) {
        var char_class = this.map[i];
        buffer.put(char_class.is_always_invoke);
        buffer.put(char_class.is_grouping);
        buffer.putInt(char_class.max_length);
        buffer.putString(char_class.class_name);
    }
    buffer.shrink();
    return buffer.buffer;
};

module.exports = InvokeDefinitionMap;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0ludm9rZURlZmluaXRpb25NYXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEJ5dGVCdWZmZXIgPSByZXF1aXJlKFwiLi4vdXRpbC9CeXRlQnVmZmVyXCIpO1xudmFyIENoYXJhY3RlckNsYXNzID0gcmVxdWlyZShcIi4vQ2hhcmFjdGVyQ2xhc3NcIik7XG5cbi8qKlxuICogSW52b2tlRGVmaW5pdGlvbk1hcCByZXByZXNlbnRzIGludm9rZSBkZWZpbml0aW9uIGEgcGFydCBvZiBjaGFyLmRlZlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEludm9rZURlZmluaXRpb25NYXAoKSB7XG4gICAgdGhpcy5tYXAgPSBbXTtcbiAgICB0aGlzLmxvb2t1cF90YWJsZSA9IHt9OyAgLy8gSnVzdCBmb3IgYnVpbGRpbmcgZGljdGlvbmFyeVxufVxuXG4vKipcbiAqIExvYWQgSW52b2tlRGVmaW5pdGlvbk1hcCBmcm9tIGJ1ZmZlclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBpbnZva2VfZGVmX2J1ZmZlclxuICogQHJldHVybnMge0ludm9rZURlZmluaXRpb25NYXB9XG4gKi9cbkludm9rZURlZmluaXRpb25NYXAubG9hZCA9IGZ1bmN0aW9uIChpbnZva2VfZGVmX2J1ZmZlcikge1xuICAgIHZhciBpbnZva2VfZGVmID0gbmV3IEludm9rZURlZmluaXRpb25NYXAoKTtcbiAgICB2YXIgY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24gPSBbXTtcblxuICAgIHZhciBidWZmZXIgPSBuZXcgQnl0ZUJ1ZmZlcihpbnZva2VfZGVmX2J1ZmZlcik7XG4gICAgd2hpbGUgKGJ1ZmZlci5wb3NpdGlvbiArIDEgPCBidWZmZXIuc2l6ZSgpKSB7XG4gICAgICAgIHZhciBjbGFzc19pZCA9IGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uLmxlbmd0aDtcbiAgICAgICAgdmFyIGlzX2Fsd2F5c19pbnZva2UgPSBidWZmZXIuZ2V0KCk7XG4gICAgICAgIHZhciBpc19ncm91cGluZyA9IGJ1ZmZlci5nZXQoKTtcbiAgICAgICAgdmFyIG1heF9sZW5ndGggPSBidWZmZXIuZ2V0SW50KCk7XG4gICAgICAgIHZhciBjbGFzc19uYW1lID0gYnVmZmVyLmdldFN0cmluZygpO1xuICAgICAgICBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbi5wdXNoKG5ldyBDaGFyYWN0ZXJDbGFzcyhjbGFzc19pZCwgY2xhc3NfbmFtZSwgaXNfYWx3YXlzX2ludm9rZSwgaXNfZ3JvdXBpbmcsIG1heF9sZW5ndGgpKTtcbiAgICB9XG5cbiAgICBpbnZva2VfZGVmLmluaXQoY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24pO1xuXG4gICAgcmV0dXJuIGludm9rZV9kZWY7XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemluZyBtZXRob2RcbiAqIEBwYXJhbSB7QXJyYXkuPENoYXJhY3RlckNsYXNzPn0gY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24gQXJyYXkgb2YgQ2hhcmFjdGVyQ2xhc3NcbiAqL1xuSW52b2tlRGVmaW5pdGlvbk1hcC5wcm90b3R5cGUuaW5pdCA9IGZ1bmN0aW9uIChjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbikge1xuICAgIGlmIChjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbiA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhcmFjdGVyX2NsYXNzID0gY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb25baV07XG4gICAgICAgIHRoaXMubWFwW2ldID0gY2hhcmFjdGVyX2NsYXNzO1xuICAgICAgICB0aGlzLmxvb2t1cF90YWJsZVtjaGFyYWN0ZXJfY2xhc3MuY2xhc3NfbmFtZV0gPSBpO1xuICAgIH1cbn07XG5cbi8qKlxuICogR2V0IGNsYXNzIGluZm9ybWF0aW9uIGJ5IGNsYXNzIElEXG4gKiBAcGFyYW0ge251bWJlcn0gY2xhc3NfaWRcbiAqIEByZXR1cm5zIHtDaGFyYWN0ZXJDbGFzc31cbiAqL1xuSW52b2tlRGVmaW5pdGlvbk1hcC5wcm90b3R5cGUuZ2V0Q2hhcmFjdGVyQ2xhc3MgPSBmdW5jdGlvbiAoY2xhc3NfaWQpIHtcbiAgICByZXR1cm4gdGhpcy5tYXBbY2xhc3NfaWRdO1xufTtcblxuLyoqXG4gKiBGb3IgYnVpbGRpbmcgY2hhcmFjdGVyIGRlZmluaXRpb24gZGljdGlvbmFyeVxuICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzX25hbWUgY2hhcmFjdGVyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBjbGFzc19pZFxuICovXG5JbnZva2VEZWZpbml0aW9uTWFwLnByb3RvdHlwZS5sb29rdXAgPSBmdW5jdGlvbiAoY2xhc3NfbmFtZSkge1xuICAgIHZhciBjbGFzc19pZCA9IHRoaXMubG9va3VwX3RhYmxlW2NsYXNzX25hbWVdO1xuICAgIGlmIChjbGFzc19pZCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY2xhc3NfaWQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybSBmcm9tIG1hcCB0byBiaW5hcnkgYnVmZmVyXG4gKiBAcmV0dXJucyB7VWludDhBcnJheX1cbiAqL1xuSW52b2tlRGVmaW5pdGlvbk1hcC5wcm90b3R5cGUudG9CdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJ1ZmZlciA9IG5ldyBCeXRlQnVmZmVyKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1hcC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY2hhcl9jbGFzcyA9IHRoaXMubWFwW2ldO1xuICAgICAgICBidWZmZXIucHV0KGNoYXJfY2xhc3MuaXNfYWx3YXlzX2ludm9rZSk7XG4gICAgICAgIGJ1ZmZlci5wdXQoY2hhcl9jbGFzcy5pc19ncm91cGluZyk7XG4gICAgICAgIGJ1ZmZlci5wdXRJbnQoY2hhcl9jbGFzcy5tYXhfbGVuZ3RoKTtcbiAgICAgICAgYnVmZmVyLnB1dFN0cmluZyhjaGFyX2NsYXNzLmNsYXNzX25hbWUpO1xuICAgIH1cbiAgICBidWZmZXIuc2hyaW5rKCk7XG4gICAgcmV0dXJuIGJ1ZmZlci5idWZmZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludm9rZURlZmluaXRpb25NYXA7XG4iXSwiZmlsZSI6ImRpY3QvSW52b2tlRGVmaW5pdGlvbk1hcC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
