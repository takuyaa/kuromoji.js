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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0NoYXJhY3RlckNsYXNzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ2hhcmFjdGVyQ2xhc3NcbiAqIEBwYXJhbSB7bnVtYmVyfSBjbGFzc19pZFxuICogQHBhcmFtIHtzdHJpbmd9IGNsYXNzX25hbWVcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNfYWx3YXlzX2ludm9rZVxuICogQHBhcmFtIHtib29sZWFufSBpc19ncm91cGluZ1xuICogQHBhcmFtIHtudW1iZXJ9IG1heF9sZW5ndGhcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDaGFyYWN0ZXJDbGFzcyhjbGFzc19pZCwgY2xhc3NfbmFtZSwgaXNfYWx3YXlzX2ludm9rZSwgaXNfZ3JvdXBpbmcsIG1heF9sZW5ndGgpIHtcbiAgICB0aGlzLmNsYXNzX2lkID0gY2xhc3NfaWQ7XG4gICAgdGhpcy5jbGFzc19uYW1lID0gY2xhc3NfbmFtZTtcbiAgICB0aGlzLmlzX2Fsd2F5c19pbnZva2UgPSBpc19hbHdheXNfaW52b2tlO1xuICAgIHRoaXMuaXNfZ3JvdXBpbmcgPSBpc19ncm91cGluZztcbiAgICB0aGlzLm1heF9sZW5ndGggPSBtYXhfbGVuZ3RoO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhcmFjdGVyQ2xhc3M7XG4iXSwiZmlsZSI6ImRpY3QvQ2hhcmFjdGVyQ2xhc3MuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==