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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1dGlsL1N1cnJvZ2F0ZUF3YXJlU3RyaW5nLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogU3RyaW5nIHdyYXBwZXIgZm9yIFVURi0xNiBzdXJyb2dhdGUgcGFpciAoNCBieXRlcylcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgU3RyaW5nIHRvIHdyYXBcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBTdXJyb2dhdGVBd2FyZVN0cmluZyhzdHIpIHtcbiAgICB0aGlzLnN0ciA9IHN0cjtcbiAgICB0aGlzLmluZGV4X21hcHBpbmcgPSBbXTtcblxuICAgIGZvciAodmFyIHBvcyA9IDA7IHBvcyA8IHN0ci5sZW5ndGg7IHBvcysrKSB7XG4gICAgICAgIHZhciBjaCA9IHN0ci5jaGFyQXQocG9zKTtcbiAgICAgICAgdGhpcy5pbmRleF9tYXBwaW5nLnB1c2gocG9zKTtcbiAgICAgICAgaWYgKFN1cnJvZ2F0ZUF3YXJlU3RyaW5nLmlzU3Vycm9nYXRlUGFpcihjaCkpIHtcbiAgICAgICAgICAgIHBvcysrO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFN1cnJvZ2F0ZSBhd2FyZSBsZW5ndGhcbiAgICB0aGlzLmxlbmd0aCA9IHRoaXMuaW5kZXhfbWFwcGluZy5sZW5ndGg7XG59XG5cblxuU3Vycm9nYXRlQXdhcmVTdHJpbmcucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgaWYgKHRoaXMuaW5kZXhfbWFwcGluZy5sZW5ndGggPD0gaW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxuICAgIHZhciBzdXJyb2dhdGVfYXdhcmVfaW5kZXggPSB0aGlzLmluZGV4X21hcHBpbmdbaW5kZXhdO1xuICAgIHJldHVybiB0aGlzLnN0ci5zbGljZShzdXJyb2dhdGVfYXdhcmVfaW5kZXgpO1xufTtcblxuXG5TdXJyb2dhdGVBd2FyZVN0cmluZy5wcm90b3R5cGUuY2hhckF0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgaWYgKHRoaXMuc3RyLmxlbmd0aCA8PSBpbmRleCkge1xuICAgICAgICByZXR1cm4gXCJcIjtcbiAgICB9XG4gICAgdmFyIHN1cnJvZ2F0ZV9hd2FyZV9zdGFydF9pbmRleCA9IHRoaXMuaW5kZXhfbWFwcGluZ1tpbmRleF07XG4gICAgdmFyIHN1cnJvZ2F0ZV9hd2FyZV9lbmRfaW5kZXggPSB0aGlzLmluZGV4X21hcHBpbmdbaW5kZXggKyAxXTtcblxuICAgIGlmIChzdXJyb2dhdGVfYXdhcmVfZW5kX2luZGV4ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyLnNsaWNlKHN1cnJvZ2F0ZV9hd2FyZV9zdGFydF9pbmRleCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnN0ci5zbGljZShzdXJyb2dhdGVfYXdhcmVfc3RhcnRfaW5kZXgsIHN1cnJvZ2F0ZV9hd2FyZV9lbmRfaW5kZXgpO1xufTtcblxuXG5TdXJyb2dhdGVBd2FyZVN0cmluZy5wcm90b3R5cGUuY2hhckNvZGVBdCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIGlmICh0aGlzLmluZGV4X21hcHBpbmcubGVuZ3RoIDw9IGluZGV4KSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgfVxuICAgIHZhciBzdXJyb2dhdGVfYXdhcmVfaW5kZXggPSB0aGlzLmluZGV4X21hcHBpbmdbaW5kZXhdO1xuICAgIHZhciB1cHBlciA9IHRoaXMuc3RyLmNoYXJDb2RlQXQoc3Vycm9nYXRlX2F3YXJlX2luZGV4KTtcbiAgICB2YXIgbG93ZXI7XG4gICAgaWYgKHVwcGVyID49IDB4RDgwMCAmJiB1cHBlciA8PSAweERCRkYgJiYgc3Vycm9nYXRlX2F3YXJlX2luZGV4IDwgdGhpcy5zdHIubGVuZ3RoKSB7XG4gICAgICAgIGxvd2VyID0gdGhpcy5zdHIuY2hhckNvZGVBdChzdXJyb2dhdGVfYXdhcmVfaW5kZXggKyAxKTtcbiAgICAgICAgaWYgKGxvd2VyID49IDB4REMwMCAmJiBsb3dlciA8PSAweERGRkYpIHtcbiAgICAgICAgICAgIHJldHVybiAodXBwZXIgLSAweEQ4MDApICogMHg0MDAgKyBsb3dlciAtIDB4REMwMCArIDB4MTAwMDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVwcGVyO1xufTtcblxuXG5TdXJyb2dhdGVBd2FyZVN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RyO1xufTtcblxuXG5TdXJyb2dhdGVBd2FyZVN0cmluZy5pc1N1cnJvZ2F0ZVBhaXIgPSBmdW5jdGlvbiAoY2gpIHtcbiAgICB2YXIgdXRmMTZfY29kZSA9IGNoLmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKHV0ZjE2X2NvZGUgPj0gMHhEODAwICYmIHV0ZjE2X2NvZGUgPD0gMHhEQkZGKSB7XG4gICAgICAgIC8vIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU3Vycm9nYXRlQXdhcmVTdHJpbmc7XG4iXSwiZmlsZSI6InV0aWwvU3Vycm9nYXRlQXdhcmVTdHJpbmcuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==