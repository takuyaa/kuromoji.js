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

var expect = require("chai").expect;
var DictionaryLoader = require("../../src/loader/DictionaryLoader.js");

var DIC_DIR = "dist/dict/";


describe("DictionaryLoader", function () {

    var dictionaries = null;  // target object

    before(function (done) {
        this.timeout(5 * 60 * 1000); // 5 min

        var loader = DictionaryLoader.getLoader(DIC_DIR);
        loader.load(function (err, dic) {
            dictionaries = dic;
            done();
        });
    });

    it("Unknown dictionaries are loaded properly", function () {
        expect(dictionaries.unknown_dictionary.lookup(" ")).to.deep.eql({
            class_id: 1,
            class_name: "SPACE",
            is_always_invoke: 0,
            is_grouping: 1,
            max_length: 0
        });
    });
    it("TokenInfoDictionary is loaded properly", function () {
        expect(dictionaries.token_info_dictionary.getFeatures("0")).to.have.length.above(1);
    });
});
