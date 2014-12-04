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

/**
 * Mappings between IPADIC dictionary features and tokenized results
 * @constructor
 */
function IpadicFormatter() {
}

IpadicFormatter.prototype.formatEntry = function (word_id, position, type, features) {
    var token = {};
    token.word_id = word_id;
    token.word_type = type;
    token.word_position = position;

    token.surface_form = features[0];
    token.pos = features[1];
    token.pos_detail_1 = features[2];
    token.pos_detail_2 = features[3];
    token.pos_detail_3 = features[4];
    token.conjugated_type = features[5];
    token.conjugated_form = features[6];
    token.basic_form = features[7];
    token.reading = features[8];
    token.pronunciation = features[9];

    return token;
};

IpadicFormatter.prototype.formatUnknownEntry = function (word_id, position, type, features, surface_form) {
    var token = {};
    token.word_id = word_id;
    token.word_type = type;
    token.word_position = position;

    token.surface_form = surface_form;
    token.pos = features[1];
    token.pos_detail_1 = features[2];
    token.pos_detail_2 = features[3];
    token.pos_detail_3 = features[4];
    token.conjugated_type = features[5];
    token.conjugated_form = features[6];
    token.basic_form = features[7];
    // token.reading = features[8];
    // token.pronunciation = features[9];

    return token;
};


module.exports = IpadicFormatter;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC9JcGFkaWNGb3JtYXR0ZXIuanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1dGlsL0lwYWRpY0Zvcm1hdHRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBNYXBwaW5ncyBiZXR3ZWVuIElQQURJQyBkaWN0aW9uYXJ5IGZlYXR1cmVzIGFuZCB0b2tlbml6ZWQgcmVzdWx0c1xuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIElwYWRpY0Zvcm1hdHRlcigpIHtcbn1cblxuSXBhZGljRm9ybWF0dGVyLnByb3RvdHlwZS5mb3JtYXRFbnRyeSA9IGZ1bmN0aW9uICh3b3JkX2lkLCBwb3NpdGlvbiwgdHlwZSwgZmVhdHVyZXMpIHtcbiAgICB2YXIgdG9rZW4gPSB7fTtcbiAgICB0b2tlbi53b3JkX2lkID0gd29yZF9pZDtcbiAgICB0b2tlbi53b3JkX3R5cGUgPSB0eXBlO1xuICAgIHRva2VuLndvcmRfcG9zaXRpb24gPSBwb3NpdGlvbjtcblxuICAgIHRva2VuLnN1cmZhY2VfZm9ybSA9IGZlYXR1cmVzWzBdO1xuICAgIHRva2VuLnBvcyA9IGZlYXR1cmVzWzFdO1xuICAgIHRva2VuLnBvc19kZXRhaWxfMSA9IGZlYXR1cmVzWzJdO1xuICAgIHRva2VuLnBvc19kZXRhaWxfMiA9IGZlYXR1cmVzWzNdO1xuICAgIHRva2VuLnBvc19kZXRhaWxfMyA9IGZlYXR1cmVzWzRdO1xuICAgIHRva2VuLmNvbmp1Z2F0ZWRfdHlwZSA9IGZlYXR1cmVzWzVdO1xuICAgIHRva2VuLmNvbmp1Z2F0ZWRfZm9ybSA9IGZlYXR1cmVzWzZdO1xuICAgIHRva2VuLmJhc2ljX2Zvcm0gPSBmZWF0dXJlc1s3XTtcbiAgICB0b2tlbi5yZWFkaW5nID0gZmVhdHVyZXNbOF07XG4gICAgdG9rZW4ucHJvbnVuY2lhdGlvbiA9IGZlYXR1cmVzWzldO1xuXG4gICAgcmV0dXJuIHRva2VuO1xufTtcblxuSXBhZGljRm9ybWF0dGVyLnByb3RvdHlwZS5mb3JtYXRVbmtub3duRW50cnkgPSBmdW5jdGlvbiAod29yZF9pZCwgcG9zaXRpb24sIHR5cGUsIGZlYXR1cmVzLCBzdXJmYWNlX2Zvcm0pIHtcbiAgICB2YXIgdG9rZW4gPSB7fTtcbiAgICB0b2tlbi53b3JkX2lkID0gd29yZF9pZDtcbiAgICB0b2tlbi53b3JkX3R5cGUgPSB0eXBlO1xuICAgIHRva2VuLndvcmRfcG9zaXRpb24gPSBwb3NpdGlvbjtcblxuICAgIHRva2VuLnN1cmZhY2VfZm9ybSA9IHN1cmZhY2VfZm9ybTtcbiAgICB0b2tlbi5wb3MgPSBmZWF0dXJlc1sxXTtcbiAgICB0b2tlbi5wb3NfZGV0YWlsXzEgPSBmZWF0dXJlc1syXTtcbiAgICB0b2tlbi5wb3NfZGV0YWlsXzIgPSBmZWF0dXJlc1szXTtcbiAgICB0b2tlbi5wb3NfZGV0YWlsXzMgPSBmZWF0dXJlc1s0XTtcbiAgICB0b2tlbi5jb25qdWdhdGVkX3R5cGUgPSBmZWF0dXJlc1s1XTtcbiAgICB0b2tlbi5jb25qdWdhdGVkX2Zvcm0gPSBmZWF0dXJlc1s2XTtcbiAgICB0b2tlbi5iYXNpY19mb3JtID0gZmVhdHVyZXNbN107XG4gICAgLy8gdG9rZW4ucmVhZGluZyA9IGZlYXR1cmVzWzhdO1xuICAgIC8vIHRva2VuLnByb251bmNpYXRpb24gPSBmZWF0dXJlc1s5XTtcblxuICAgIHJldHVybiB0b2tlbjtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBJcGFkaWNGb3JtYXR0ZXI7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=