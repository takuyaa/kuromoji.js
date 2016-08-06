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

var CharacterDefinition = require("../CharacterDefinition");
var InvokeDefinitionMap = require("../InvokeDefinitionMap");

var CATEGORY_DEF_PATTERN = /^(\w+)\s+(\d)\s+(\d)\s+(\d)/;
var CATEGORY_MAPPING_PATTERN = /^(0x[0-9A-F]{4})(?:\s+([^#\s]+))(?:\s+([^#\s]+))*/;
var RANGE_CATEGORY_MAPPING_PATTERN = /^(0x[0-9A-F]{4})\.\.(0x[0-9A-F]{4})(?:\s+([^#\s]+))(?:\s+([^#\s]+))*/;

/**
 * CharacterDefinitionBuilder
 * @constructor
 */
function CharacterDefinitionBuilder() {
    this.char_def = new CharacterDefinition();
    this.char_def.invoke_definition_map = new InvokeDefinitionMap();
    this.character_category_definition = [];
    this.category_mapping = [];
}

CharacterDefinitionBuilder.prototype.putLine = function (line) {
    var parsed_category_def = CATEGORY_DEF_PATTERN.exec(line);
    if (parsed_category_def != null) {
        var class_id = this.character_category_definition.length;
        var char_class = CharacterDefinition.parseCharCategory(class_id, parsed_category_def);
        if (char_class == null) {
            return;
        }
        this.character_category_definition.push(char_class);
        return;
    }
    var parsed_category_mapping = CATEGORY_MAPPING_PATTERN.exec(line);
    if (parsed_category_mapping != null) {
        var mapping = CharacterDefinition.parseCategoryMapping(parsed_category_mapping);
        this.category_mapping.push(mapping);
    }
    var parsed_range_category_mapping = RANGE_CATEGORY_MAPPING_PATTERN.exec(line);
    if (parsed_range_category_mapping != null) {
        var range_mapping = CharacterDefinition.parseRangeCategoryMapping(parsed_range_category_mapping);
        this.category_mapping.push(range_mapping);
    }
};

CharacterDefinitionBuilder.prototype.build = function () {
    // TODO If DEFAULT category does not exist, throw error
    this.char_def.invoke_definition_map.init(this.character_category_definition);
    this.char_def.initCategoryMappings(this.category_mapping);
    return this.char_def;
};

module.exports = CharacterDefinitionBuilder;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L2J1aWxkZXIvQ2hhcmFjdGVyRGVmaW5pdGlvbkJ1aWxkZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIENoYXJhY3RlckRlZmluaXRpb24gPSByZXF1aXJlKFwiLi4vQ2hhcmFjdGVyRGVmaW5pdGlvblwiKTtcbnZhciBJbnZva2VEZWZpbml0aW9uTWFwID0gcmVxdWlyZShcIi4uL0ludm9rZURlZmluaXRpb25NYXBcIik7XG5cbnZhciBDQVRFR09SWV9ERUZfUEFUVEVSTiA9IC9eKFxcdyspXFxzKyhcXGQpXFxzKyhcXGQpXFxzKyhcXGQpLztcbnZhciBDQVRFR09SWV9NQVBQSU5HX1BBVFRFUk4gPSAvXigweFswLTlBLUZdezR9KSg/OlxccysoW14jXFxzXSspKSg/OlxccysoW14jXFxzXSspKSovO1xudmFyIFJBTkdFX0NBVEVHT1JZX01BUFBJTkdfUEFUVEVSTiA9IC9eKDB4WzAtOUEtRl17NH0pXFwuXFwuKDB4WzAtOUEtRl17NH0pKD86XFxzKyhbXiNcXHNdKykpKD86XFxzKyhbXiNcXHNdKykpKi87XG5cbi8qKlxuICogQ2hhcmFjdGVyRGVmaW5pdGlvbkJ1aWxkZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDaGFyYWN0ZXJEZWZpbml0aW9uQnVpbGRlcigpIHtcbiAgICB0aGlzLmNoYXJfZGVmID0gbmV3IENoYXJhY3RlckRlZmluaXRpb24oKTtcbiAgICB0aGlzLmNoYXJfZGVmLmludm9rZV9kZWZpbml0aW9uX21hcCA9IG5ldyBJbnZva2VEZWZpbml0aW9uTWFwKCk7XG4gICAgdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbiA9IFtdO1xuICAgIHRoaXMuY2F0ZWdvcnlfbWFwcGluZyA9IFtdO1xufVxuXG5DaGFyYWN0ZXJEZWZpbml0aW9uQnVpbGRlci5wcm90b3R5cGUucHV0TGluZSA9IGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgdmFyIHBhcnNlZF9jYXRlZ29yeV9kZWYgPSBDQVRFR09SWV9ERUZfUEFUVEVSTi5leGVjKGxpbmUpO1xuICAgIGlmIChwYXJzZWRfY2F0ZWdvcnlfZGVmICE9IG51bGwpIHtcbiAgICAgICAgdmFyIGNsYXNzX2lkID0gdGhpcy5jaGFyYWN0ZXJfY2F0ZWdvcnlfZGVmaW5pdGlvbi5sZW5ndGg7XG4gICAgICAgIHZhciBjaGFyX2NsYXNzID0gQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZUNoYXJDYXRlZ29yeShjbGFzc19pZCwgcGFyc2VkX2NhdGVnb3J5X2RlZik7XG4gICAgICAgIGlmIChjaGFyX2NsYXNzID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNoYXJhY3Rlcl9jYXRlZ29yeV9kZWZpbml0aW9uLnB1c2goY2hhcl9jbGFzcyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nID0gQ0FURUdPUllfTUFQUElOR19QQVRURVJOLmV4ZWMobGluZSk7XG4gICAgaWYgKHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nICE9IG51bGwpIHtcbiAgICAgICAgdmFyIG1hcHBpbmcgPSBDaGFyYWN0ZXJEZWZpbml0aW9uLnBhcnNlQ2F0ZWdvcnlNYXBwaW5nKHBhcnNlZF9jYXRlZ29yeV9tYXBwaW5nKTtcbiAgICAgICAgdGhpcy5jYXRlZ29yeV9tYXBwaW5nLnB1c2gobWFwcGluZyk7XG4gICAgfVxuICAgIHZhciBwYXJzZWRfcmFuZ2VfY2F0ZWdvcnlfbWFwcGluZyA9IFJBTkdFX0NBVEVHT1JZX01BUFBJTkdfUEFUVEVSTi5leGVjKGxpbmUpO1xuICAgIGlmIChwYXJzZWRfcmFuZ2VfY2F0ZWdvcnlfbWFwcGluZyAhPSBudWxsKSB7XG4gICAgICAgIHZhciByYW5nZV9tYXBwaW5nID0gQ2hhcmFjdGVyRGVmaW5pdGlvbi5wYXJzZVJhbmdlQ2F0ZWdvcnlNYXBwaW5nKHBhcnNlZF9yYW5nZV9jYXRlZ29yeV9tYXBwaW5nKTtcbiAgICAgICAgdGhpcy5jYXRlZ29yeV9tYXBwaW5nLnB1c2gocmFuZ2VfbWFwcGluZyk7XG4gICAgfVxufTtcblxuQ2hhcmFjdGVyRGVmaW5pdGlvbkJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIFRPRE8gSWYgREVGQVVMVCBjYXRlZ29yeSBkb2VzIG5vdCBleGlzdCwgdGhyb3cgZXJyb3JcbiAgICB0aGlzLmNoYXJfZGVmLmludm9rZV9kZWZpbml0aW9uX21hcC5pbml0KHRoaXMuY2hhcmFjdGVyX2NhdGVnb3J5X2RlZmluaXRpb24pO1xuICAgIHRoaXMuY2hhcl9kZWYuaW5pdENhdGVnb3J5TWFwcGluZ3ModGhpcy5jYXRlZ29yeV9tYXBwaW5nKTtcbiAgICByZXR1cm4gdGhpcy5jaGFyX2RlZjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhcmFjdGVyRGVmaW5pdGlvbkJ1aWxkZXI7XG4iXSwiZmlsZSI6ImRpY3QvYnVpbGRlci9DaGFyYWN0ZXJEZWZpbml0aW9uQnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
