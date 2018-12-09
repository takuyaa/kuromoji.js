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

import { Tokenizer } from '../src/tokenizer'

describe('Tokenizer static method test', () => {
  it('splitByPunctuation', () => {
    expect(Tokenizer.splitByPunctuation('すもももももももものうち')).toEqual([
      'すもももももももものうち'
    ])
  })
  it('splitByPunctuation', () => {
    expect(Tokenizer.splitByPunctuation('、')).toEqual(['、'])
  })
  it('splitByPunctuation', () => {
    expect(Tokenizer.splitByPunctuation('。')).toEqual(['。'])
  })
  it('splitByPunctuation', () => {
    expect(Tokenizer.splitByPunctuation('すもも、も、もも。もも、も、もも。')).toEqual([
      'すもも、',
      'も、',
      'もも。',
      'もも、',
      'も、',
      'もも。'
    ])
  })
  it('splitByPunctuation', () => {
    expect(Tokenizer.splitByPunctuation('、𠮷野屋。漢字。')).toEqual(['、', '𠮷野屋。', '漢字。'])
  })
})
