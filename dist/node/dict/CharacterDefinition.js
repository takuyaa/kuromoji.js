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

var InvokeDefinitionMap = require("./InvokeDefinitionMap.js");
var CharacterClass = require("./CharacterClass.js");
var SurrogateAwareString = require("../util/SurrogateAwareString.js");

var DEFAULT_CATEGORY = "DEFAULT";
var RETURN_PATTERN = /\r|\n|\r\n/;
var CATEGORY_DEF_PATTERN = /^(\w+)\s+(\d)\s+(\d)\s+(\d)/;
var CATEGORY_MAPPING_PATTERN = /^(0x[0-9A-F]{4})(?:\s+([^#\s]+))(?:\s+([^#\s]+))*/;
var RANGE_CATEGORY_MAPPING_PATTERN = /^(0x[0-9A-F]{4})\.\.(0x[0-9A-F]{4})(?:\s+([^#\s]+))(?:\s+([^#\s]+))*/;


/**
 * CharacterDefinition represents char.def file and
 * defines behavior of unknown word processing
 * @constructor
 */
function CharacterDefinition() {
    this.character_category_map = new Uint8Array(65536);  // for all UCS2 code points
    this.compatible_category_map = new Uint32Array(65536);  // for all UCS2 code points
    this.invoke_definition_map = null;

}

/**
 * Load CharacterDefinition
 * @param {Uint8Array} cat_map_buffer
 * @param {Uint32Array} compat_cat_map_buffer
 * @param {InvokeDefinitionMap} invoke_def_buffer
 * @returns {CharacterDefinition}
 */
CharacterDefinition.load = function (cat_map_buffer, compat_cat_map_buffer, invoke_def_buffer) {
    var char_def = new CharacterDefinition();
    char_def.character_category_map = cat_map_buffer;
    char_def.compatible_category_map = compat_cat_map_buffer;
    char_def.invoke_definition_map = InvokeDefinitionMap.load(invoke_def_buffer);
    return char_def;
};

/**
 * Factory method of CharacterDefinition
 * @param {string} text Contents of char.def
 */
CharacterDefinition.readCharacterDefinition = function (text) {
    var lines = text.split(RETURN_PATTERN);
    var line;
    var character_category_definition = [];
    var category_mapping = [];


    for (var i = 0; i < lines.length; i++) {
        line = lines[i];
        if (line == null) {
            continue;
        }
        var parsed_category_def = CATEGORY_DEF_PATTERN.exec(line);
        if (parsed_category_def != null) {
            var class_id = character_category_definition.length;
            var char_class = CharacterDefinition.parseCharCategory(class_id, parsed_category_def);
            if (char_class == null) {
                continue;
            }
            character_category_definition.push(char_class);
            continue;
        }
        var parsed_category_mapping = CATEGORY_MAPPING_PATTERN.exec(line);
        if (parsed_category_mapping != null) {
            var mapping = CharacterDefinition.parseCategoryMapping(parsed_category_mapping);
            category_mapping.push(mapping);
        }
        var parsed_range_category_mapping = RANGE_CATEGORY_MAPPING_PATTERN.exec(line);
        if (parsed_range_category_mapping != null) {
            var range_mapping = CharacterDefinition.parseRangeCategoryMapping(parsed_range_category_mapping);
            category_mapping.push(range_mapping);
        }
    }

    // TODO If DEFAULT category does not exist, throw error

    var char_def = new CharacterDefinition();
    char_def.invoke_definition_map = new InvokeDefinitionMap();
    char_def.invoke_definition_map.init(character_category_definition);
    char_def.initCategoryMappings(category_mapping);

    return char_def;
};

CharacterDefinition.parseCharCategory = function (class_id, parsed_category_def) {
    var category = parsed_category_def[1];
    var invoke = parseInt(parsed_category_def[2]);
    var grouping = parseInt(parsed_category_def[3]);
    var max_length = parseInt(parsed_category_def[4]);
    if (!isFinite(invoke) || (invoke !== 0 && invoke !== 1)) {
        console.log("char.def parse error. INVOKE is 0 or 1 in:" + invoke);
        return null;
    }
    if (!isFinite(grouping) || (grouping !== 0 && grouping !== 1)) {
        console.log("char.def parse error. GROUP is 0 or 1 in:" + grouping);
        return null;
    }
    if (!isFinite(max_length) || max_length < 0) {
        console.log("char.def parse error. LENGTH is 1 to n:" + max_length);
        return null;
    }
    var is_invoke = (invoke === 1);
    var is_grouping = (grouping === 1);

    return new CharacterClass(class_id, category, is_invoke, is_grouping, max_length);
};

CharacterDefinition.parseCategoryMapping = function (parsed_category_mapping) {
    var start = parseInt(parsed_category_mapping[1]);
    var default_category = parsed_category_mapping[2];
    var compatible_category = (3 < parsed_category_mapping.length) ? parsed_category_mapping.slice(3) : [];
    if (!isFinite(start) || start < 0 || start > 0xFFFF) {
        console.log("char.def parse error. CODE is invalid:" + start);
    }
    return { start: start, default: default_category, compatible: compatible_category};
};

CharacterDefinition.parseRangeCategoryMapping = function (parsed_category_mapping) {
    var start = parseInt(parsed_category_mapping[1]);
    var end = parseInt(parsed_category_mapping[2]);
    var default_category = parsed_category_mapping[3];
    var compatible_category = (4 < parsed_category_mapping.length) ? parsed_category_mapping.slice(4) : [];
    if (!isFinite(start) || start < 0 || start > 0xFFFF) {
        console.log("char.def parse error. CODE is invalid:" + start);
    }
    if (!isFinite(end) || end < 0 || end > 0xFFFF) {
        console.log("char.def parse error. CODE is invalid:" + end);
    }
    return { start: start, end: end, default: default_category, compatible: compatible_category};
};

/**
 * Initializing method
 * @param {Array} category_mapping Array of category mapping
 */
CharacterDefinition.prototype.initCategoryMappings = function (category_mapping) {
    // Initialize map by DEFAULT class
    var code_point;
    if (category_mapping != null) {
        for (var i = 0; i < category_mapping.length; i++) {
            var mapping = category_mapping[i];
            var end = mapping.end || mapping.start;
            for (code_point = mapping.start; code_point <= end; code_point++) {

                // Default Category class ID
                this.character_category_map[code_point] = this.invoke_definition_map.lookup(mapping.default);

                for (var j = 0; j < mapping.compatible.length; j++) {
                    var bitset = this.compatible_category_map[code_point];
                    var compatible_category = mapping.compatible[j];
                    if (compatible_category == null) {
                        continue;
                    }
                    var class_id = this.invoke_definition_map.lookup(compatible_category);  // Default Category
                    if (class_id == null) {
                        continue;
                    }
                    var class_id_bit = 1 << class_id;
                    bitset = bitset | class_id_bit;  // Set a bit of class ID 例えば、class_idが3のとき、3ビット目に1を立てる
                    this.compatible_category_map[code_point] = bitset;
                }
            }
        }
    }
    var default_id = this.invoke_definition_map.lookup(DEFAULT_CATEGORY);
    if (default_id == null) {
        return;
    }
    for (code_point = 0; code_point < this.character_category_map.length; code_point++) {
        // 他に何のクラスも定義されていなかったときだけ DEFAULT
        if (this.character_category_map[code_point] === 0) {
            // DEFAULT class ID に対応するビットだけ1を立てる
            this.character_category_map[code_point] = 1 << default_id;
        }
    }
};

/**
 * Lookup compatible categories for a character (not included 1st category)
 * @param {string} ch UCS2 character (just 1st character is effective)
 * @returns {Array.<CharacterClass>} character classes
 */
CharacterDefinition.prototype.lookupCompatibleCategory = function (ch) {
    var classes = [];

    /*
     if (SurrogateAwareString.isSurrogatePair(ch)) {
     // Surrogate pair character codes can not be defined by char.def
     return classes;
     }*/
    var code = ch.charCodeAt(0);
    var integer;
    if (code < this.compatible_category_map.length) {
        integer = this.compatible_category_map[code];  // Bitset
    }

    if (integer == null || integer === 0) {
        return classes;
    }

    for (var bit = 0; bit < 32; bit++) {  // Treat "bit" as a class ID
        if (((integer << (31 - bit)) >>> 31) === 1) {
            var character_class = this.invoke_definition_map.getCharacterClass(bit);
            if (character_class == null) {
                continue;
            }
            classes.push(character_class);
        }
    }
    return classes;
};


/**
 * Lookup category for a character
 * @param {string} ch UCS2 character (just 1st character is effective)
 * @returns {CharacterClass} character class
 */
CharacterDefinition.prototype.lookup = function (ch) {

    var class_id;

    var code = ch.charCodeAt(0);
    if (SurrogateAwareString.isSurrogatePair(ch)) {
        // Surrogate pair character codes can not be defined by char.def, so set DEFAULT category
        class_id = this.invoke_definition_map.lookup(DEFAULT_CATEGORY);
    } else if (code < this.character_category_map.length) {
        class_id = this.character_category_map[code];  // Read as integer value
    }

    if (class_id == null) {
        class_id = this.invoke_definition_map.lookup(DEFAULT_CATEGORY);
    }

    return this.invoke_definition_map.getCharacterClass(class_id);
};


module.exports = CharacterDefinition;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdC9DaGFyYWN0ZXJEZWZpbml0aW9uLmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsiZGljdC9DaGFyYWN0ZXJEZWZpbml0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgSW52b2tlRGVmaW5pdGlvbk1hcCA9IHJlcXVpcmUoXCIuL0ludm9rZURlZmluaXRpb25NYXAuanNcIik7XG52YXIgQ2hhcmFjdGVyQ2xhc3MgPSByZXF1aXJlKFwiLi9DaGFyYWN0ZXJDbGFzcy5qc1wiKTtcbnZhciBTdXJyb2dhdGVBd2FyZVN0cmluZyA9IHJlcXVpcmUoXCIuLi91dGlsL1N1cnJvZ2F0ZUF3YXJlU3RyaW5nLmpzXCIpO1xuXG52YXIgREVGQVVMVF9DQVRFR09SWSA9IFwiREVGQVVMVFwiO1xudmFyIFJFVFVSTl9QQVRURVJOID0gL1xccnxcXG58XFxyXFxuLztcbnZhciBDQVRFR09SWV9ERUZfUEFUVEVSTiA9IC9eKFxcdyspXFxzKyhcXGQpXFxzKyhcXGQpXFxzKyhcXGQpLztcbnZhciBDQVRFR09SWV9NQVBQSU5HX1BBVFRFUk4gPSAvXigweFswLTlBLUZdezR9KSg/OlxccysoW14jXFxzXSspKSg/OlxccysoW14jXFxzXSspKSovO1xudmFyIFJBTkdFX0NBVEVHT1JZX01BUFBJTkdfUEFUVEVSTiA9IC9eKDB4WzAtOUEtRl17NH0pXFwuXFwuKDB4WzAtOUEtRl17NH0pKD86XFxzKyhbXiNcXHNdKykpKD86XFxzKyhbXiNcXHNdKykpKi87XG5cblxuLyoqXG4gKiBDaGFyYWN0ZXJEZWZpbml0aW9uIHJlcHJlc2VudHMgY2hhci5kZWYgZmlsZSBhbmRcbiAqIGRlZmluZXMgYmVoYXZpb3Igb2YgdW5rbm93biB3b3JkIHByb2Nlc3NpbmdcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDaGFyYWN0ZXJEZWZpbml0aW9uKCkge1xuICAgIHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcCA9IG5ldyBVaW50OEFycmF5KDY1NTM2KTsgIC8vIGZvciBhbGwgVUNTMiBjb2RlIHBvaW50c1xuICAgIHRoaXMuY29tcGF0aWJsZV9jYXRlZ29yeV9tYXAgPSBuZXcgVWludDMyQXJyYXkoNjU1MzYpOyAgLy8gZm9yIGFsbCBVQ1MyIGNvZGUgcG9pbnRzXG4gICAgdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAgPSBudWxsO1xuXG59XG5cbi8qKlxuICogTG9hZCBDaGFyYWN0ZXJEZWZpbml0aW9uXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IGNhdF9tYXBfYnVmZmVyXG4gKiBAcGFyYW0ge1VpbnQzMkFycmF5fSBjb21wYXRfY2F0X21hcF9idWZmZXJcbiAqIEBwYXJhbSB7SW52b2tlRGVmaW5pdGlvbk1hcH0gaW52b2tlX2RlZl9idWZmZXJcbiAqIEByZXR1cm5zIHtDaGFyYWN0ZXJEZWZpbml0aW9ufVxuICovXG5DaGFyYWN0ZXJEZWZpbml0aW9uLmxvYWQgPSBmdW5jdGlvbiAoY2F0X21hcF9idWZmZXIsIGNvbXBhdF9jYXRfbWFwX2J1ZmZlciwgaW52b2tlX2RlZl9idWZmZXIpIHtcbiAgICB2YXIgY2hhcl9kZWYgPSBuZXcgQ2hhcmFjdGVyRGVmaW5pdGlvbigpO1xuICAgIGNoYXJfZGVmLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXAgPSBjYXRfbWFwX2J1ZmZlcjtcbiAgICBjaGFyX2RlZi5jb21wYXRpYmxlX2NhdGVnb3J5X21hcCA9IGNvbXBhdF9jYXRfbWFwX2J1ZmZlcjtcbiAgICBjaGFyX2RlZi5pbnZva2VfZGVmaW5pdGlvbl9tYXAgPSBJbnZva2VEZWZpbml0aW9uTWFwLmxvYWQoaW52b2tlX2RlZl9idWZmZXIpO1xuICAgIHJldHVybiBjaGFyX2RlZjtcbn07XG5cbi8qKlxuICogRmFjdG9yeSBtZXRob2Qgb2YgQ2hhcmFjdGVyRGVmaW5pdGlvblxuICogQHBhcmFtIHtzdHJpbmd9IHRleHQgQ29udGVudHMgb2YgY2hhci5kZWZcbiAqL1xuQ2hhcmFjdGVyRGVmaW5pdGlvbi5yZWFkQ2hhcmFjdGVyRGVmaW5pdGlvbiA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgdmFyIGxpbmVzID0gdGV4dC5zcGxpdChSRVRVUk5fUEFUVEVSTik7XG4gICAgdmFyIGxpbmU7XG4gICAgdmFyIGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uID0gW107XG4gICAgdmFyIGNhdGVnb3J5X21hcHBpbmcgPSBbXTtcblxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsaW5lID0gbGluZXNbaV07XG4gICAgICAgIGlmIChsaW5lID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJzZWRfY2F0ZWdvcnlfZGVmID0gQ0FURUdPUllfREVGX1BBVFRFUk4uZXhlYyhsaW5lKTtcbiAgICAgICAgaWYgKHBhcnNlZF9jYXRlZ29yeV9kZWYgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGNsYXNzX2lkID0gY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24ubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGNoYXJfY2xhc3MgPSBDaGFyYWN0ZXJEZWZpbml0aW9uLnBhcnNlQ2hhckNhdGVnb3J5KGNsYXNzX2lkLCBwYXJzZWRfY2F0ZWdvcnlfZGVmKTtcbiAgICAgICAgICAgIGlmIChjaGFyX2NsYXNzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uLnB1c2goY2hhcl9jbGFzcyk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyc2VkX2NhdGVnb3J5X21hcHBpbmcgPSBDQVRFR09SWV9NQVBQSU5HX1BBVFRFUk4uZXhlYyhsaW5lKTtcbiAgICAgICAgaWYgKHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBtYXBwaW5nID0gQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZUNhdGVnb3J5TWFwcGluZyhwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZyk7XG4gICAgICAgICAgICBjYXRlZ29yeV9tYXBwaW5nLnB1c2gobWFwcGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnNlZF9yYW5nZV9jYXRlZ29yeV9tYXBwaW5nID0gUkFOR0VfQ0FURUdPUllfTUFQUElOR19QQVRURVJOLmV4ZWMobGluZSk7XG4gICAgICAgIGlmIChwYXJzZWRfcmFuZ2VfY2F0ZWdvcnlfbWFwcGluZyAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgcmFuZ2VfbWFwcGluZyA9IENoYXJhY3RlckRlZmluaXRpb24ucGFyc2VSYW5nZUNhdGVnb3J5TWFwcGluZyhwYXJzZWRfcmFuZ2VfY2F0ZWdvcnlfbWFwcGluZyk7XG4gICAgICAgICAgICBjYXRlZ29yeV9tYXBwaW5nLnB1c2gocmFuZ2VfbWFwcGluZyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIElmIERFRkFVTFQgY2F0ZWdvcnkgZG9lcyBub3QgZXhpc3QsIHRocm93IGVycm9yXG5cbiAgICB2YXIgY2hhcl9kZWYgPSBuZXcgQ2hhcmFjdGVyRGVmaW5pdGlvbigpO1xuICAgIGNoYXJfZGVmLmludm9rZV9kZWZpbml0aW9uX21hcCA9IG5ldyBJbnZva2VEZWZpbml0aW9uTWFwKCk7XG4gICAgY2hhcl9kZWYuaW52b2tlX2RlZmluaXRpb25fbWFwLmluaXQoY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24pO1xuICAgIGNoYXJfZGVmLmluaXRDYXRlZ29yeU1hcHBpbmdzKGNhdGVnb3J5X21hcHBpbmcpO1xuXG4gICAgcmV0dXJuIGNoYXJfZGVmO1xufTtcblxuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZUNoYXJDYXRlZ29yeSA9IGZ1bmN0aW9uIChjbGFzc19pZCwgcGFyc2VkX2NhdGVnb3J5X2RlZikge1xuICAgIHZhciBjYXRlZ29yeSA9IHBhcnNlZF9jYXRlZ29yeV9kZWZbMV07XG4gICAgdmFyIGludm9rZSA9IHBhcnNlSW50KHBhcnNlZF9jYXRlZ29yeV9kZWZbMl0pO1xuICAgIHZhciBncm91cGluZyA9IHBhcnNlSW50KHBhcnNlZF9jYXRlZ29yeV9kZWZbM10pO1xuICAgIHZhciBtYXhfbGVuZ3RoID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X2RlZls0XSk7XG4gICAgaWYgKCFpc0Zpbml0ZShpbnZva2UpIHx8IChpbnZva2UgIT09IDAgJiYgaW52b2tlICE9PSAxKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNoYXIuZGVmIHBhcnNlIGVycm9yLiBJTlZPS0UgaXMgMCBvciAxIGluOlwiICsgaW52b2tlKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICghaXNGaW5pdGUoZ3JvdXBpbmcpIHx8IChncm91cGluZyAhPT0gMCAmJiBncm91cGluZyAhPT0gMSkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjaGFyLmRlZiBwYXJzZSBlcnJvci4gR1JPVVAgaXMgMCBvciAxIGluOlwiICsgZ3JvdXBpbmcpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKCFpc0Zpbml0ZShtYXhfbGVuZ3RoKSB8fCBtYXhfbGVuZ3RoIDwgMCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNoYXIuZGVmIHBhcnNlIGVycm9yLiBMRU5HVEggaXMgMSB0byBuOlwiICsgbWF4X2xlbmd0aCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgaXNfaW52b2tlID0gKGludm9rZSA9PT0gMSk7XG4gICAgdmFyIGlzX2dyb3VwaW5nID0gKGdyb3VwaW5nID09PSAxKTtcblxuICAgIHJldHVybiBuZXcgQ2hhcmFjdGVyQ2xhc3MoY2xhc3NfaWQsIGNhdGVnb3J5LCBpc19pbnZva2UsIGlzX2dyb3VwaW5nLCBtYXhfbGVuZ3RoKTtcbn07XG5cbkNoYXJhY3RlckRlZmluaXRpb24ucGFyc2VDYXRlZ29yeU1hcHBpbmcgPSBmdW5jdGlvbiAocGFyc2VkX2NhdGVnb3J5X21hcHBpbmcpIHtcbiAgICB2YXIgc3RhcnQgPSBwYXJzZUludChwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZ1sxXSk7XG4gICAgdmFyIGRlZmF1bHRfY2F0ZWdvcnkgPSBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZ1syXTtcbiAgICB2YXIgY29tcGF0aWJsZV9jYXRlZ29yeSA9ICgzIDwgcGFyc2VkX2NhdGVnb3J5X21hcHBpbmcubGVuZ3RoKSA/IHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nLnNsaWNlKDMpIDogW107XG4gICAgaWYgKCFpc0Zpbml0ZShzdGFydCkgfHwgc3RhcnQgPCAwIHx8IHN0YXJ0ID4gMHhGRkZGKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIENPREUgaXMgaW52YWxpZDpcIiArIHN0YXJ0KTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc3RhcnQ6IHN0YXJ0LCBkZWZhdWx0OiBkZWZhdWx0X2NhdGVnb3J5LCBjb21wYXRpYmxlOiBjb21wYXRpYmxlX2NhdGVnb3J5fTtcbn07XG5cbkNoYXJhY3RlckRlZmluaXRpb24ucGFyc2VSYW5nZUNhdGVnb3J5TWFwcGluZyA9IGZ1bmN0aW9uIChwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZykge1xuICAgIHZhciBzdGFydCA9IHBhcnNlSW50KHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nWzFdKTtcbiAgICB2YXIgZW5kID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X21hcHBpbmdbMl0pO1xuICAgIHZhciBkZWZhdWx0X2NhdGVnb3J5ID0gcGFyc2VkX2NhdGVnb3J5X21hcHBpbmdbM107XG4gICAgdmFyIGNvbXBhdGlibGVfY2F0ZWdvcnkgPSAoNCA8IHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nLmxlbmd0aCkgPyBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZy5zbGljZSg0KSA6IFtdO1xuICAgIGlmICghaXNGaW5pdGUoc3RhcnQpIHx8IHN0YXJ0IDwgMCB8fCBzdGFydCA+IDB4RkZGRikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNoYXIuZGVmIHBhcnNlIGVycm9yLiBDT0RFIGlzIGludmFsaWQ6XCIgKyBzdGFydCk7XG4gICAgfVxuICAgIGlmICghaXNGaW5pdGUoZW5kKSB8fCBlbmQgPCAwIHx8IGVuZCA+IDB4RkZGRikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNoYXIuZGVmIHBhcnNlIGVycm9yLiBDT0RFIGlzIGludmFsaWQ6XCIgKyBlbmQpO1xuICAgIH1cbiAgICByZXR1cm4geyBzdGFydDogc3RhcnQsIGVuZDogZW5kLCBkZWZhdWx0OiBkZWZhdWx0X2NhdGVnb3J5LCBjb21wYXRpYmxlOiBjb21wYXRpYmxlX2NhdGVnb3J5fTtcbn07XG5cbi8qKlxuICogSW5pdGlhbGl6aW5nIG1ldGhvZFxuICogQHBhcmFtIHtBcnJheX0gY2F0ZWdvcnlfbWFwcGluZyBBcnJheSBvZiBjYXRlZ29yeSBtYXBwaW5nXG4gKi9cbkNoYXJhY3RlckRlZmluaXRpb24ucHJvdG90eXBlLmluaXRDYXRlZ29yeU1hcHBpbmdzID0gZnVuY3Rpb24gKGNhdGVnb3J5X21hcHBpbmcpIHtcbiAgICAvLyBJbml0aWFsaXplIG1hcCBieSBERUZBVUxUIGNsYXNzXG4gICAgdmFyIGNvZGVfcG9pbnQ7XG4gICAgaWYgKGNhdGVnb3J5X21hcHBpbmcgIT0gbnVsbCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhdGVnb3J5X21hcHBpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtYXBwaW5nID0gY2F0ZWdvcnlfbWFwcGluZ1tpXTtcbiAgICAgICAgICAgIHZhciBlbmQgPSBtYXBwaW5nLmVuZCB8fCBtYXBwaW5nLnN0YXJ0O1xuICAgICAgICAgICAgZm9yIChjb2RlX3BvaW50ID0gbWFwcGluZy5zdGFydDsgY29kZV9wb2ludCA8PSBlbmQ7IGNvZGVfcG9pbnQrKykge1xuXG4gICAgICAgICAgICAgICAgLy8gRGVmYXVsdCBDYXRlZ29yeSBjbGFzcyBJRFxuICAgICAgICAgICAgICAgIHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcFtjb2RlX3BvaW50XSA9IHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmxvb2t1cChtYXBwaW5nLmRlZmF1bHQpO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXBwaW5nLmNvbXBhdGlibGUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJpdHNldCA9IHRoaXMuY29tcGF0aWJsZV9jYXRlZ29yeV9tYXBbY29kZV9wb2ludF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wYXRpYmxlX2NhdGVnb3J5ID0gbWFwcGluZy5jb21wYXRpYmxlW2pdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGF0aWJsZV9jYXRlZ29yeSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgY2xhc3NfaWQgPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5sb29rdXAoY29tcGF0aWJsZV9jYXRlZ29yeSk7ICAvLyBEZWZhdWx0IENhdGVnb3J5XG4gICAgICAgICAgICAgICAgICAgIGlmIChjbGFzc19pZCA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgY2xhc3NfaWRfYml0ID0gMSA8PCBjbGFzc19pZDtcbiAgICAgICAgICAgICAgICAgICAgYml0c2V0ID0gYml0c2V0IHwgY2xhc3NfaWRfYml0OyAgLy8gU2V0IGEgYml0IG9mIGNsYXNzIElEIOS+i+OBiOOBsOOAgWNsYXNzX2lk44GMM+OBruOBqOOBjeOAgTPjg5Pjg4Pjg4jnm67jgasx44KS56uL44Gm44KLXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29tcGF0aWJsZV9jYXRlZ29yeV9tYXBbY29kZV9wb2ludF0gPSBiaXRzZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBkZWZhdWx0X2lkID0gdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAubG9va3VwKERFRkFVTFRfQ0FURUdPUlkpO1xuICAgIGlmIChkZWZhdWx0X2lkID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvZGVfcG9pbnQgPSAwOyBjb2RlX3BvaW50IDwgdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwLmxlbmd0aDsgY29kZV9wb2ludCsrKSB7XG4gICAgICAgIC8vIOS7luOBq+S9leOBruOCr+ODqeOCueOCguWumue+qeOBleOCjOOBpuOBhOOBquOBi+OBo+OBn+OBqOOBjeOBoOOBkSBERUZBVUxUXG4gICAgICAgIGlmICh0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXBbY29kZV9wb2ludF0gPT09IDApIHtcbiAgICAgICAgICAgIC8vIERFRkFVTFQgY2xhc3MgSUQg44Gr5a++5b+c44GZ44KL44OT44OD44OI44Gg44GRMeOCkueri+OBpuOCi1xuICAgICAgICAgICAgdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwW2NvZGVfcG9pbnRdID0gMSA8PCBkZWZhdWx0X2lkO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBMb29rdXAgY29tcGF0aWJsZSBjYXRlZ29yaWVzIGZvciBhIGNoYXJhY3RlciAobm90IGluY2x1ZGVkIDFzdCBjYXRlZ29yeSlcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaCBVQ1MyIGNoYXJhY3RlciAoanVzdCAxc3QgY2hhcmFjdGVyIGlzIGVmZmVjdGl2ZSlcbiAqIEByZXR1cm5zIHtBcnJheS48Q2hhcmFjdGVyQ2xhc3M+fSBjaGFyYWN0ZXIgY2xhc3Nlc1xuICovXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnByb3RvdHlwZS5sb29rdXBDb21wYXRpYmxlQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoY2gpIHtcbiAgICB2YXIgY2xhc3NlcyA9IFtdO1xuXG4gICAgLypcbiAgICAgaWYgKFN1cnJvZ2F0ZUF3YXJlU3RyaW5nLmlzU3Vycm9nYXRlUGFpcihjaCkpIHtcbiAgICAgLy8gU3Vycm9nYXRlIHBhaXIgY2hhcmFjdGVyIGNvZGVzIGNhbiBub3QgYmUgZGVmaW5lZCBieSBjaGFyLmRlZlxuICAgICByZXR1cm4gY2xhc3NlcztcbiAgICAgfSovXG4gICAgdmFyIGNvZGUgPSBjaC5jaGFyQ29kZUF0KDApO1xuICAgIHZhciBpbnRlZ2VyO1xuICAgIGlmIChjb2RlIDwgdGhpcy5jb21wYXRpYmxlX2NhdGVnb3J5X21hcC5sZW5ndGgpIHtcbiAgICAgICAgaW50ZWdlciA9IHRoaXMuY29tcGF0aWJsZV9jYXRlZ29yeV9tYXBbY29kZV07ICAvLyBCaXRzZXRcbiAgICB9XG5cbiAgICBpZiAoaW50ZWdlciA9PSBudWxsIHx8IGludGVnZXIgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGNsYXNzZXM7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgYml0ID0gMDsgYml0IDwgMzI7IGJpdCsrKSB7ICAvLyBUcmVhdCBcImJpdFwiIGFzIGEgY2xhc3MgSURcbiAgICAgICAgaWYgKCgoaW50ZWdlciA8PCAoMzEgLSBiaXQpKSA+Pj4gMzEpID09PSAxKSB7XG4gICAgICAgICAgICB2YXIgY2hhcmFjdGVyX2NsYXNzID0gdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAuZ2V0Q2hhcmFjdGVyQ2xhc3MoYml0KTtcbiAgICAgICAgICAgIGlmIChjaGFyYWN0ZXJfY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xhc3Nlcy5wdXNoKGNoYXJhY3Rlcl9jbGFzcyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGNsYXNzZXM7XG59O1xuXG5cbi8qKlxuICogTG9va3VwIGNhdGVnb3J5IGZvciBhIGNoYXJhY3RlclxuICogQHBhcmFtIHtzdHJpbmd9IGNoIFVDUzIgY2hhcmFjdGVyIChqdXN0IDFzdCBjaGFyYWN0ZXIgaXMgZWZmZWN0aXZlKVxuICogQHJldHVybnMge0NoYXJhY3RlckNsYXNzfSBjaGFyYWN0ZXIgY2xhc3NcbiAqL1xuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wcm90b3R5cGUubG9va3VwID0gZnVuY3Rpb24gKGNoKSB7XG5cbiAgICB2YXIgY2xhc3NfaWQ7XG5cbiAgICB2YXIgY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKFN1cnJvZ2F0ZUF3YXJlU3RyaW5nLmlzU3Vycm9nYXRlUGFpcihjaCkpIHtcbiAgICAgICAgLy8gU3Vycm9nYXRlIHBhaXIgY2hhcmFjdGVyIGNvZGVzIGNhbiBub3QgYmUgZGVmaW5lZCBieSBjaGFyLmRlZiwgc28gc2V0IERFRkFVTFQgY2F0ZWdvcnlcbiAgICAgICAgY2xhc3NfaWQgPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5sb29rdXAoREVGQVVMVF9DQVRFR09SWSk7XG4gICAgfSBlbHNlIGlmIChjb2RlIDwgdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwLmxlbmd0aCkge1xuICAgICAgICBjbGFzc19pZCA9IHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcFtjb2RlXTsgIC8vIFJlYWQgYXMgaW50ZWdlciB2YWx1ZVxuICAgIH1cblxuICAgIGlmIChjbGFzc19pZCA9PSBudWxsKSB7XG4gICAgICAgIGNsYXNzX2lkID0gdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAubG9va3VwKERFRkFVTFRfQ0FURUdPUlkpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5nZXRDaGFyYWN0ZXJDbGFzcyhjbGFzc19pZCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhcmFjdGVyRGVmaW5pdGlvbjtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==