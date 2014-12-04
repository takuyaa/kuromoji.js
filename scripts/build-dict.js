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

var fs = require("fs");
var jconv = require("jconv");

var kuromoji = require("../dist/node/kuromoji.js");


var DIC_DIR = "scripts/input/";
var ENCODING = "EUCJP";

var tid_files = [
    "Adj.csv",
    "Adnominal.csv",
    "Adverb.csv",
    "Auxil.csv",
    "Conjunction.csv",
    "Filler.csv",
    "Interjection.csv",
    "Noun.adjv.csv",
    "Noun.adverbal.csv",
    "Noun.csv",
    "Noun.demonst.csv",
    "Noun.nai.csv",
    "Noun.name.csv",
    "Noun.number.csv",
    "Noun.org.csv",
    "Noun.others.csv",
    "Noun.place.csv",
    "Noun.proper.csv",
    "Noun.verbal.csv",
    "Others.csv",
    "Postp-col.csv",
    "Postp.csv",
    "Prefix.csv",
    "Suffix.csv",
    "Symbol.csv",
    "Verb.csv"
];

var handleMatrixDef = function(filename) {
    return fs.readFileSync(filename, "ascii");
};

var handleTokenDic = function(filename) {
    var text = fs.readFileSync(filename);
    text = jconv.decode(text, ENCODING);
    return text;
};


// Build token info dictionary
var builder = kuromoji.dictionaryBuilder();
for (var i = 0; i < tid_files.length; i++) {
    builder = builder.addTokenInfoDictionary(handleTokenDic(DIC_DIR + tid_files[i]));
}

// Build connection costs matrix
builder = builder.costMatrix(handleMatrixDef(DIC_DIR + "matrix.def"));

// Build unknown dictionary
builder = builder.charDef(handleTokenDic(DIC_DIR + "char.def"));
builder = builder.unkDef(handleTokenDic(DIC_DIR + "unk.def"));


var kuromoji_dic = builder.build();

module.exports = kuromoji_dic;
