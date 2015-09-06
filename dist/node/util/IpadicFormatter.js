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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1dGlsL0lwYWRpY0Zvcm1hdHRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIE1hcHBpbmdzIGJldHdlZW4gSVBBRElDIGRpY3Rpb25hcnkgZmVhdHVyZXMgYW5kIHRva2VuaXplZCByZXN1bHRzXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSXBhZGljRm9ybWF0dGVyKCkge1xufVxuXG5JcGFkaWNGb3JtYXR0ZXIucHJvdG90eXBlLmZvcm1hdEVudHJ5ID0gZnVuY3Rpb24gKHdvcmRfaWQsIHBvc2l0aW9uLCB0eXBlLCBmZWF0dXJlcykge1xuICAgIHZhciB0b2tlbiA9IHt9O1xuICAgIHRva2VuLndvcmRfaWQgPSB3b3JkX2lkO1xuICAgIHRva2VuLndvcmRfdHlwZSA9IHR5cGU7XG4gICAgdG9rZW4ud29yZF9wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG4gICAgdG9rZW4uc3VyZmFjZV9mb3JtID0gZmVhdHVyZXNbMF07XG4gICAgdG9rZW4ucG9zID0gZmVhdHVyZXNbMV07XG4gICAgdG9rZW4ucG9zX2RldGFpbF8xID0gZmVhdHVyZXNbMl07XG4gICAgdG9rZW4ucG9zX2RldGFpbF8yID0gZmVhdHVyZXNbM107XG4gICAgdG9rZW4ucG9zX2RldGFpbF8zID0gZmVhdHVyZXNbNF07XG4gICAgdG9rZW4uY29uanVnYXRlZF90eXBlID0gZmVhdHVyZXNbNV07XG4gICAgdG9rZW4uY29uanVnYXRlZF9mb3JtID0gZmVhdHVyZXNbNl07XG4gICAgdG9rZW4uYmFzaWNfZm9ybSA9IGZlYXR1cmVzWzddO1xuICAgIHRva2VuLnJlYWRpbmcgPSBmZWF0dXJlc1s4XTtcbiAgICB0b2tlbi5wcm9udW5jaWF0aW9uID0gZmVhdHVyZXNbOV07XG5cbiAgICByZXR1cm4gdG9rZW47XG59O1xuXG5JcGFkaWNGb3JtYXR0ZXIucHJvdG90eXBlLmZvcm1hdFVua25vd25FbnRyeSA9IGZ1bmN0aW9uICh3b3JkX2lkLCBwb3NpdGlvbiwgdHlwZSwgZmVhdHVyZXMsIHN1cmZhY2VfZm9ybSkge1xuICAgIHZhciB0b2tlbiA9IHt9O1xuICAgIHRva2VuLndvcmRfaWQgPSB3b3JkX2lkO1xuICAgIHRva2VuLndvcmRfdHlwZSA9IHR5cGU7XG4gICAgdG9rZW4ud29yZF9wb3NpdGlvbiA9IHBvc2l0aW9uO1xuXG4gICAgdG9rZW4uc3VyZmFjZV9mb3JtID0gc3VyZmFjZV9mb3JtO1xuICAgIHRva2VuLnBvcyA9IGZlYXR1cmVzWzFdO1xuICAgIHRva2VuLnBvc19kZXRhaWxfMSA9IGZlYXR1cmVzWzJdO1xuICAgIHRva2VuLnBvc19kZXRhaWxfMiA9IGZlYXR1cmVzWzNdO1xuICAgIHRva2VuLnBvc19kZXRhaWxfMyA9IGZlYXR1cmVzWzRdO1xuICAgIHRva2VuLmNvbmp1Z2F0ZWRfdHlwZSA9IGZlYXR1cmVzWzVdO1xuICAgIHRva2VuLmNvbmp1Z2F0ZWRfZm9ybSA9IGZlYXR1cmVzWzZdO1xuICAgIHRva2VuLmJhc2ljX2Zvcm0gPSBmZWF0dXJlc1s3XTtcbiAgICAvLyB0b2tlbi5yZWFkaW5nID0gZmVhdHVyZXNbOF07XG4gICAgLy8gdG9rZW4ucHJvbnVuY2lhdGlvbiA9IGZlYXR1cmVzWzldO1xuXG4gICAgcmV0dXJuIHRva2VuO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IElwYWRpY0Zvcm1hdHRlcjtcbiJdLCJmaWxlIjoidXRpbC9JcGFkaWNGb3JtYXR0ZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==