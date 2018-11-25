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

import { Tokenizer } from './tokenizer'
const DictionaryLoader = require('./loader/NodeDictionaryLoader')

/**
 * TokenizerBuilder create Tokenizer instance
 */
export class TokenizerBuilder {
  public readonly dic_path: string

  /**
   * Creates an instance of TokenizerBuilder
   *
   * @param option JSON object which have key-value pairs settings
   * @param option.dicPath Dictionary directory path (or URL using in browser)
   */
  constructor(option: any) {
    if (option.dicPath == null) {
      this.dic_path = 'dict/'
    } else {
      this.dic_path = option.dicPath
    }
  }

  /**
   * Build Tokenizer instance by asynchronous manner
   *
   * @param callback Callback function that called when build is done
   */
  build(callback: (err: any, tokenizer: any) => void) {
    const loader = new DictionaryLoader(this.dic_path)
    loader.load((err: any, dic: any) => {
      callback(err, new Tokenizer(dic))
    })
  }
}
