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

/**
 * CharacterClass
 * @param {number} class_id
 * @param {string} class_name
 * @param {boolean} is_always_invoke
 * @param {boolean} is_grouping
 * @param {number} max_length
 * @constructor
 */
function CharacterClass(class_id, class_name, is_always_invoke, is_grouping, max_length) {
    this.class_id = class_id;
    this.class_name = class_name;
    this.is_always_invoke = is_always_invoke;
    this.is_grouping = is_grouping;
    this.max_length = max_length;
}


module.exports = CharacterClass;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdC9DaGFyYWN0ZXJDbGFzcy5qcyIsIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzIjpbImRpY3QvQ2hhcmFjdGVyQ2xhc3MuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBDaGFyYWN0ZXJDbGFzc1xuICogQHBhcmFtIHtudW1iZXJ9IGNsYXNzX2lkXG4gKiBAcGFyYW0ge3N0cmluZ30gY2xhc3NfbmFtZVxuICogQHBhcmFtIHtib29sZWFufSBpc19hbHdheXNfaW52b2tlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IGlzX2dyb3VwaW5nXG4gKiBAcGFyYW0ge251bWJlcn0gbWF4X2xlbmd0aFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENoYXJhY3RlckNsYXNzKGNsYXNzX2lkLCBjbGFzc19uYW1lLCBpc19hbHdheXNfaW52b2tlLCBpc19ncm91cGluZywgbWF4X2xlbmd0aCkge1xuICAgIHRoaXMuY2xhc3NfaWQgPSBjbGFzc19pZDtcbiAgICB0aGlzLmNsYXNzX25hbWUgPSBjbGFzc19uYW1lO1xuICAgIHRoaXMuaXNfYWx3YXlzX2ludm9rZSA9IGlzX2Fsd2F5c19pbnZva2U7XG4gICAgdGhpcy5pc19ncm91cGluZyA9IGlzX2dyb3VwaW5nO1xuICAgIHRoaXMubWF4X2xlbmd0aCA9IG1heF9sZW5ndGg7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFyYWN0ZXJDbGFzcztcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==