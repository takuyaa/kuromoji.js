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

const ViterbiBuilder = require('./viterbi/ViterbiBuilder')
const ViterbiSearcher = require('./viterbi/ViterbiSearcher')
const IpadicFormatter = require('./util/IpadicFormatter')

const PUNCTUATION = /、|。/

/**
 * Tokenizer
 *
 * @param dic Dictionaries used by this tokenizer
 */
export class Tokenizer {
  public readonly token_info_dictionary: any
  public readonly unknown_dictionary: any
  public readonly viterbi_builder: any
  public readonly viterbi_searcher: any
  public readonly formatter: any

  constructor(dic: any) {
    this.token_info_dictionary = dic.token_info_dictionary
    this.unknown_dictionary = dic.unknown_dictionary
    this.viterbi_builder = new ViterbiBuilder(dic)
    this.viterbi_searcher = new ViterbiSearcher(dic.connection_costs)
    this.formatter = new IpadicFormatter() // TODO Other dictionaries
  }

  /**
   * Split into sentence by punctuation
   *
   * @param input Input text
   * @returns Sentences end with punctuation
   */
  static splitByPunctuation(input: string): string[] {
    const sentences = []
    let tail = input
    while (true) {
      if (tail === '') {
        break
      }
      const index = tail.search(PUNCTUATION)
      if (index < 0) {
        sentences.push(tail)
        break
      }
      sentences.push(tail.substring(0, index + 1))
      tail = tail.substring(index + 1)
    }
    return sentences
  }

  /**
   * Tokenize text
   *
   * @param text Input text to analyze
   * @returns Tokens
   */
  tokenize(text: string): any[] {
    const sentences = Tokenizer.splitByPunctuation(text)
    const tokens: any[] = []
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]
      this.tokenizeForSentence(sentence, tokens)
    }
    return tokens
  }

  tokenizeForSentence(sentence: string, tokens: any[]) {
    const lattice = this.getLattice(sentence)
    const best_path = this.viterbi_searcher.search(lattice)
    let last_pos = 0
    if (tokens.length > 0) {
      last_pos = tokens[tokens.length - 1].word_position
    }

    for (let j = 0; j < best_path.length; j++) {
      const node = best_path[j]
      let token
      let features
      let features_line
      if (node.type === 'KNOWN') {
        features_line = this.token_info_dictionary.getFeatures(node.name)
        if (features_line == null) {
          features = []
        } else {
          features = features_line.split(',')
        }
        token = this.formatter.formatEntry(
          node.name,
          last_pos + node.start_pos,
          node.type,
          features
        )
      } else if (node.type === 'UNKNOWN') {
        // Unknown word
        features_line = this.unknown_dictionary.getFeatures(node.name)
        if (features_line == null) {
          features = []
        } else {
          features = features_line.split(',')
        }
        token = this.formatter.formatUnknownEntry(
          node.name,
          last_pos + node.start_pos,
          node.type,
          features,
          node.surface_form
        )
      } else {
        // TODO User dictionary
        token = this.formatter.formatEntry(node.name, last_pos + node.start_pos, node.type, [])
      }

      tokens.push(token)
    }

    return tokens
  }

  /**
   * Build word lattice
   *
   * @param text Input text to analyze
   * @returns Word lattice
   */
  getLattice(text: string) {
    return this.viterbi_builder.build(text)
  }
}
