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
 * String wrapper for UTF-16 surrogate pair (4 bytes)
 * @param {string} str String to wrap
 * @constructor
 */
function SurrogateAwareString(str) {
    this.str = str;
    this.index_mapping = [];

    for (var pos = 0; pos < str.length; pos++) {
        var ch = str.charAt(pos);
        this.index_mapping.push(pos);
        if (SurrogateAwareString.isSurrogatePair(ch)) {
            pos++;
        }
    }
    // Surrogate aware length
    this.length = this.index_mapping.length;
}


SurrogateAwareString.prototype.slice = function (index) {
    if (this.index_mapping.length <= index) {
        return "";
    }
    var surrogate_aware_index = this.index_mapping[index];
    return this.str.slice(surrogate_aware_index);
};


SurrogateAwareString.prototype.charAt = function (index) {
    if (this.str.length <= index) {
        return "";
    }
    var surrogate_aware_start_index = this.index_mapping[index];
    var surrogate_aware_end_index = this.index_mapping[index + 1];

    if (surrogate_aware_end_index == null) {
        return this.str.slice(surrogate_aware_start_index);
    }
    return this.str.slice(surrogate_aware_start_index, surrogate_aware_end_index);
};


SurrogateAwareString.prototype.charCodeAt = function (index) {
    if (this.index_mapping.length <= index) {
        return NaN;
    }
    var surrogate_aware_index = this.index_mapping[index];
    var upper = this.str.charCodeAt(surrogate_aware_index);
    var lower;
    if (upper >= 0xD800 && upper <= 0xDBFF && surrogate_aware_index < this.str.length) {
        lower = this.str.charCodeAt(surrogate_aware_index + 1);
        if (lower >= 0xDC00 && lower <= 0xDFFF) {
            return (upper - 0xD800) * 0x400 + lower - 0xDC00 + 0x10000;
        }
    }
    return upper;
};


SurrogateAwareString.prototype.toString = function () {
    return this.str;
};


SurrogateAwareString.isSurrogatePair = function (ch) {
    var utf16_code = ch.charCodeAt(0);
    if (utf16_code >= 0xD800 && utf16_code <= 0xDBFF) {
        // surrogate pair
        return true;
    } else {
        return false;
    }
};


module.exports = SurrogateAwareString;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC9TdXJyb2dhdGVBd2FyZVN0cmluZy5qcyIsIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzIjpbInV0aWwvU3Vycm9nYXRlQXdhcmVTdHJpbmcuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBTdHJpbmcgd3JhcHBlciBmb3IgVVRGLTE2IHN1cnJvZ2F0ZSBwYWlyICg0IGJ5dGVzKVxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciBTdHJpbmcgdG8gd3JhcFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFN1cnJvZ2F0ZUF3YXJlU3RyaW5nKHN0cikge1xuICAgIHRoaXMuc3RyID0gc3RyO1xuICAgIHRoaXMuaW5kZXhfbWFwcGluZyA9IFtdO1xuXG4gICAgZm9yICh2YXIgcG9zID0gMDsgcG9zIDwgc3RyLmxlbmd0aDsgcG9zKyspIHtcbiAgICAgICAgdmFyIGNoID0gc3RyLmNoYXJBdChwb3MpO1xuICAgICAgICB0aGlzLmluZGV4X21hcHBpbmcucHVzaChwb3MpO1xuICAgICAgICBpZiAoU3Vycm9nYXRlQXdhcmVTdHJpbmcuaXNTdXJyb2dhdGVQYWlyKGNoKSkge1xuICAgICAgICAgICAgcG9zKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gU3Vycm9nYXRlIGF3YXJlIGxlbmd0aFxuICAgIHRoaXMubGVuZ3RoID0gdGhpcy5pbmRleF9tYXBwaW5nLmxlbmd0aDtcbn1cblxuXG5TdXJyb2dhdGVBd2FyZVN0cmluZy5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICBpZiAodGhpcy5pbmRleF9tYXBwaW5nLmxlbmd0aCA8PSBpbmRleCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgdmFyIHN1cnJvZ2F0ZV9hd2FyZV9pbmRleCA9IHRoaXMuaW5kZXhfbWFwcGluZ1tpbmRleF07XG4gICAgcmV0dXJuIHRoaXMuc3RyLnNsaWNlKHN1cnJvZ2F0ZV9hd2FyZV9pbmRleCk7XG59O1xuXG5cblN1cnJvZ2F0ZUF3YXJlU3RyaW5nLnByb3RvdHlwZS5jaGFyQXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICBpZiAodGhpcy5zdHIubGVuZ3RoIDw9IGluZGV4KSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgICB2YXIgc3Vycm9nYXRlX2F3YXJlX3N0YXJ0X2luZGV4ID0gdGhpcy5pbmRleF9tYXBwaW5nW2luZGV4XTtcbiAgICB2YXIgc3Vycm9nYXRlX2F3YXJlX2VuZF9pbmRleCA9IHRoaXMuaW5kZXhfbWFwcGluZ1tpbmRleCArIDFdO1xuXG4gICAgaWYgKHN1cnJvZ2F0ZV9hd2FyZV9lbmRfaW5kZXggPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdHIuc2xpY2Uoc3Vycm9nYXRlX2F3YXJlX3N0YXJ0X2luZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuc3RyLnNsaWNlKHN1cnJvZ2F0ZV9hd2FyZV9zdGFydF9pbmRleCwgc3Vycm9nYXRlX2F3YXJlX2VuZF9pbmRleCk7XG59O1xuXG5cblN1cnJvZ2F0ZUF3YXJlU3RyaW5nLnByb3RvdHlwZS5jaGFyQ29kZUF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgaWYgKHRoaXMuaW5kZXhfbWFwcGluZy5sZW5ndGggPD0gaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG4gICAgdmFyIHN1cnJvZ2F0ZV9hd2FyZV9pbmRleCA9IHRoaXMuaW5kZXhfbWFwcGluZ1tpbmRleF07XG4gICAgdmFyIHVwcGVyID0gdGhpcy5zdHIuY2hhckNvZGVBdChzdXJyb2dhdGVfYXdhcmVfaW5kZXgpO1xuICAgIHZhciBsb3dlcjtcbiAgICBpZiAodXBwZXIgPj0gMHhEODAwICYmIHVwcGVyIDw9IDB4REJGRiAmJiBzdXJyb2dhdGVfYXdhcmVfaW5kZXggPCB0aGlzLnN0ci5sZW5ndGgpIHtcbiAgICAgICAgbG93ZXIgPSB0aGlzLnN0ci5jaGFyQ29kZUF0KHN1cnJvZ2F0ZV9hd2FyZV9pbmRleCArIDEpO1xuICAgICAgICBpZiAobG93ZXIgPj0gMHhEQzAwICYmIGxvd2VyIDw9IDB4REZGRikge1xuICAgICAgICAgICAgcmV0dXJuICh1cHBlciAtIDB4RDgwMCkgKiAweDQwMCArIGxvd2VyIC0gMHhEQzAwICsgMHgxMDAwMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXBwZXI7XG59O1xuXG5cblN1cnJvZ2F0ZUF3YXJlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5zdHI7XG59O1xuXG5cblN1cnJvZ2F0ZUF3YXJlU3RyaW5nLmlzU3Vycm9nYXRlUGFpciA9IGZ1bmN0aW9uIChjaCkge1xuICAgIHZhciB1dGYxNl9jb2RlID0gY2guY2hhckNvZGVBdCgwKTtcbiAgICBpZiAodXRmMTZfY29kZSA+PSAweEQ4MDAgJiYgdXRmMTZfY29kZSA8PSAweERCRkYpIHtcbiAgICAgICAgLy8gc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBTdXJyb2dhdGVBd2FyZVN0cmluZztcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==