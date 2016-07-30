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

const IPADic = require('mecab-ipadic-seed');
const dic = new IPADic();

const kuromoji = require("../dist/node/kuromoji.js");
const builder = kuromoji.dictionaryBuilder();

// Build token info dictionary
const tokenInfoPromise = dic.readTokenInfo((line) => {
    builder.addTokenInfoDictionary(line);
}).then(() => {
    console.log('Finishied to read token info dics');
});

// Build connection costs matrix
let matrixDef = '';
const matrixDefPromise = dic.readMatrixDef((line) => {
    matrixDef += line + "\n";
}).then(() => {
    builder.costMatrix(matrixDef);
    console.log('Finishied to read matrix.def');
});

// Build unknown dictionary
let unkDef = '';
const unkDefPromise = dic.readUnkDef((line) => {
    unkDef += line + "\n";
}).then(() => {
    builder.unkDef(unkDef);
    console.log('Finishied to read unk.def');
});

// Build character definition dictionary
let charDef = '';
const charDefPromise = dic.readCharDef((line) => {
    charDef += line + "\n";
}).then(() => {
    builder.charDef(charDef);
    console.log('Finishied to read char.def');
});

module.exports = new Promise((resolve) => {
    // Build kuromoji.js binary dictionary
    Promise.all([tokenInfoPromise, matrixDefPromise, unkDefPromise, charDefPromise]).then(() => {
        console.log('Finishied to read all seed dictionary files');
        console.log('Building binary dictionary ...');
        const dic = builder.build();
        resolve(dic);
    });
});
