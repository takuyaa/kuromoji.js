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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdC9DaGFyYWN0ZXJEZWZpbml0aW9uLmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsiZGljdC9DaGFyYWN0ZXJEZWZpbml0aW9uLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBJbnZva2VEZWZpbml0aW9uTWFwID0gcmVxdWlyZShcIi4vSW52b2tlRGVmaW5pdGlvbk1hcC5qc1wiKTtcbnZhciBDaGFyYWN0ZXJDbGFzcyA9IHJlcXVpcmUoXCIuL0NoYXJhY3RlckNsYXNzLmpzXCIpO1xudmFyIFN1cnJvZ2F0ZUF3YXJlU3RyaW5nID0gcmVxdWlyZShcIi4uL3V0aWwvU3Vycm9nYXRlQXdhcmVTdHJpbmcuanNcIik7XG5cbnZhciBERUZBVUxUX0NBVEVHT1JZID0gXCJERUZBVUxUXCI7XG52YXIgUkVUVVJOX1BBVFRFUk4gPSAvXFxyfFxcbnxcXHJcXG4vO1xudmFyIENBVEVHT1JZX0RFRl9QQVRURVJOID0gL14oXFx3KylcXHMrKFxcZClcXHMrKFxcZClcXHMrKFxcZCkvO1xudmFyIENBVEVHT1JZX01BUFBJTkdfUEFUVEVSTiA9IC9eKDB4WzAtOUEtRl17NH0pKD86XFxzKyhbXiNcXHNdKykpKD86XFxzKyhbXiNcXHNdKykpKi87XG52YXIgUkFOR0VfQ0FURUdPUllfTUFQUElOR19QQVRURVJOID0gL14oMHhbMC05QS1GXXs0fSlcXC5cXC4oMHhbMC05QS1GXXs0fSkoPzpcXHMrKFteI1xcc10rKSkoPzpcXHMrKFteI1xcc10rKSkqLztcblxuXG4vKipcbiAqIENoYXJhY3RlckRlZmluaXRpb24gcmVwcmVzZW50cyBjaGFyLmRlZiBmaWxlIGFuZFxuICogZGVmaW5lcyBiZWhhdmlvciBvZiB1bmtub3duIHdvcmQgcHJvY2Vzc2luZ1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENoYXJhY3RlckRlZmluaXRpb24oKSB7XG4gICAgdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwID0gbmV3IFVpbnQ4QXJyYXkoNjU1MzYpOyAgLy8gZm9yIGFsbCBVQ1MyIGNvZGUgcG9pbnRzXG4gICAgdGhpcy5jb21wYXRpYmxlX2NhdGVnb3J5X21hcCA9IG5ldyBVaW50MzJBcnJheSg2NTUzNik7ICAvLyBmb3IgYWxsIFVDUzIgY29kZSBwb2ludHNcbiAgICB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcCA9IG51bGw7XG5cbn1cblxuLyoqXG4gKiBMb2FkIENoYXJhY3RlckRlZmluaXRpb25cbiAqIEBwYXJhbSB7VWludDhBcnJheX0gY2F0X21hcF9idWZmZXJcbiAqIEBwYXJhbSB7VWludDMyQXJyYXl9IGNvbXBhdF9jYXRfbWFwX2J1ZmZlclxuICogQHBhcmFtIHtJbnZva2VEZWZpbml0aW9uTWFwfSBpbnZva2VfZGVmX2J1ZmZlclxuICogQHJldHVybnMge0NoYXJhY3RlckRlZmluaXRpb259XG4gKi9cbkNoYXJhY3RlckRlZmluaXRpb24ubG9hZCA9IGZ1bmN0aW9uIChjYXRfbWFwX2J1ZmZlciwgY29tcGF0X2NhdF9tYXBfYnVmZmVyLCBpbnZva2VfZGVmX2J1ZmZlcikge1xuICAgIHZhciBjaGFyX2RlZiA9IG5ldyBDaGFyYWN0ZXJEZWZpbml0aW9uKCk7XG4gICAgY2hhcl9kZWYuY2hhcmFjdGVyX2NhdGVnb3J5X21hcCA9IGNhdF9tYXBfYnVmZmVyO1xuICAgIGNoYXJfZGVmLmNvbXBhdGlibGVfY2F0ZWdvcnlfbWFwID0gY29tcGF0X2NhdF9tYXBfYnVmZmVyO1xuICAgIGNoYXJfZGVmLmludm9rZV9kZWZpbml0aW9uX21hcCA9IEludm9rZURlZmluaXRpb25NYXAubG9hZChpbnZva2VfZGVmX2J1ZmZlcik7XG4gICAgcmV0dXJuIGNoYXJfZGVmO1xufTtcblxuLyoqXG4gKiBGYWN0b3J5IG1ldGhvZCBvZiBDaGFyYWN0ZXJEZWZpbml0aW9uXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dCBDb250ZW50cyBvZiBjaGFyLmRlZlxuICovXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnJlYWRDaGFyYWN0ZXJEZWZpbml0aW9uID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICB2YXIgbGluZXMgPSB0ZXh0LnNwbGl0KFJFVFVSTl9QQVRURVJOKTtcbiAgICB2YXIgbGluZTtcbiAgICB2YXIgY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24gPSBbXTtcbiAgICB2YXIgY2F0ZWdvcnlfbWFwcGluZyA9IFtdO1xuXG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpbmUgPSBsaW5lc1tpXTtcbiAgICAgICAgaWYgKGxpbmUgPT0gbnVsbCkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHBhcnNlZF9jYXRlZ29yeV9kZWYgPSBDQVRFR09SWV9ERUZfUEFUVEVSTi5leGVjKGxpbmUpO1xuICAgICAgICBpZiAocGFyc2VkX2NhdGVnb3J5X2RlZiAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgY2xhc3NfaWQgPSBjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbi5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgY2hhcl9jbGFzcyA9IENoYXJhY3RlckRlZmluaXRpb24ucGFyc2VDaGFyQ2F0ZWdvcnkoY2xhc3NfaWQsIHBhcnNlZF9jYXRlZ29yeV9kZWYpO1xuICAgICAgICAgICAgaWYgKGNoYXJfY2xhc3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24ucHVzaChjaGFyX2NsYXNzKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZyA9IENBVEVHT1JZX01BUFBJTkdfUEFUVEVSTi5leGVjKGxpbmUpO1xuICAgICAgICBpZiAocGFyc2VkX2NhdGVnb3J5X21hcHBpbmcgIT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIG1hcHBpbmcgPSBDaGFyYWN0ZXJEZWZpbml0aW9uLnBhcnNlQ2F0ZWdvcnlNYXBwaW5nKHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nKTtcbiAgICAgICAgICAgIGNhdGVnb3J5X21hcHBpbmcucHVzaChtYXBwaW5nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGFyc2VkX3JhbmdlX2NhdGVnb3J5X21hcHBpbmcgPSBSQU5HRV9DQVRFR09SWV9NQVBQSU5HX1BBVFRFUk4uZXhlYyhsaW5lKTtcbiAgICAgICAgaWYgKHBhcnNlZF9yYW5nZV9jYXRlZ29yeV9tYXBwaW5nICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciByYW5nZV9tYXBwaW5nID0gQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZVJhbmdlQ2F0ZWdvcnlNYXBwaW5nKHBhcnNlZF9yYW5nZV9jYXRlZ29yeV9tYXBwaW5nKTtcbiAgICAgICAgICAgIGNhdGVnb3J5X21hcHBpbmcucHVzaChyYW5nZV9tYXBwaW5nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRPRE8gSWYgREVGQVVMVCBjYXRlZ29yeSBkb2VzIG5vdCBleGlzdCwgdGhyb3cgZXJyb3JcblxuICAgIHZhciBjaGFyX2RlZiA9IG5ldyBDaGFyYWN0ZXJEZWZpbml0aW9uKCk7XG4gICAgY2hhcl9kZWYuaW52b2tlX2RlZmluaXRpb25fbWFwID0gbmV3IEludm9rZURlZmluaXRpb25NYXAoKTtcbiAgICBjaGFyX2RlZi5pbnZva2VfZGVmaW5pdGlvbl9tYXAuaW5pdChjaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbik7XG4gICAgY2hhcl9kZWYuaW5pdENhdGVnb3J5TWFwcGluZ3MoY2F0ZWdvcnlfbWFwcGluZyk7XG5cbiAgICByZXR1cm4gY2hhcl9kZWY7XG59O1xuXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnBhcnNlQ2hhckNhdGVnb3J5ID0gZnVuY3Rpb24gKGNsYXNzX2lkLCBwYXJzZWRfY2F0ZWdvcnlfZGVmKSB7XG4gICAgdmFyIGNhdGVnb3J5ID0gcGFyc2VkX2NhdGVnb3J5X2RlZlsxXTtcbiAgICB2YXIgaW52b2tlID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X2RlZlsyXSk7XG4gICAgdmFyIGdyb3VwaW5nID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X2RlZlszXSk7XG4gICAgdmFyIG1heF9sZW5ndGggPSBwYXJzZUludChwYXJzZWRfY2F0ZWdvcnlfZGVmWzRdKTtcbiAgICBpZiAoIWlzRmluaXRlKGludm9rZSkgfHwgKGludm9rZSAhPT0gMCAmJiBpbnZva2UgIT09IDEpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIElOVk9LRSBpcyAwIG9yIDEgaW46XCIgKyBpbnZva2UpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKCFpc0Zpbml0ZShncm91cGluZykgfHwgKGdyb3VwaW5nICE9PSAwICYmIGdyb3VwaW5nICE9PSAxKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNoYXIuZGVmIHBhcnNlIGVycm9yLiBHUk9VUCBpcyAwIG9yIDEgaW46XCIgKyBncm91cGluZyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoIWlzRmluaXRlKG1heF9sZW5ndGgpIHx8IG1heF9sZW5ndGggPCAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIExFTkdUSCBpcyAxIHRvIG46XCIgKyBtYXhfbGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBpc19pbnZva2UgPSAoaW52b2tlID09PSAxKTtcbiAgICB2YXIgaXNfZ3JvdXBpbmcgPSAoZ3JvdXBpbmcgPT09IDEpO1xuXG4gICAgcmV0dXJuIG5ldyBDaGFyYWN0ZXJDbGFzcyhjbGFzc19pZCwgY2F0ZWdvcnksIGlzX2ludm9rZSwgaXNfZ3JvdXBpbmcsIG1heF9sZW5ndGgpO1xufTtcblxuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZUNhdGVnb3J5TWFwcGluZyA9IGZ1bmN0aW9uIChwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZykge1xuICAgIHZhciBzdGFydCA9IHBhcnNlSW50KHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nWzFdKTtcbiAgICB2YXIgZGVmYXVsdF9jYXRlZ29yeSA9IHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nWzJdO1xuICAgIHZhciBjb21wYXRpYmxlX2NhdGVnb3J5ID0gKDMgPCBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZy5sZW5ndGgpID8gcGFyc2VkX2NhdGVnb3J5X21hcHBpbmcuc2xpY2UoMykgOiBbXTtcbiAgICBpZiAoIWlzRmluaXRlKHN0YXJ0KSB8fCBzdGFydCA8IDAgfHwgc3RhcnQgPiAweEZGRkYpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjaGFyLmRlZiBwYXJzZSBlcnJvci4gQ09ERSBpcyBpbnZhbGlkOlwiICsgc3RhcnQpO1xuICAgIH1cbiAgICByZXR1cm4geyBzdGFydDogc3RhcnQsIGRlZmF1bHQ6IGRlZmF1bHRfY2F0ZWdvcnksIGNvbXBhdGlibGU6IGNvbXBhdGlibGVfY2F0ZWdvcnl9O1xufTtcblxuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZVJhbmdlQ2F0ZWdvcnlNYXBwaW5nID0gZnVuY3Rpb24gKHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nKSB7XG4gICAgdmFyIHN0YXJ0ID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X21hcHBpbmdbMV0pO1xuICAgIHZhciBlbmQgPSBwYXJzZUludChwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZ1syXSk7XG4gICAgdmFyIGRlZmF1bHRfY2F0ZWdvcnkgPSBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZ1szXTtcbiAgICB2YXIgY29tcGF0aWJsZV9jYXRlZ29yeSA9ICg0IDwgcGFyc2VkX2NhdGVnb3J5X21hcHBpbmcubGVuZ3RoKSA/IHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nLnNsaWNlKDQpIDogW107XG4gICAgaWYgKCFpc0Zpbml0ZShzdGFydCkgfHwgc3RhcnQgPCAwIHx8IHN0YXJ0ID4gMHhGRkZGKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIENPREUgaXMgaW52YWxpZDpcIiArIHN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKCFpc0Zpbml0ZShlbmQpIHx8IGVuZCA8IDAgfHwgZW5kID4gMHhGRkZGKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIENPREUgaXMgaW52YWxpZDpcIiArIGVuZCk7XG4gICAgfVxuICAgIHJldHVybiB7IHN0YXJ0OiBzdGFydCwgZW5kOiBlbmQsIGRlZmF1bHQ6IGRlZmF1bHRfY2F0ZWdvcnksIGNvbXBhdGlibGU6IGNvbXBhdGlibGVfY2F0ZWdvcnl9O1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXppbmcgbWV0aG9kXG4gKiBAcGFyYW0ge0FycmF5fSBjYXRlZ29yeV9tYXBwaW5nIEFycmF5IG9mIGNhdGVnb3J5IG1hcHBpbmdcbiAqL1xuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wcm90b3R5cGUuaW5pdENhdGVnb3J5TWFwcGluZ3MgPSBmdW5jdGlvbiAoY2F0ZWdvcnlfbWFwcGluZykge1xuICAgIC8vIEluaXRpYWxpemUgbWFwIGJ5IERFRkFVTFQgY2xhc3NcbiAgICB2YXIgY29kZV9wb2ludDtcbiAgICBpZiAoY2F0ZWdvcnlfbWFwcGluZyAhPSBudWxsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2F0ZWdvcnlfbWFwcGluZy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG1hcHBpbmcgPSBjYXRlZ29yeV9tYXBwaW5nW2ldO1xuICAgICAgICAgICAgdmFyIGVuZCA9IG1hcHBpbmcuZW5kIHx8IG1hcHBpbmcuc3RhcnQ7XG4gICAgICAgICAgICBmb3IgKGNvZGVfcG9pbnQgPSBtYXBwaW5nLnN0YXJ0OyBjb2RlX3BvaW50IDw9IGVuZDsgY29kZV9wb2ludCsrKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IENhdGVnb3J5IGNsYXNzIElEXG4gICAgICAgICAgICAgICAgdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwW2NvZGVfcG9pbnRdID0gdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAubG9va3VwKG1hcHBpbmcuZGVmYXVsdCk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1hcHBpbmcuY29tcGF0aWJsZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYml0c2V0ID0gdGhpcy5jb21wYXRpYmxlX2NhdGVnb3J5X21hcFtjb2RlX3BvaW50XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBhdGlibGVfY2F0ZWdvcnkgPSBtYXBwaW5nLmNvbXBhdGlibGVbal07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wYXRpYmxlX2NhdGVnb3J5ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbGFzc19pZCA9IHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmxvb2t1cChjb21wYXRpYmxlX2NhdGVnb3J5KTsgIC8vIERlZmF1bHQgQ2F0ZWdvcnlcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsYXNzX2lkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbGFzc19pZF9iaXQgPSAxIDw8IGNsYXNzX2lkO1xuICAgICAgICAgICAgICAgICAgICBiaXRzZXQgPSBiaXRzZXQgfCBjbGFzc19pZF9iaXQ7ICAvLyBTZXQgYSBiaXQgb2YgY2xhc3MgSUQg5L6L44GI44Gw44CBY2xhc3NfaWTjgYwz44Gu44Go44GN44CBM+ODk+ODg+ODiOebruOBqzHjgpLnq4vjgabjgotcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wYXRpYmxlX2NhdGVnb3J5X21hcFtjb2RlX3BvaW50XSA9IGJpdHNldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGRlZmF1bHRfaWQgPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5sb29rdXAoREVGQVVMVF9DQVRFR09SWSk7XG4gICAgaWYgKGRlZmF1bHRfaWQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoY29kZV9wb2ludCA9IDA7IGNvZGVfcG9pbnQgPCB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXAubGVuZ3RoOyBjb2RlX3BvaW50KyspIHtcbiAgICAgICAgLy8g5LuW44Gr5L2V44Gu44Kv44Op44K544KC5a6a576p44GV44KM44Gm44GE44Gq44GL44Gj44Gf44Go44GN44Gg44GRIERFRkFVTFRcbiAgICAgICAgaWYgKHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcFtjb2RlX3BvaW50XSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gREVGQVVMVCBjbGFzcyBJRCDjgavlr77lv5zjgZnjgovjg5Pjg4Pjg4jjgaDjgZEx44KS56uL44Gm44KLXG4gICAgICAgICAgICB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXBbY29kZV9wb2ludF0gPSAxIDw8IGRlZmF1bHRfaWQ7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIExvb2t1cCBjb21wYXRpYmxlIGNhdGVnb3JpZXMgZm9yIGEgY2hhcmFjdGVyIChub3QgaW5jbHVkZWQgMXN0IGNhdGVnb3J5KVxuICogQHBhcmFtIHtzdHJpbmd9IGNoIFVDUzIgY2hhcmFjdGVyIChqdXN0IDFzdCBjaGFyYWN0ZXIgaXMgZWZmZWN0aXZlKVxuICogQHJldHVybnMge0FycmF5LjxDaGFyYWN0ZXJDbGFzcz59IGNoYXJhY3RlciBjbGFzc2VzXG4gKi9cbkNoYXJhY3RlckRlZmluaXRpb24ucHJvdG90eXBlLmxvb2t1cENvbXBhdGlibGVDYXRlZ29yeSA9IGZ1bmN0aW9uIChjaCkge1xuICAgIHZhciBjbGFzc2VzID0gW107XG5cbiAgICAvKlxuICAgICBpZiAoU3Vycm9nYXRlQXdhcmVTdHJpbmcuaXNTdXJyb2dhdGVQYWlyKGNoKSkge1xuICAgICAvLyBTdXJyb2dhdGUgcGFpciBjaGFyYWN0ZXIgY29kZXMgY2FuIG5vdCBiZSBkZWZpbmVkIGJ5IGNoYXIuZGVmXG4gICAgIHJldHVybiBjbGFzc2VzO1xuICAgICB9Ki9cbiAgICB2YXIgY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgdmFyIGludGVnZXI7XG4gICAgaWYgKGNvZGUgPCB0aGlzLmNvbXBhdGlibGVfY2F0ZWdvcnlfbWFwLmxlbmd0aCkge1xuICAgICAgICBpbnRlZ2VyID0gdGhpcy5jb21wYXRpYmxlX2NhdGVnb3J5X21hcFtjb2RlXTsgIC8vIEJpdHNldFxuICAgIH1cblxuICAgIGlmIChpbnRlZ2VyID09IG51bGwgfHwgaW50ZWdlciA9PT0gMCkge1xuICAgICAgICByZXR1cm4gY2xhc3NlcztcbiAgICB9XG5cbiAgICBmb3IgKHZhciBiaXQgPSAwOyBiaXQgPCAzMjsgYml0KyspIHsgIC8vIFRyZWF0IFwiYml0XCIgYXMgYSBjbGFzcyBJRFxuICAgICAgICBpZiAoKChpbnRlZ2VyIDw8ICgzMSAtIGJpdCkpID4+PiAzMSkgPT09IDEpIHtcbiAgICAgICAgICAgIHZhciBjaGFyYWN0ZXJfY2xhc3MgPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5nZXRDaGFyYWN0ZXJDbGFzcyhiaXQpO1xuICAgICAgICAgICAgaWYgKGNoYXJhY3Rlcl9jbGFzcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGFzc2VzLnB1c2goY2hhcmFjdGVyX2NsYXNzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xhc3Nlcztcbn07XG5cblxuLyoqXG4gKiBMb29rdXAgY2F0ZWdvcnkgZm9yIGEgY2hhcmFjdGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gY2ggVUNTMiBjaGFyYWN0ZXIgKGp1c3QgMXN0IGNoYXJhY3RlciBpcyBlZmZlY3RpdmUpXG4gKiBAcmV0dXJucyB7Q2hhcmFjdGVyQ2xhc3N9IGNoYXJhY3RlciBjbGFzc1xuICovXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnByb3RvdHlwZS5sb29rdXAgPSBmdW5jdGlvbiAoY2gpIHtcblxuICAgIHZhciBjbGFzc19pZDtcblxuICAgIHZhciBjb2RlID0gY2guY2hhckNvZGVBdCgwKTtcbiAgICBpZiAoU3Vycm9nYXRlQXdhcmVTdHJpbmcuaXNTdXJyb2dhdGVQYWlyKGNoKSkge1xuICAgICAgICAvLyBTdXJyb2dhdGUgcGFpciBjaGFyYWN0ZXIgY29kZXMgY2FuIG5vdCBiZSBkZWZpbmVkIGJ5IGNoYXIuZGVmLCBzbyBzZXQgREVGQVVMVCBjYXRlZ29yeVxuICAgICAgICBjbGFzc19pZCA9IHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmxvb2t1cChERUZBVUxUX0NBVEVHT1JZKTtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPCB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXAubGVuZ3RoKSB7XG4gICAgICAgIGNsYXNzX2lkID0gdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwW2NvZGVdOyAgLy8gUmVhZCBhcyBpbnRlZ2VyIHZhbHVlXG4gICAgfVxuXG4gICAgaWYgKGNsYXNzX2lkID09IG51bGwpIHtcbiAgICAgICAgY2xhc3NfaWQgPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5sb29rdXAoREVGQVVMVF9DQVRFR09SWSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmdldENoYXJhY3RlckNsYXNzKGNsYXNzX2lkKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFyYWN0ZXJEZWZpbml0aW9uO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9