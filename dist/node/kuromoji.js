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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJrdXJvbW9qaS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgVG9rZW5pemVyQnVpbGRlciA9IHJlcXVpcmUoXCIuL1Rva2VuaXplckJ1aWxkZXIuanNcIik7XG52YXIgRGljdGlvbmFyeUJ1aWxkZXIgPSByZXF1aXJlKFwiLi91dGlsL0RpY3Rpb25hcnlCdWlsZGVyLmpzXCIpO1xuXG5cbi8vIFB1YmxpYyBtZXRob2RzXG52YXIga3Vyb21vamkgPSB7XG4gICAgYnVpbGRlcjogZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgICByZXR1cm4gbmV3IFRva2VuaXplckJ1aWxkZXIob3B0aW9uKTtcbiAgICB9LFxuICAgIGRpY3Rpb25hcnlCdWlsZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBuZXcgRGljdGlvbmFyeUJ1aWxkZXIoKTtcbiAgICB9XG59O1xuXG5pZiAodHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIC8vIEluIG5vZGVcbiAgICBtb2R1bGUuZXhwb3J0cyA9IGt1cm9tb2ppO1xufSBlbHNlIHtcbiAgICAvLyBJbiBicm93c2VyXG4gICAgd2luZG93Lmt1cm9tb2ppID0ga3Vyb21vamk7XG59XG4iXSwiZmlsZSI6Imt1cm9tb2ppLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=