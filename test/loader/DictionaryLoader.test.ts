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

describe('DictionaryLoader', () => {
  const DictionaryLoader = require('../../src/loader/NodeDictionaryLoader')
  const DIC_DIR = 'dict/'

  let dictionaries: any = null // target object

  beforeAll(done => {
    const loader = new DictionaryLoader(DIC_DIR)
    loader.load((_: any, dic: any) => {
      dictionaries = dic
      done()
    })
  })

  it('Unknown dictionaries are loaded properly', () => {
    expect(dictionaries.unknown_dictionary.lookup(' ')).toEqual({
      class_id: 1,
      class_name: 'SPACE',
      is_always_invoke: 0,
      is_grouping: 1,
      max_length: 0
    })
  })
  it('TokenInfoDictionary is loaded properly', () => {
    expect(dictionaries.token_info_dictionary.getFeatures('0').length).toBeGreaterThan(1)
  })
})

describe('DictionaryLoader about loading', () => {
  const DictionaryLoader = require('../../src/loader/NodeDictionaryLoader')

  it('could load directory path without suffix /', done => {
    const loader = new DictionaryLoader('dict') // not have suffix /
    loader.load((err: any, dic: any) => {
      expect(err).toBeNull()
      expect(dic).not.toBeNull()
      done()
    })
  })
  it("couldn't load dictionary, then call with error", done => {
    const loader = new DictionaryLoader('not_exist_dictionary')
    loader.load((err: any, _: any) => {
      expect(err).not.toBeNull()
      done()
    })
  })
})
