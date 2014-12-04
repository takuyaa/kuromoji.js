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
var ViterbiBuilder = require("../../src/viterbi/ViterbiBuilder.js");

var DIC_DIR = "dist/dict/";



describe("ViterbiBuilder", function () {
    var viterbi_builder = null;  // target object

    before(function (done) {
        this.timeout(5 * 60 * 1000); // 5 min
        var loader = DictionaryLoader.getLoader(DIC_DIR);
        loader.load(function (err, dic) {
            viterbi_builder = new ViterbiBuilder(dic);
            done();
        });
    });

    it("Unknown word", function () {
        var lattice = viterbi_builder.build("トトロ");
        for (var i = 0; i <= lattice.eos_pos; i++) {
            var nodes = lattice.nodes_end_at[i];
            if (nodes == null) {
                continue;
            }
            for (var j = 0; j < nodes.length; j++) {
                // console.log(nodes[j].name + " " + nodes[j].surface_form);
            }
        }

        // expect(lattice).to.have.length(7);
    });
});
