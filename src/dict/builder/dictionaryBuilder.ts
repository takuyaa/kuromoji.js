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

const doublearray = require('doublearray')
const DynamicDictionaries = require('../DynamicDictionaries')
const TokenInfoDictionary = require('../TokenInfoDictionary')
const ConnectionCostsBuilder = require('./ConnectionCostsBuilder')
const CharacterDefinitionBuilder = require('./CharacterDefinitionBuilder')
const UnknownDictionary = require('../UnknownDictionary')

/**
 * Build dictionaries (token info, connection costs)
 *
 * Generates from matrix.def
 * cc.dat: Connection costs
 *
 * Generates from *.csv
 * dat.dat: Double array
 * tid.dat: Token info dictionary
 * tid_map.dat: targetMap
 * tid_pos.dat: posList (part of speech)
 */
export class DictionaryBuilder {
  // Array of entries, each entry in Mecab form
  // (0: surface form, 1: left id, 2: right id, 3: word cost, 4: part of speech id, 5-: other features)
  public readonly tid_entries: string[][] = []
  public readonly unk_entries: string[][] = []
  public readonly cc_builder = new ConnectionCostsBuilder()
  public readonly cd_builder = new CharacterDefinitionBuilder()

  addTokenInfoDictionary(line: string) {
    const new_entry = line.split(',')
    this.tid_entries.push(new_entry)
    return this
  }

  /**
   * Put one line of "matrix.def" file for building ConnectionCosts object
   *
   * @param {string} line is a line of "matrix.def"
   */
  putCostMatrixLine(line: string) {
    this.cc_builder.putLine(line)
    return this
  }

  putCharDefLine(line: string) {
    this.cd_builder.putLine(line)
    return this
  }

  /**
   * Put one line of "unk.def" file for building UnknownDictionary object
   *
   * @param {string} line is a line of "unk.def"
   */
  putUnkDefLine(line: string) {
    this.unk_entries.push(line.split(','))
    return this
  }

  build() {
    const dictionaries = this.buildTokenInfoDictionary()
    const unknown_dictionary = this.buildUnknownDictionary()
    return new DynamicDictionaries(
      dictionaries.trie,
      dictionaries.token_info_dictionary,
      this.cc_builder.build(),
      unknown_dictionary
    )
  }

  /**
   * Build TokenInfoDictionary
   *
   * @returns {{trie: *, token_info_dictionary: *}}
   */
  buildTokenInfoDictionary() {
    const token_info_dictionary = new TokenInfoDictionary()

    // using as hashmap, string -> string (word_id -> surface_form) to build dictionary
    const dictionary_entries = token_info_dictionary.buildDictionary(this.tid_entries)

    const trie = this.buildDoubleArray()

    for (let token_info_id in dictionary_entries) {
      const surface_form = dictionary_entries[token_info_id]
      const trie_id = trie.lookup(surface_form)

      // Assertion
      // if (trie_id < 0) {
      //     console.log("Not Found:" + surface_form);
      // }

      token_info_dictionary.addMapping(trie_id, token_info_id)
    }

    return {
      trie: trie,
      token_info_dictionary: token_info_dictionary
    }
  }

  buildUnknownDictionary() {
    const unk_dictionary = new UnknownDictionary()

    // using as hashmap, string -> string (word_id -> surface_form) to build dictionary
    const dictionary_entries = unk_dictionary.buildDictionary(this.unk_entries)

    const char_def = this.cd_builder.build() // Create CharacterDefinition

    unk_dictionary.characterDefinition(char_def)

    for (let token_info_id in dictionary_entries) {
      const class_name = dictionary_entries[token_info_id]
      const class_id = char_def.invoke_definition_map.lookup(class_name)

      // Assertion
      // if (trie_id < 0) {
      //     console.log("Not Found:" + surface_form);
      // }

      unk_dictionary.addMapping(class_id, token_info_id)
    }

    return unk_dictionary
  }

  /**
   * Build double array trie
   *
   * @returns {DoubleArray} Double-Array trie
   */
  buildDoubleArray() {
    let trie_id = 0
    const words = this.tid_entries.map(function(entry) {
      const surface_form = entry[0]
      return { k: surface_form, v: trie_id++ }
    })

    const builder = doublearray.builder(1024 * 1024)
    return builder.build(words)
  }
}
