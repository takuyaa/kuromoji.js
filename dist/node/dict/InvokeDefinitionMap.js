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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdC9JbnZva2VEZWZpbml0aW9uTWFwLmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsiZGljdC9JbnZva2VEZWZpbml0aW9uTWFwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgQnl0ZUJ1ZmZlciA9IHJlcXVpcmUoXCIuLi91dGlsL0J5dGVCdWZmZXIuanNcIik7XG52YXIgQ2hhcmFjdGVyQ2xhc3MgPSByZXF1aXJlKFwiLi9DaGFyYWN0ZXJDbGFzcy5qc1wiKTtcblxuXG4vKipcbiAqIEludm9rZURlZmluaXRpb25NYXAgcmVwcmVzZW50cyBpbnZva2UgZGVmaW5pdGlvbiBhIHBhcnQgb2YgY2hhci5kZWZcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnZva2VEZWZpbml0aW9uTWFwKCkge1xuICAgIHRoaXMubWFwID0gW107XG4gICAgdGhpcy5sb29rdXBfdGFibGUgPSB7fTsgIC8vIEp1c3QgZm9yIGJ1aWxkaW5nIGRpY3Rpb25hcnlcbn1cblxuLyoqXG4gKiBMb2FkIEludm9rZURlZmluaXRpb25NYXAgZnJvbSBidWZmZXJcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gaW52b2tlX2RlZl9idWZmZXJcbiAqIEByZXR1cm5zIHtJbnZva2VEZWZpbml0aW9uTWFwfVxuICovXG5JbnZva2VEZWZpbml0aW9uTWFwLmxvYWQgPSBmdW5jdGlvbiAoaW52b2tlX2RlZl9idWZmZXIpIHtcbiAgICB2YXIgaW52b2tlX2RlZiA9IG5ldyBJbnZva2VEZWZpbml0aW9uTWFwKCk7XG4gICAgdmFyIGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uID0gW107XG5cbiAgICB2YXIgYnVmZmVyID0gbmV3IEJ5dGVCdWZmZXIoaW52b2tlX2RlZl9idWZmZXIpO1xuICAgIHdoaWxlIChidWZmZXIucG9zaXRpb24gKyAxIDwgYnVmZmVyLnNpemUoKSkge1xuICAgICAgICB2YXIgY2xhc3NfaWQgPSBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbi5sZW5ndGg7XG4gICAgICAgIHZhciBpc19hbHdheXNfaW52b2tlID0gYnVmZmVyLmdldCgpO1xuICAgICAgICB2YXIgaXNfZ3JvdXBpbmcgPSBidWZmZXIuZ2V0KCk7XG4gICAgICAgIHZhciBtYXhfbGVuZ3RoID0gYnVmZmVyLmdldEludCgpO1xuICAgICAgICB2YXIgY2xhc3NfbmFtZSA9IGJ1ZmZlci5nZXRTdHJpbmcoKTtcbiAgICAgICAgY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24ucHVzaChuZXcgQ2hhcmFjdGVyQ2xhc3MoY2xhc3NfaWQsIGNsYXNzX25hbWUsIGlzX2Fsd2F5c19pbnZva2UsIGlzX2dyb3VwaW5nLCBtYXhfbGVuZ3RoKSk7XG4gICAgfVxuXG4gICAgaW52b2tlX2RlZi5pbml0KGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uKTtcblxuICAgIHJldHVybiBpbnZva2VfZGVmO1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXppbmcgbWV0aG9kXG4gKiBAcGFyYW0ge0FycmF5LjxDaGFyYWN0ZXJDbGFzcz59IGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uIEFycmF5IG9mIENoYXJhY3RlckNsYXNzXG4gKi9cbkludm9rZURlZmluaXRpb25NYXAucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24pIHtcbiAgICBpZiAoY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24gPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoYXJhY3Rlcl9jbGFzcyA9IGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uW2ldO1xuICAgICAgICB0aGlzLm1hcFtpXSA9IGNoYXJhY3Rlcl9jbGFzcztcbiAgICAgICAgdGhpcy5sb29rdXBfdGFibGVbY2hhcmFjdGVyX2NsYXNzLmNsYXNzX25hbWVdID0gaTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEdldCBjbGFzcyBpbmZvcm1hdGlvbiBieSBjbGFzcyBJRFxuICogQHBhcmFtIHtudW1iZXJ9IGNsYXNzX2lkXG4gKiBAcmV0dXJucyB7Q2hhcmFjdGVyQ2xhc3N9XG4gKi9cbkludm9rZURlZmluaXRpb25NYXAucHJvdG90eXBlLmdldENoYXJhY3RlckNsYXNzID0gZnVuY3Rpb24gKGNsYXNzX2lkKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwW2NsYXNzX2lkXTtcbn07XG5cbi8qKlxuICogRm9yIGJ1aWxkaW5nIGNoYXJhY3RlciBkZWZpbml0aW9uIGRpY3Rpb25hcnlcbiAqIEBwYXJhbSB7c3RyaW5nfSBjbGFzc19uYW1lIGNoYXJhY3RlclxuICogQHJldHVybnMge251bWJlcn0gY2xhc3NfaWRcbiAqL1xuSW52b2tlRGVmaW5pdGlvbk1hcC5wcm90b3R5cGUubG9va3VwID0gZnVuY3Rpb24gKGNsYXNzX25hbWUpIHtcbiAgICB2YXIgY2xhc3NfaWQgPSB0aGlzLmxvb2t1cF90YWJsZVtjbGFzc19uYW1lXTtcbiAgICBpZiAoY2xhc3NfaWQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGNsYXNzX2lkO1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm0gZnJvbSBtYXAgdG8gYmluYXJ5IGJ1ZmZlclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9XG4gKi9cbkludm9rZURlZmluaXRpb25NYXAucHJvdG90eXBlLnRvQnVmZmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBidWZmZXIgPSBuZXcgQnl0ZUJ1ZmZlcigpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5tYXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoYXJfY2xhc3MgPSB0aGlzLm1hcFtpXTtcbiAgICAgICAgYnVmZmVyLnB1dChjaGFyX2NsYXNzLmlzX2Fsd2F5c19pbnZva2UpO1xuICAgICAgICBidWZmZXIucHV0KGNoYXJfY2xhc3MuaXNfZ3JvdXBpbmcpO1xuICAgICAgICBidWZmZXIucHV0SW50KGNoYXJfY2xhc3MubWF4X2xlbmd0aCk7XG4gICAgICAgIGJ1ZmZlci5wdXRTdHJpbmcoY2hhcl9jbGFzcy5jbGFzc19uYW1lKTtcbiAgICB9XG4gICAgYnVmZmVyLnNocmluaygpO1xuICAgIHJldHVybiBidWZmZXIuYnVmZmVyO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEludm9rZURlZmluaXRpb25NYXA7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=