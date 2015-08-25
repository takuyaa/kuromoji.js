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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0NoYXJhY3RlckRlZmluaXRpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEludm9rZURlZmluaXRpb25NYXAgPSByZXF1aXJlKFwiLi9JbnZva2VEZWZpbml0aW9uTWFwLmpzXCIpO1xudmFyIENoYXJhY3RlckNsYXNzID0gcmVxdWlyZShcIi4vQ2hhcmFjdGVyQ2xhc3MuanNcIik7XG52YXIgU3Vycm9nYXRlQXdhcmVTdHJpbmcgPSByZXF1aXJlKFwiLi4vdXRpbC9TdXJyb2dhdGVBd2FyZVN0cmluZy5qc1wiKTtcblxudmFyIERFRkFVTFRfQ0FURUdPUlkgPSBcIkRFRkFVTFRcIjtcbnZhciBSRVRVUk5fUEFUVEVSTiA9IC9cXHJ8XFxufFxcclxcbi87XG52YXIgQ0FURUdPUllfREVGX1BBVFRFUk4gPSAvXihcXHcrKVxccysoXFxkKVxccysoXFxkKVxccysoXFxkKS87XG52YXIgQ0FURUdPUllfTUFQUElOR19QQVRURVJOID0gL14oMHhbMC05QS1GXXs0fSkoPzpcXHMrKFteI1xcc10rKSkoPzpcXHMrKFteI1xcc10rKSkqLztcbnZhciBSQU5HRV9DQVRFR09SWV9NQVBQSU5HX1BBVFRFUk4gPSAvXigweFswLTlBLUZdezR9KVxcLlxcLigweFswLTlBLUZdezR9KSg/OlxccysoW14jXFxzXSspKSg/OlxccysoW14jXFxzXSspKSovO1xuXG5cbi8qKlxuICogQ2hhcmFjdGVyRGVmaW5pdGlvbiByZXByZXNlbnRzIGNoYXIuZGVmIGZpbGUgYW5kXG4gKiBkZWZpbmVzIGJlaGF2aW9yIG9mIHVua25vd24gd29yZCBwcm9jZXNzaW5nXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ2hhcmFjdGVyRGVmaW5pdGlvbigpIHtcbiAgICB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXAgPSBuZXcgVWludDhBcnJheSg2NTUzNik7ICAvLyBmb3IgYWxsIFVDUzIgY29kZSBwb2ludHNcbiAgICB0aGlzLmNvbXBhdGlibGVfY2F0ZWdvcnlfbWFwID0gbmV3IFVpbnQzMkFycmF5KDY1NTM2KTsgIC8vIGZvciBhbGwgVUNTMiBjb2RlIHBvaW50c1xuICAgIHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwID0gbnVsbDtcblxufVxuXG4vKipcbiAqIExvYWQgQ2hhcmFjdGVyRGVmaW5pdGlvblxuICogQHBhcmFtIHtVaW50OEFycmF5fSBjYXRfbWFwX2J1ZmZlclxuICogQHBhcmFtIHtVaW50MzJBcnJheX0gY29tcGF0X2NhdF9tYXBfYnVmZmVyXG4gKiBAcGFyYW0ge0ludm9rZURlZmluaXRpb25NYXB9IGludm9rZV9kZWZfYnVmZmVyXG4gKiBAcmV0dXJucyB7Q2hhcmFjdGVyRGVmaW5pdGlvbn1cbiAqL1xuQ2hhcmFjdGVyRGVmaW5pdGlvbi5sb2FkID0gZnVuY3Rpb24gKGNhdF9tYXBfYnVmZmVyLCBjb21wYXRfY2F0X21hcF9idWZmZXIsIGludm9rZV9kZWZfYnVmZmVyKSB7XG4gICAgdmFyIGNoYXJfZGVmID0gbmV3IENoYXJhY3RlckRlZmluaXRpb24oKTtcbiAgICBjaGFyX2RlZi5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwID0gY2F0X21hcF9idWZmZXI7XG4gICAgY2hhcl9kZWYuY29tcGF0aWJsZV9jYXRlZ29yeV9tYXAgPSBjb21wYXRfY2F0X21hcF9idWZmZXI7XG4gICAgY2hhcl9kZWYuaW52b2tlX2RlZmluaXRpb25fbWFwID0gSW52b2tlRGVmaW5pdGlvbk1hcC5sb2FkKGludm9rZV9kZWZfYnVmZmVyKTtcbiAgICByZXR1cm4gY2hhcl9kZWY7XG59O1xuXG4vKipcbiAqIEZhY3RvcnkgbWV0aG9kIG9mIENoYXJhY3RlckRlZmluaXRpb25cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IENvbnRlbnRzIG9mIGNoYXIuZGVmXG4gKi9cbkNoYXJhY3RlckRlZmluaXRpb24ucmVhZENoYXJhY3RlckRlZmluaXRpb24gPSBmdW5jdGlvbiAodGV4dCkge1xuICAgIHZhciBsaW5lcyA9IHRleHQuc3BsaXQoUkVUVVJOX1BBVFRFUk4pO1xuICAgIHZhciBsaW5lO1xuICAgIHZhciBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbiA9IFtdO1xuICAgIHZhciBjYXRlZ29yeV9tYXBwaW5nID0gW107XG5cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGluZSA9IGxpbmVzW2ldO1xuICAgICAgICBpZiAobGluZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyc2VkX2NhdGVnb3J5X2RlZiA9IENBVEVHT1JZX0RFRl9QQVRURVJOLmV4ZWMobGluZSk7XG4gICAgICAgIGlmIChwYXJzZWRfY2F0ZWdvcnlfZGVmICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBjbGFzc19pZCA9IGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBjaGFyX2NsYXNzID0gQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZUNoYXJDYXRlZ29yeShjbGFzc19pZCwgcGFyc2VkX2NhdGVnb3J5X2RlZik7XG4gICAgICAgICAgICBpZiAoY2hhcl9jbGFzcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbi5wdXNoKGNoYXJfY2xhc3MpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nID0gQ0FURUdPUllfTUFQUElOR19QQVRURVJOLmV4ZWMobGluZSk7XG4gICAgICAgIGlmIChwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZyAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgbWFwcGluZyA9IENoYXJhY3RlckRlZmluaXRpb24ucGFyc2VDYXRlZ29yeU1hcHBpbmcocGFyc2VkX2NhdGVnb3J5X21hcHBpbmcpO1xuICAgICAgICAgICAgY2F0ZWdvcnlfbWFwcGluZy5wdXNoKG1hcHBpbmcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJzZWRfcmFuZ2VfY2F0ZWdvcnlfbWFwcGluZyA9IFJBTkdFX0NBVEVHT1JZX01BUFBJTkdfUEFUVEVSTi5leGVjKGxpbmUpO1xuICAgICAgICBpZiAocGFyc2VkX3JhbmdlX2NhdGVnb3J5X21hcHBpbmcgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIHJhbmdlX21hcHBpbmcgPSBDaGFyYWN0ZXJEZWZpbml0aW9uLnBhcnNlUmFuZ2VDYXRlZ29yeU1hcHBpbmcocGFyc2VkX3JhbmdlX2NhdGVnb3J5X21hcHBpbmcpO1xuICAgICAgICAgICAgY2F0ZWdvcnlfbWFwcGluZy5wdXNoKHJhbmdlX21hcHBpbmcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gVE9ETyBJZiBERUZBVUxUIGNhdGVnb3J5IGRvZXMgbm90IGV4aXN0LCB0aHJvdyBlcnJvclxuXG4gICAgdmFyIGNoYXJfZGVmID0gbmV3IENoYXJhY3RlckRlZmluaXRpb24oKTtcbiAgICBjaGFyX2RlZi5pbnZva2VfZGVmaW5pdGlvbl9tYXAgPSBuZXcgSW52b2tlRGVmaW5pdGlvbk1hcCgpO1xuICAgIGNoYXJfZGVmLmludm9rZV9kZWZpbml0aW9uX21hcC5pbml0KGNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uKTtcbiAgICBjaGFyX2RlZi5pbml0Q2F0ZWdvcnlNYXBwaW5ncyhjYXRlZ29yeV9tYXBwaW5nKTtcblxuICAgIHJldHVybiBjaGFyX2RlZjtcbn07XG5cbkNoYXJhY3RlckRlZmluaXRpb24ucGFyc2VDaGFyQ2F0ZWdvcnkgPSBmdW5jdGlvbiAoY2xhc3NfaWQsIHBhcnNlZF9jYXRlZ29yeV9kZWYpIHtcbiAgICB2YXIgY2F0ZWdvcnkgPSBwYXJzZWRfY2F0ZWdvcnlfZGVmWzFdO1xuICAgIHZhciBpbnZva2UgPSBwYXJzZUludChwYXJzZWRfY2F0ZWdvcnlfZGVmWzJdKTtcbiAgICB2YXIgZ3JvdXBpbmcgPSBwYXJzZUludChwYXJzZWRfY2F0ZWdvcnlfZGVmWzNdKTtcbiAgICB2YXIgbWF4X2xlbmd0aCA9IHBhcnNlSW50KHBhcnNlZF9jYXRlZ29yeV9kZWZbNF0pO1xuICAgIGlmICghaXNGaW5pdGUoaW52b2tlKSB8fCAoaW52b2tlICE9PSAwICYmIGludm9rZSAhPT0gMSkpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjaGFyLmRlZiBwYXJzZSBlcnJvci4gSU5WT0tFIGlzIDAgb3IgMSBpbjpcIiArIGludm9rZSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoIWlzRmluaXRlKGdyb3VwaW5nKSB8fCAoZ3JvdXBpbmcgIT09IDAgJiYgZ3JvdXBpbmcgIT09IDEpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIEdST1VQIGlzIDAgb3IgMSBpbjpcIiArIGdyb3VwaW5nKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICghaXNGaW5pdGUobWF4X2xlbmd0aCkgfHwgbWF4X2xlbmd0aCA8IDApIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjaGFyLmRlZiBwYXJzZSBlcnJvci4gTEVOR1RIIGlzIDEgdG8gbjpcIiArIG1heF9sZW5ndGgpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIGlzX2ludm9rZSA9IChpbnZva2UgPT09IDEpO1xuICAgIHZhciBpc19ncm91cGluZyA9IChncm91cGluZyA9PT0gMSk7XG5cbiAgICByZXR1cm4gbmV3IENoYXJhY3RlckNsYXNzKGNsYXNzX2lkLCBjYXRlZ29yeSwgaXNfaW52b2tlLCBpc19ncm91cGluZywgbWF4X2xlbmd0aCk7XG59O1xuXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnBhcnNlQ2F0ZWdvcnlNYXBwaW5nID0gZnVuY3Rpb24gKHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nKSB7XG4gICAgdmFyIHN0YXJ0ID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X21hcHBpbmdbMV0pO1xuICAgIHZhciBkZWZhdWx0X2NhdGVnb3J5ID0gcGFyc2VkX2NhdGVnb3J5X21hcHBpbmdbMl07XG4gICAgdmFyIGNvbXBhdGlibGVfY2F0ZWdvcnkgPSAoMyA8IHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nLmxlbmd0aCkgPyBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZy5zbGljZSgzKSA6IFtdO1xuICAgIGlmICghaXNGaW5pdGUoc3RhcnQpIHx8IHN0YXJ0IDwgMCB8fCBzdGFydCA+IDB4RkZGRikge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNoYXIuZGVmIHBhcnNlIGVycm9yLiBDT0RFIGlzIGludmFsaWQ6XCIgKyBzdGFydCk7XG4gICAgfVxuICAgIHJldHVybiB7IHN0YXJ0OiBzdGFydCwgZGVmYXVsdDogZGVmYXVsdF9jYXRlZ29yeSwgY29tcGF0aWJsZTogY29tcGF0aWJsZV9jYXRlZ29yeX07XG59O1xuXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnBhcnNlUmFuZ2VDYXRlZ29yeU1hcHBpbmcgPSBmdW5jdGlvbiAocGFyc2VkX2NhdGVnb3J5X21hcHBpbmcpIHtcbiAgICB2YXIgc3RhcnQgPSBwYXJzZUludChwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZ1sxXSk7XG4gICAgdmFyIGVuZCA9IHBhcnNlSW50KHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nWzJdKTtcbiAgICB2YXIgZGVmYXVsdF9jYXRlZ29yeSA9IHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nWzNdO1xuICAgIHZhciBjb21wYXRpYmxlX2NhdGVnb3J5ID0gKDQgPCBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZy5sZW5ndGgpID8gcGFyc2VkX2NhdGVnb3J5X21hcHBpbmcuc2xpY2UoNCkgOiBbXTtcbiAgICBpZiAoIWlzRmluaXRlKHN0YXJ0KSB8fCBzdGFydCA8IDAgfHwgc3RhcnQgPiAweEZGRkYpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjaGFyLmRlZiBwYXJzZSBlcnJvci4gQ09ERSBpcyBpbnZhbGlkOlwiICsgc3RhcnQpO1xuICAgIH1cbiAgICBpZiAoIWlzRmluaXRlKGVuZCkgfHwgZW5kIDwgMCB8fCBlbmQgPiAweEZGRkYpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjaGFyLmRlZiBwYXJzZSBlcnJvci4gQ09ERSBpcyBpbnZhbGlkOlwiICsgZW5kKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc3RhcnQ6IHN0YXJ0LCBlbmQ6IGVuZCwgZGVmYXVsdDogZGVmYXVsdF9jYXRlZ29yeSwgY29tcGF0aWJsZTogY29tcGF0aWJsZV9jYXRlZ29yeX07XG59O1xuXG4vKipcbiAqIEluaXRpYWxpemluZyBtZXRob2RcbiAqIEBwYXJhbSB7QXJyYXl9IGNhdGVnb3J5X21hcHBpbmcgQXJyYXkgb2YgY2F0ZWdvcnkgbWFwcGluZ1xuICovXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnByb3RvdHlwZS5pbml0Q2F0ZWdvcnlNYXBwaW5ncyA9IGZ1bmN0aW9uIChjYXRlZ29yeV9tYXBwaW5nKSB7XG4gICAgLy8gSW5pdGlhbGl6ZSBtYXAgYnkgREVGQVVMVCBjbGFzc1xuICAgIHZhciBjb2RlX3BvaW50O1xuICAgIGlmIChjYXRlZ29yeV9tYXBwaW5nICE9IG51bGwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXRlZ29yeV9tYXBwaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWFwcGluZyA9IGNhdGVnb3J5X21hcHBpbmdbaV07XG4gICAgICAgICAgICB2YXIgZW5kID0gbWFwcGluZy5lbmQgfHwgbWFwcGluZy5zdGFydDtcbiAgICAgICAgICAgIGZvciAoY29kZV9wb2ludCA9IG1hcHBpbmcuc3RhcnQ7IGNvZGVfcG9pbnQgPD0gZW5kOyBjb2RlX3BvaW50KyspIHtcblxuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgQ2F0ZWdvcnkgY2xhc3MgSURcbiAgICAgICAgICAgICAgICB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXBbY29kZV9wb2ludF0gPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5sb29rdXAobWFwcGluZy5kZWZhdWx0KTtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbWFwcGluZy5jb21wYXRpYmxlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiaXRzZXQgPSB0aGlzLmNvbXBhdGlibGVfY2F0ZWdvcnlfbWFwW2NvZGVfcG9pbnRdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcGF0aWJsZV9jYXRlZ29yeSA9IG1hcHBpbmcuY29tcGF0aWJsZVtqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBhdGlibGVfY2F0ZWdvcnkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsYXNzX2lkID0gdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAubG9va3VwKGNvbXBhdGlibGVfY2F0ZWdvcnkpOyAgLy8gRGVmYXVsdCBDYXRlZ29yeVxuICAgICAgICAgICAgICAgICAgICBpZiAoY2xhc3NfaWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNsYXNzX2lkX2JpdCA9IDEgPDwgY2xhc3NfaWQ7XG4gICAgICAgICAgICAgICAgICAgIGJpdHNldCA9IGJpdHNldCB8IGNsYXNzX2lkX2JpdDsgIC8vIFNldCBhIGJpdCBvZiBjbGFzcyBJRCDkvovjgYjjgbDjgIFjbGFzc19pZOOBjDPjga7jgajjgY3jgIEz44OT44OD44OI55uu44GrMeOCkueri+OBpuOCi1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbXBhdGlibGVfY2F0ZWdvcnlfbWFwW2NvZGVfcG9pbnRdID0gYml0c2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgZGVmYXVsdF9pZCA9IHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmxvb2t1cChERUZBVUxUX0NBVEVHT1JZKTtcbiAgICBpZiAoZGVmYXVsdF9pZCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChjb2RlX3BvaW50ID0gMDsgY29kZV9wb2ludCA8IHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcC5sZW5ndGg7IGNvZGVfcG9pbnQrKykge1xuICAgICAgICAvLyDku5bjgavkvZXjga7jgq/jg6njgrnjgoLlrprnvqnjgZXjgozjgabjgYTjgarjgYvjgaPjgZ/jgajjgY3jgaDjgZEgREVGQVVMVFxuICAgICAgICBpZiAodGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwW2NvZGVfcG9pbnRdID09PSAwKSB7XG4gICAgICAgICAgICAvLyBERUZBVUxUIGNsYXNzIElEIOOBq+WvvuW/nOOBmeOCi+ODk+ODg+ODiOOBoOOBkTHjgpLnq4vjgabjgotcbiAgICAgICAgICAgIHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcFtjb2RlX3BvaW50XSA9IDEgPDwgZGVmYXVsdF9pZDtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogTG9va3VwIGNvbXBhdGlibGUgY2F0ZWdvcmllcyBmb3IgYSBjaGFyYWN0ZXIgKG5vdCBpbmNsdWRlZCAxc3QgY2F0ZWdvcnkpXG4gKiBAcGFyYW0ge3N0cmluZ30gY2ggVUNTMiBjaGFyYWN0ZXIgKGp1c3QgMXN0IGNoYXJhY3RlciBpcyBlZmZlY3RpdmUpXG4gKiBAcmV0dXJucyB7QXJyYXkuPENoYXJhY3RlckNsYXNzPn0gY2hhcmFjdGVyIGNsYXNzZXNcbiAqL1xuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wcm90b3R5cGUubG9va3VwQ29tcGF0aWJsZUNhdGVnb3J5ID0gZnVuY3Rpb24gKGNoKSB7XG4gICAgdmFyIGNsYXNzZXMgPSBbXTtcblxuICAgIC8qXG4gICAgIGlmIChTdXJyb2dhdGVBd2FyZVN0cmluZy5pc1N1cnJvZ2F0ZVBhaXIoY2gpKSB7XG4gICAgIC8vIFN1cnJvZ2F0ZSBwYWlyIGNoYXJhY3RlciBjb2RlcyBjYW4gbm90IGJlIGRlZmluZWQgYnkgY2hhci5kZWZcbiAgICAgcmV0dXJuIGNsYXNzZXM7XG4gICAgIH0qL1xuICAgIHZhciBjb2RlID0gY2guY2hhckNvZGVBdCgwKTtcbiAgICB2YXIgaW50ZWdlcjtcbiAgICBpZiAoY29kZSA8IHRoaXMuY29tcGF0aWJsZV9jYXRlZ29yeV9tYXAubGVuZ3RoKSB7XG4gICAgICAgIGludGVnZXIgPSB0aGlzLmNvbXBhdGlibGVfY2F0ZWdvcnlfbWFwW2NvZGVdOyAgLy8gQml0c2V0XG4gICAgfVxuXG4gICAgaWYgKGludGVnZXIgPT0gbnVsbCB8fCBpbnRlZ2VyID09PSAwKSB7XG4gICAgICAgIHJldHVybiBjbGFzc2VzO1xuICAgIH1cblxuICAgIGZvciAodmFyIGJpdCA9IDA7IGJpdCA8IDMyOyBiaXQrKykgeyAgLy8gVHJlYXQgXCJiaXRcIiBhcyBhIGNsYXNzIElEXG4gICAgICAgIGlmICgoKGludGVnZXIgPDwgKDMxIC0gYml0KSkgPj4+IDMxKSA9PT0gMSkge1xuICAgICAgICAgICAgdmFyIGNoYXJhY3Rlcl9jbGFzcyA9IHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmdldENoYXJhY3RlckNsYXNzKGJpdCk7XG4gICAgICAgICAgICBpZiAoY2hhcmFjdGVyX2NsYXNzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsYXNzZXMucHVzaChjaGFyYWN0ZXJfY2xhc3MpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjbGFzc2VzO1xufTtcblxuXG4vKipcbiAqIExvb2t1cCBjYXRlZ29yeSBmb3IgYSBjaGFyYWN0ZXJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjaCBVQ1MyIGNoYXJhY3RlciAoanVzdCAxc3QgY2hhcmFjdGVyIGlzIGVmZmVjdGl2ZSlcbiAqIEByZXR1cm5zIHtDaGFyYWN0ZXJDbGFzc30gY2hhcmFjdGVyIGNsYXNzXG4gKi9cbkNoYXJhY3RlckRlZmluaXRpb24ucHJvdG90eXBlLmxvb2t1cCA9IGZ1bmN0aW9uIChjaCkge1xuXG4gICAgdmFyIGNsYXNzX2lkO1xuXG4gICAgdmFyIGNvZGUgPSBjaC5jaGFyQ29kZUF0KDApO1xuICAgIGlmIChTdXJyb2dhdGVBd2FyZVN0cmluZy5pc1N1cnJvZ2F0ZVBhaXIoY2gpKSB7XG4gICAgICAgIC8vIFN1cnJvZ2F0ZSBwYWlyIGNoYXJhY3RlciBjb2RlcyBjYW4gbm90IGJlIGRlZmluZWQgYnkgY2hhci5kZWYsIHNvIHNldCBERUZBVUxUIGNhdGVnb3J5XG4gICAgICAgIGNsYXNzX2lkID0gdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAubG9va3VwKERFRkFVTFRfQ0FURUdPUlkpO1xuICAgIH0gZWxzZSBpZiAoY29kZSA8IHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcC5sZW5ndGgpIHtcbiAgICAgICAgY2xhc3NfaWQgPSB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXBbY29kZV07ICAvLyBSZWFkIGFzIGludGVnZXIgdmFsdWVcbiAgICB9XG5cbiAgICBpZiAoY2xhc3NfaWQgPT0gbnVsbCkge1xuICAgICAgICBjbGFzc19pZCA9IHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmxvb2t1cChERUZBVUxUX0NBVEVHT1JZKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAuZ2V0Q2hhcmFjdGVyQ2xhc3MoY2xhc3NfaWQpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENoYXJhY3RlckRlZmluaXRpb247XG4iXSwiZmlsZSI6ImRpY3QvQ2hhcmFjdGVyRGVmaW5pdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9