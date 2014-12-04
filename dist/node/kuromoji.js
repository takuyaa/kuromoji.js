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

var TokenizerBuilder = require("./TokenizerBuilder.js");
var DictionaryBuilder = require("./util/DictionaryBuilder.js");


// Public methods
var kuromoji = {
    builder: function (option) {
        return new TokenizerBuilder(option);
    },
    dictionaryBuilder: function () {
        return new DictionaryBuilder();
    }
};

if (typeof window === "undefined") {
    // In node
    module.exports = kuromoji;
} else {
    // In browser
    window.kuromoji = kuromoji;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia3Vyb21vamkuanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJrdXJvbW9qaS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFRva2VuaXplckJ1aWxkZXIgPSByZXF1aXJlKFwiLi9Ub2tlbml6ZXJCdWlsZGVyLmpzXCIpO1xudmFyIERpY3Rpb25hcnlCdWlsZGVyID0gcmVxdWlyZShcIi4vdXRpbC9EaWN0aW9uYXJ5QnVpbGRlci5qc1wiKTtcblxuXG4vLyBQdWJsaWMgbWV0aG9kc1xudmFyIGt1cm9tb2ppID0ge1xuICAgIGJ1aWxkZXI6IGZ1bmN0aW9uIChvcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUb2tlbml6ZXJCdWlsZGVyKG9wdGlvbik7XG4gICAgfSxcbiAgICBkaWN0aW9uYXJ5QnVpbGRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gbmV3IERpY3Rpb25hcnlCdWlsZGVyKCk7XG4gICAgfVxufTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAvLyBJbiBub2RlXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBrdXJvbW9qaTtcbn0gZWxzZSB7XG4gICAgLy8gSW4gYnJvd3NlclxuICAgIHdpbmRvdy5rdXJvbW9qaSA9IGt1cm9tb2ppO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9