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

var fs = require("fs");
var jconv = require("jconv");
var expect = require("chai").expect;

var kuromoji = require("../../src/kuromoji.js");
var Tokenizer = require("../../src/Tokenizer.js");


var DIC_DIR = "test/resource/minimum-dic/";
var ENCODING = "EUCJP";

var minimum_dic_files = [
    "minimum.csv"
];

var connection_costs_file = DIC_DIR + "matrix.def";
var char_def_file = DIC_DIR + "char.def";
var unk_def_file = DIC_DIR + "unk.def";
var tid_dic_files = minimum_dic_files.map(function (file) {
    return DIC_DIR + file;
});


var handleMatrixDef = function(filename) {
    return fs.readFileSync(filename, "ascii");
};

var handleTokenDic = function(filename) {
    var text = fs.readFileSync(filename);
    text = jconv.decode(text, ENCODING);
    return text;
};


describe("DictionaryBuilder", function () {
    this.timeout(30000);

    var kuromoji_dic = null;  // target object of DynamicDictionaries to build

    before("Build", function (done) {
        // Build token info dictionary
        var builder = kuromoji.dictionaryBuilder();
        for (var i = 0; i < tid_dic_files.length; i++) {
            builder = builder.addTokenInfoDictionary(handleTokenDic(tid_dic_files[i]));
        }

        // Build connection costs matrix
        builder = builder.costMatrix(handleMatrixDef(connection_costs_file));

        // Build unknown dictionary
        builder = builder.charDef(handleTokenDic(char_def_file));
        builder = builder.unkDef(handleTokenDic(unk_def_file));

        kuromoji_dic = builder.build();

        done();
    });

    it("Dictionary not to be null", function () {
        expect(kuromoji_dic).not.to.be.null;
    });
    it("TokenInfoDictionary not to be null", function () {
        expect(kuromoji_dic.token_info_dictionary).not.to.be.null;
    });
    it("TokenInfoDictionary", function () {
        // expect(kuromoji_dic.token_info_dictionary.getFeatures("1467000")).to.have.length.above(1);
        expect(kuromoji_dic.token_info_dictionary.dictionary.buffer).to.have.length.above(1);
    });
    it("DoubleArray not to be null", function () {
        expect(kuromoji_dic.trie).not.to.be.null;
    });
    it("ConnectionCosts not to be null", function () {
        expect(kuromoji_dic.connection_costs).not.to.be.null;
    });
    it("Tokenize simple test", function () {
        var tokenizer = new Tokenizer(kuromoji_dic);
        var path = tokenizer.tokenize("すもももももももものうち");

        var expected_tokens = [
            {
                word_type: "KNOWN",
                word_position: 1,
                surface_form: "すもも",
                pos: "名詞",
                pos_detail_1: "一般",
                pos_detail_2: "*",
                pos_detail_3: "*",
                conjugated_type: "*",
                conjugated_form: "*",
                basic_form: "すもも",
                reading: "スモモ",
                pronunciation: "スモモ"
            },
            {
                word_type: "KNOWN",
                word_position: 4,
                surface_form: "も",
                pos: "助詞",
                pos_detail_1: "係助詞",
                pos_detail_2: "*",
                pos_detail_3: "*",
                conjugated_type: "*",
                conjugated_form: "*",
                basic_form: "も",
                reading: "モ",
                pronunciation: "モ"
            },
            {
                word_type: "KNOWN",
                word_position: 5,
                surface_form: "もも",
                pos: "名詞",
                pos_detail_1: "一般",
                pos_detail_2: "*",
                pos_detail_3: "*",
                conjugated_type: "*",
                conjugated_form: "*",
                basic_form: "もも",
                reading: "モモ",
                pronunciation: "モモ" },
            {
                word_type: "KNOWN",
                word_position: 7,
                surface_form: "も",
                pos: "助詞",
                pos_detail_1: "係助詞",
                pos_detail_2: "*",
                pos_detail_3: "*",
                conjugated_type: "*",
                conjugated_form: "*",
                basic_form: "も",
                reading: "モ",
                pronunciation: "モ"
            },
            {
                word_type: "KNOWN",
                word_position: 8,
                surface_form: "もも",
                pos: "名詞",
                pos_detail_1: "一般",
                pos_detail_2: "*",
                pos_detail_3: "*",
                conjugated_type: "*",
                conjugated_form: "*",
                basic_form: "もも",
                reading: "モモ",
                pronunciation: "モモ"
            },
            {
                word_type: "KNOWN",
                word_position: 10,
                surface_form: "の",
                pos: "助詞",
                pos_detail_1: "連体化",
                pos_detail_2: "*",
                pos_detail_3: "*",
                conjugated_type: "*",
                conjugated_form: "*",
                basic_form: "の",
                reading: "ノ",
                pronunciation: "ノ"
            },
            {
                word_type: "KNOWN",
                word_position: 11,
                surface_form: "うち",
                pos: "名詞",
                pos_detail_1: "非自立",
                pos_detail_2: "副詞可能",
                pos_detail_3: "*",
                conjugated_type: "*",
                conjugated_form: "*",
                basic_form: "うち",
                reading: "ウチ",
                pronunciation: "ウチ"
            }
        ];

        expect(path).to.have.length(7);

        for (var i = 0; i < expected_tokens.length; i++) {
            var expected_token = expected_tokens[i];
            var target_token = path[i];
            for (var key in expected_token) {
                expect(target_token).to.have.property(key, expected_token[key]);
            }
        }
    });
});
