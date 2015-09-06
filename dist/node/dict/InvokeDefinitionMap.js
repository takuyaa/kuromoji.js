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
var CharacterClass = require("./CharacterClass.js");


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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0ludm9rZURlZmluaXRpb25NYXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEJ5dGVCdWZmZXIgPSByZXF1aXJlKFwiLi4vdXRpbC9CeXRlQnVmZmVyLmpzXCIpO1xudmFyIENoYXJhY3RlckNsYXNzID0gcmVxdWlyZShcIi4vQ2hhcmFjdGVyQ2xhc3MuanNcIik7XG5cblxuLyoqXG4gKiBJbnZva2VEZWZpbml0aW9uTWFwIHJlcHJlc2VudHMgaW52b2tlIGRlZmluaXRpb24gYSBwYXJ0IG9mIGNoYXIuZGVmXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSW52b2tlRGVmaW5pdGlvbk1hcCgpIHtcbiAgICB0aGlzLm1hcCA9IFtdO1xuICAgIHRoaXMubG9va3VwX3RhYmxlID0ge307ICAvLyBKdXN0IGZvciBidWlsZGluZyBkaWN0aW9uYXJ5XG59XG5cbi8qKlxuICogTG9hZCBJbnZva2VEZWZpbml0aW9uTWFwIGZyb20gYnVmZmVyXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGludm9rZV9kZWZfYnVmZmVyXG4gKiBAcmV0dXJucyB7SW52b2tlRGVmaW5pdGlvbk1hcH1cbiAqL1xuSW52b2tlRGVmaW5pdGlvbk1hcC5sb2FkID0gZnVuY3Rpb24gKGludm9rZV9kZWZfYnVmZmVyKSB7XG4gICAgdmFyIGludm9rZV9kZWYgPSBuZXcgSW52b2tlRGVmaW5pdGlvbk1hcCgpO1xuICAgIHZhciBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbiA9IFtdO1xuXG4gICAgdmFyIGJ1ZmZlciA9IG5ldyBCeXRlQnVmZmVyKGludm9rZV9kZWZfYnVmZmVyKTtcbiAgICB3aGlsZSAoYnVmZmVyLnBvc2l0aW9uICsgMSA8IGJ1ZmZlci5zaXplKCkpIHtcbiAgICAgICAgdmFyIGNsYXNzX2lkID0gY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24ubGVuZ3RoO1xuICAgICAgICB2YXIgaXNfYWx3YXlzX2ludm9rZSA9IGJ1ZmZlci5nZXQoKTtcbiAgICAgICAgdmFyIGlzX2dyb3VwaW5nID0gYnVmZmVyLmdldCgpO1xuICAgICAgICB2YXIgbWF4X2xlbmd0aCA9IGJ1ZmZlci5nZXRJbnQoKTtcbiAgICAgICAgdmFyIGNsYXNzX25hbWUgPSBidWZmZXIuZ2V0U3RyaW5nKCk7XG4gICAgICAgIGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uLnB1c2gobmV3IENoYXJhY3RlckNsYXNzKGNsYXNzX2lkLCBjbGFzc19uYW1lLCBpc19hbHdheXNfaW52b2tlLCBpc19ncm91cGluZywgbWF4X2xlbmd0aCkpO1xuICAgIH1cblxuICAgIGludm9rZV9kZWYuaW5pdChjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbik7XG5cbiAgICByZXR1cm4gaW52b2tlX2RlZjtcbn07XG5cbi8qKlxuICogSW5pdGlhbGl6aW5nIG1ldGhvZFxuICogQHBhcmFtIHtBcnJheS48Q2hhcmFjdGVyQ2xhc3M+fSBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbiBBcnJheSBvZiBDaGFyYWN0ZXJDbGFzc1xuICovXG5JbnZva2VEZWZpbml0aW9uTWFwLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uKSB7XG4gICAgaWYgKGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGFyYWN0ZXJfY2xhc3MgPSBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbltpXTtcbiAgICAgICAgdGhpcy5tYXBbaV0gPSBjaGFyYWN0ZXJfY2xhc3M7XG4gICAgICAgIHRoaXMubG9va3VwX3RhYmxlW2NoYXJhY3Rlcl9jbGFzcy5jbGFzc19uYW1lXSA9IGk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBHZXQgY2xhc3MgaW5mb3JtYXRpb24gYnkgY2xhc3MgSURcbiAqIEBwYXJhbSB7bnVtYmVyfSBjbGFzc19pZFxuICogQHJldHVybnMge0NoYXJhY3RlckNsYXNzfVxuICovXG5JbnZva2VEZWZpbml0aW9uTWFwLnByb3RvdHlwZS5nZXRDaGFyYWN0ZXJDbGFzcyA9IGZ1bmN0aW9uIChjbGFzc19pZCkge1xuICAgIHJldHVybiB0aGlzLm1hcFtjbGFzc19pZF07XG59O1xuXG4vKipcbiAqIEZvciBidWlsZGluZyBjaGFyYWN0ZXIgZGVmaW5pdGlvbiBkaWN0aW9uYXJ5XG4gKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NfbmFtZSBjaGFyYWN0ZXJcbiAqIEByZXR1cm5zIHtudW1iZXJ9IGNsYXNzX2lkXG4gKi9cbkludm9rZURlZmluaXRpb25NYXAucHJvdG90eXBlLmxvb2t1cCA9IGZ1bmN0aW9uIChjbGFzc19uYW1lKSB7XG4gICAgdmFyIGNsYXNzX2lkID0gdGhpcy5sb29rdXBfdGFibGVbY2xhc3NfbmFtZV07XG4gICAgaWYgKGNsYXNzX2lkID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjbGFzc19pZDtcbn07XG5cbi8qKlxuICogVHJhbnNmb3JtIGZyb20gbWFwIHRvIGJpbmFyeSBidWZmZXJcbiAqIEByZXR1cm5zIHtVaW50OEFycmF5fVxuICovXG5JbnZva2VEZWZpbml0aW9uTWFwLnByb3RvdHlwZS50b0J1ZmZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYnVmZmVyID0gbmV3IEJ5dGVCdWZmZXIoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubWFwLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGFyX2NsYXNzID0gdGhpcy5tYXBbaV07XG4gICAgICAgIGJ1ZmZlci5wdXQoY2hhcl9jbGFzcy5pc19hbHdheXNfaW52b2tlKTtcbiAgICAgICAgYnVmZmVyLnB1dChjaGFyX2NsYXNzLmlzX2dyb3VwaW5nKTtcbiAgICAgICAgYnVmZmVyLnB1dEludChjaGFyX2NsYXNzLm1heF9sZW5ndGgpO1xuICAgICAgICBidWZmZXIucHV0U3RyaW5nKGNoYXJfY2xhc3MuY2xhc3NfbmFtZSk7XG4gICAgfVxuICAgIGJ1ZmZlci5zaHJpbmsoKTtcbiAgICByZXR1cm4gYnVmZmVyLmJ1ZmZlcjtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBJbnZva2VEZWZpbml0aW9uTWFwO1xuIl0sImZpbGUiOiJkaWN0L0ludm9rZURlZmluaXRpb25NYXAuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==