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

var InvokeDefinitionMap = require("./InvokeDefinitionMap");
var CharacterClass = require("./CharacterClass");
var SurrogateAwareString = require("../util/SurrogateAwareString");

var DEFAULT_CATEGORY = "DEFAULT";

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0NoYXJhY3RlckRlZmluaXRpb24uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIEludm9rZURlZmluaXRpb25NYXAgPSByZXF1aXJlKFwiLi9JbnZva2VEZWZpbml0aW9uTWFwXCIpO1xudmFyIENoYXJhY3RlckNsYXNzID0gcmVxdWlyZShcIi4vQ2hhcmFjdGVyQ2xhc3NcIik7XG52YXIgU3Vycm9nYXRlQXdhcmVTdHJpbmcgPSByZXF1aXJlKFwiLi4vdXRpbC9TdXJyb2dhdGVBd2FyZVN0cmluZ1wiKTtcblxudmFyIERFRkFVTFRfQ0FURUdPUlkgPSBcIkRFRkFVTFRcIjtcblxuLyoqXG4gKiBDaGFyYWN0ZXJEZWZpbml0aW9uIHJlcHJlc2VudHMgY2hhci5kZWYgZmlsZSBhbmRcbiAqIGRlZmluZXMgYmVoYXZpb3Igb2YgdW5rbm93biB3b3JkIHByb2Nlc3NpbmdcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDaGFyYWN0ZXJEZWZpbml0aW9uKCkge1xuICAgIHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcCA9IG5ldyBVaW50OEFycmF5KDY1NTM2KTsgIC8vIGZvciBhbGwgVUNTMiBjb2RlIHBvaW50c1xuICAgIHRoaXMuY29tcGF0aWJsZV9jYXRlZ29yeV9tYXAgPSBuZXcgVWludDMyQXJyYXkoNjU1MzYpOyAgLy8gZm9yIGFsbCBVQ1MyIGNvZGUgcG9pbnRzXG4gICAgdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAgPSBudWxsO1xufVxuXG4vKipcbiAqIExvYWQgQ2hhcmFjdGVyRGVmaW5pdGlvblxuICogQHBhcmFtIHtVaW50OEFycmF5fSBjYXRfbWFwX2J1ZmZlclxuICogQHBhcmFtIHtVaW50MzJBcnJheX0gY29tcGF0X2NhdF9tYXBfYnVmZmVyXG4gKiBAcGFyYW0ge0ludm9rZURlZmluaXRpb25NYXB9IGludm9rZV9kZWZfYnVmZmVyXG4gKiBAcmV0dXJucyB7Q2hhcmFjdGVyRGVmaW5pdGlvbn1cbiAqL1xuQ2hhcmFjdGVyRGVmaW5pdGlvbi5sb2FkID0gZnVuY3Rpb24gKGNhdF9tYXBfYnVmZmVyLCBjb21wYXRfY2F0X21hcF9idWZmZXIsIGludm9rZV9kZWZfYnVmZmVyKSB7XG4gICAgdmFyIGNoYXJfZGVmID0gbmV3IENoYXJhY3RlckRlZmluaXRpb24oKTtcbiAgICBjaGFyX2RlZi5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwID0gY2F0X21hcF9idWZmZXI7XG4gICAgY2hhcl9kZWYuY29tcGF0aWJsZV9jYXRlZ29yeV9tYXAgPSBjb21wYXRfY2F0X21hcF9idWZmZXI7XG4gICAgY2hhcl9kZWYuaW52b2tlX2RlZmluaXRpb25fbWFwID0gSW52b2tlRGVmaW5pdGlvbk1hcC5sb2FkKGludm9rZV9kZWZfYnVmZmVyKTtcbiAgICByZXR1cm4gY2hhcl9kZWY7XG59O1xuXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnBhcnNlQ2hhckNhdGVnb3J5ID0gZnVuY3Rpb24gKGNsYXNzX2lkLCBwYXJzZWRfY2F0ZWdvcnlfZGVmKSB7XG4gICAgdmFyIGNhdGVnb3J5ID0gcGFyc2VkX2NhdGVnb3J5X2RlZlsxXTtcbiAgICB2YXIgaW52b2tlID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X2RlZlsyXSk7XG4gICAgdmFyIGdyb3VwaW5nID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X2RlZlszXSk7XG4gICAgdmFyIG1heF9sZW5ndGggPSBwYXJzZUludChwYXJzZWRfY2F0ZWdvcnlfZGVmWzRdKTtcbiAgICBpZiAoIWlzRmluaXRlKGludm9rZSkgfHwgKGludm9rZSAhPT0gMCAmJiBpbnZva2UgIT09IDEpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIElOVk9LRSBpcyAwIG9yIDEgaW46XCIgKyBpbnZva2UpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKCFpc0Zpbml0ZShncm91cGluZykgfHwgKGdyb3VwaW5nICE9PSAwICYmIGdyb3VwaW5nICE9PSAxKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNoYXIuZGVmIHBhcnNlIGVycm9yLiBHUk9VUCBpcyAwIG9yIDEgaW46XCIgKyBncm91cGluZyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoIWlzRmluaXRlKG1heF9sZW5ndGgpIHx8IG1heF9sZW5ndGggPCAwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIExFTkdUSCBpcyAxIHRvIG46XCIgKyBtYXhfbGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBpc19pbnZva2UgPSAoaW52b2tlID09PSAxKTtcbiAgICB2YXIgaXNfZ3JvdXBpbmcgPSAoZ3JvdXBpbmcgPT09IDEpO1xuXG4gICAgcmV0dXJuIG5ldyBDaGFyYWN0ZXJDbGFzcyhjbGFzc19pZCwgY2F0ZWdvcnksIGlzX2ludm9rZSwgaXNfZ3JvdXBpbmcsIG1heF9sZW5ndGgpO1xufTtcblxuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZUNhdGVnb3J5TWFwcGluZyA9IGZ1bmN0aW9uIChwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZykge1xuICAgIHZhciBzdGFydCA9IHBhcnNlSW50KHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nWzFdKTtcbiAgICB2YXIgZGVmYXVsdF9jYXRlZ29yeSA9IHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nWzJdO1xuICAgIHZhciBjb21wYXRpYmxlX2NhdGVnb3J5ID0gKDMgPCBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZy5sZW5ndGgpID8gcGFyc2VkX2NhdGVnb3J5X21hcHBpbmcuc2xpY2UoMykgOiBbXTtcbiAgICBpZiAoIWlzRmluaXRlKHN0YXJ0KSB8fCBzdGFydCA8IDAgfHwgc3RhcnQgPiAweEZGRkYpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjaGFyLmRlZiBwYXJzZSBlcnJvci4gQ09ERSBpcyBpbnZhbGlkOlwiICsgc3RhcnQpO1xuICAgIH1cbiAgICByZXR1cm4geyBzdGFydDogc3RhcnQsIGRlZmF1bHQ6IGRlZmF1bHRfY2F0ZWdvcnksIGNvbXBhdGlibGU6IGNvbXBhdGlibGVfY2F0ZWdvcnl9O1xufTtcblxuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZVJhbmdlQ2F0ZWdvcnlNYXBwaW5nID0gZnVuY3Rpb24gKHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nKSB7XG4gICAgdmFyIHN0YXJ0ID0gcGFyc2VJbnQocGFyc2VkX2NhdGVnb3J5X21hcHBpbmdbMV0pO1xuICAgIHZhciBlbmQgPSBwYXJzZUludChwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZ1syXSk7XG4gICAgdmFyIGRlZmF1bHRfY2F0ZWdvcnkgPSBwYXJzZWRfY2F0ZWdvcnlfbWFwcGluZ1szXTtcbiAgICB2YXIgY29tcGF0aWJsZV9jYXRlZ29yeSA9ICg0IDwgcGFyc2VkX2NhdGVnb3J5X21hcHBpbmcubGVuZ3RoKSA/IHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nLnNsaWNlKDQpIDogW107XG4gICAgaWYgKCFpc0Zpbml0ZShzdGFydCkgfHwgc3RhcnQgPCAwIHx8IHN0YXJ0ID4gMHhGRkZGKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIENPREUgaXMgaW52YWxpZDpcIiArIHN0YXJ0KTtcbiAgICB9XG4gICAgaWYgKCFpc0Zpbml0ZShlbmQpIHx8IGVuZCA8IDAgfHwgZW5kID4gMHhGRkZGKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiY2hhci5kZWYgcGFyc2UgZXJyb3IuIENPREUgaXMgaW52YWxpZDpcIiArIGVuZCk7XG4gICAgfVxuICAgIHJldHVybiB7IHN0YXJ0OiBzdGFydCwgZW5kOiBlbmQsIGRlZmF1bHQ6IGRlZmF1bHRfY2F0ZWdvcnksIGNvbXBhdGlibGU6IGNvbXBhdGlibGVfY2F0ZWdvcnl9O1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXppbmcgbWV0aG9kXG4gKiBAcGFyYW0ge0FycmF5fSBjYXRlZ29yeV9tYXBwaW5nIEFycmF5IG9mIGNhdGVnb3J5IG1hcHBpbmdcbiAqL1xuQ2hhcmFjdGVyRGVmaW5pdGlvbi5wcm90b3R5cGUuaW5pdENhdGVnb3J5TWFwcGluZ3MgPSBmdW5jdGlvbiAoY2F0ZWdvcnlfbWFwcGluZykge1xuICAgIC8vIEluaXRpYWxpemUgbWFwIGJ5IERFRkFVTFQgY2xhc3NcbiAgICB2YXIgY29kZV9wb2ludDtcbiAgICBpZiAoY2F0ZWdvcnlfbWFwcGluZyAhPSBudWxsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2F0ZWdvcnlfbWFwcGluZy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG1hcHBpbmcgPSBjYXRlZ29yeV9tYXBwaW5nW2ldO1xuICAgICAgICAgICAgdmFyIGVuZCA9IG1hcHBpbmcuZW5kIHx8IG1hcHBpbmcuc3RhcnQ7XG4gICAgICAgICAgICBmb3IgKGNvZGVfcG9pbnQgPSBtYXBwaW5nLnN0YXJ0OyBjb2RlX3BvaW50IDw9IGVuZDsgY29kZV9wb2ludCsrKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IENhdGVnb3J5IGNsYXNzIElEXG4gICAgICAgICAgICAgICAgdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwW2NvZGVfcG9pbnRdID0gdGhpcy5pbnZva2VfZGVmaW5pdGlvbl9tYXAubG9va3VwKG1hcHBpbmcuZGVmYXVsdCk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1hcHBpbmcuY29tcGF0aWJsZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYml0c2V0ID0gdGhpcy5jb21wYXRpYmxlX2NhdGVnb3J5X21hcFtjb2RlX3BvaW50XTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBhdGlibGVfY2F0ZWdvcnkgPSBtYXBwaW5nLmNvbXBhdGlibGVbal07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wYXRpYmxlX2NhdGVnb3J5ID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbGFzc19pZCA9IHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmxvb2t1cChjb21wYXRpYmxlX2NhdGVnb3J5KTsgIC8vIERlZmF1bHQgQ2F0ZWdvcnlcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNsYXNzX2lkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbGFzc19pZF9iaXQgPSAxIDw8IGNsYXNzX2lkO1xuICAgICAgICAgICAgICAgICAgICBiaXRzZXQgPSBiaXRzZXQgfCBjbGFzc19pZF9iaXQ7ICAvLyBTZXQgYSBiaXQgb2YgY2xhc3MgSUQg5L6L44GI44Gw44CBY2xhc3NfaWTjgYwz44Gu44Go44GN44CBM+ODk+ODg+ODiOebruOBqzHjgpLnq4vjgabjgotcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb21wYXRpYmxlX2NhdGVnb3J5X21hcFtjb2RlX3BvaW50XSA9IGJpdHNldDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGRlZmF1bHRfaWQgPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5sb29rdXAoREVGQVVMVF9DQVRFR09SWSk7XG4gICAgaWYgKGRlZmF1bHRfaWQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoY29kZV9wb2ludCA9IDA7IGNvZGVfcG9pbnQgPCB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXAubGVuZ3RoOyBjb2RlX3BvaW50KyspIHtcbiAgICAgICAgLy8g5LuW44Gr5L2V44Gu44Kv44Op44K544KC5a6a576p44GV44KM44Gm44GE44Gq44GL44Gj44Gf44Go44GN44Gg44GRIERFRkFVTFRcbiAgICAgICAgaWYgKHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X21hcFtjb2RlX3BvaW50XSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gREVGQVVMVCBjbGFzcyBJRCDjgavlr77lv5zjgZnjgovjg5Pjg4Pjg4jjgaDjgZEx44KS56uL44Gm44KLXG4gICAgICAgICAgICB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXBbY29kZV9wb2ludF0gPSAxIDw8IGRlZmF1bHRfaWQ7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIExvb2t1cCBjb21wYXRpYmxlIGNhdGVnb3JpZXMgZm9yIGEgY2hhcmFjdGVyIChub3QgaW5jbHVkZWQgMXN0IGNhdGVnb3J5KVxuICogQHBhcmFtIHtzdHJpbmd9IGNoIFVDUzIgY2hhcmFjdGVyIChqdXN0IDFzdCBjaGFyYWN0ZXIgaXMgZWZmZWN0aXZlKVxuICogQHJldHVybnMge0FycmF5LjxDaGFyYWN0ZXJDbGFzcz59IGNoYXJhY3RlciBjbGFzc2VzXG4gKi9cbkNoYXJhY3RlckRlZmluaXRpb24ucHJvdG90eXBlLmxvb2t1cENvbXBhdGlibGVDYXRlZ29yeSA9IGZ1bmN0aW9uIChjaCkge1xuICAgIHZhciBjbGFzc2VzID0gW107XG5cbiAgICAvKlxuICAgICBpZiAoU3Vycm9nYXRlQXdhcmVTdHJpbmcuaXNTdXJyb2dhdGVQYWlyKGNoKSkge1xuICAgICAvLyBTdXJyb2dhdGUgcGFpciBjaGFyYWN0ZXIgY29kZXMgY2FuIG5vdCBiZSBkZWZpbmVkIGJ5IGNoYXIuZGVmXG4gICAgIHJldHVybiBjbGFzc2VzO1xuICAgICB9Ki9cbiAgICB2YXIgY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgdmFyIGludGVnZXI7XG4gICAgaWYgKGNvZGUgPCB0aGlzLmNvbXBhdGlibGVfY2F0ZWdvcnlfbWFwLmxlbmd0aCkge1xuICAgICAgICBpbnRlZ2VyID0gdGhpcy5jb21wYXRpYmxlX2NhdGVnb3J5X21hcFtjb2RlXTsgIC8vIEJpdHNldFxuICAgIH1cblxuICAgIGlmIChpbnRlZ2VyID09IG51bGwgfHwgaW50ZWdlciA9PT0gMCkge1xuICAgICAgICByZXR1cm4gY2xhc3NlcztcbiAgICB9XG5cbiAgICBmb3IgKHZhciBiaXQgPSAwOyBiaXQgPCAzMjsgYml0KyspIHsgIC8vIFRyZWF0IFwiYml0XCIgYXMgYSBjbGFzcyBJRFxuICAgICAgICBpZiAoKChpbnRlZ2VyIDw8ICgzMSAtIGJpdCkpID4+PiAzMSkgPT09IDEpIHtcbiAgICAgICAgICAgIHZhciBjaGFyYWN0ZXJfY2xhc3MgPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5nZXRDaGFyYWN0ZXJDbGFzcyhiaXQpO1xuICAgICAgICAgICAgaWYgKGNoYXJhY3Rlcl9jbGFzcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGFzc2VzLnB1c2goY2hhcmFjdGVyX2NsYXNzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xhc3Nlcztcbn07XG5cblxuLyoqXG4gKiBMb29rdXAgY2F0ZWdvcnkgZm9yIGEgY2hhcmFjdGVyXG4gKiBAcGFyYW0ge3N0cmluZ30gY2ggVUNTMiBjaGFyYWN0ZXIgKGp1c3QgMXN0IGNoYXJhY3RlciBpcyBlZmZlY3RpdmUpXG4gKiBAcmV0dXJucyB7Q2hhcmFjdGVyQ2xhc3N9IGNoYXJhY3RlciBjbGFzc1xuICovXG5DaGFyYWN0ZXJEZWZpbml0aW9uLnByb3RvdHlwZS5sb29rdXAgPSBmdW5jdGlvbiAoY2gpIHtcblxuICAgIHZhciBjbGFzc19pZDtcblxuICAgIHZhciBjb2RlID0gY2guY2hhckNvZGVBdCgwKTtcbiAgICBpZiAoU3Vycm9nYXRlQXdhcmVTdHJpbmcuaXNTdXJyb2dhdGVQYWlyKGNoKSkge1xuICAgICAgICAvLyBTdXJyb2dhdGUgcGFpciBjaGFyYWN0ZXIgY29kZXMgY2FuIG5vdCBiZSBkZWZpbmVkIGJ5IGNoYXIuZGVmLCBzbyBzZXQgREVGQVVMVCBjYXRlZ29yeVxuICAgICAgICBjbGFzc19pZCA9IHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmxvb2t1cChERUZBVUxUX0NBVEVHT1JZKTtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPCB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9tYXAubGVuZ3RoKSB7XG4gICAgICAgIGNsYXNzX2lkID0gdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfbWFwW2NvZGVdOyAgLy8gUmVhZCBhcyBpbnRlZ2VyIHZhbHVlXG4gICAgfVxuXG4gICAgaWYgKGNsYXNzX2lkID09IG51bGwpIHtcbiAgICAgICAgY2xhc3NfaWQgPSB0aGlzLmludm9rZV9kZWZpbml0aW9uX21hcC5sb29rdXAoREVGQVVMVF9DQVRFR09SWSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuaW52b2tlX2RlZmluaXRpb25fbWFwLmdldENoYXJhY3RlckNsYXNzKGNsYXNzX2lkKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhcmFjdGVyRGVmaW5pdGlvbjtcbiJdLCJmaWxlIjoiZGljdC9DaGFyYWN0ZXJEZWZpbml0aW9uLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
