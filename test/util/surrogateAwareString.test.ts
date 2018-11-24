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

describe('SurrogateAwareString', () => {
  const SurrogateAwareString = require('../../src/util/SurrogateAwareString')

  it('length 1', () => {
    var str = new SurrogateAwareString('𠮷') // target object
    expect(str.length).toEqual(1)
  })

  it('length 3', () => {
    var str = new SurrogateAwareString('𠮷野屋') // target object
    expect(str.length).toEqual(3)
  })

  it('slice', () => {
    var str = new SurrogateAwareString('𠮷野屋') // target object
    expect(str.slice(0)).toEqual('𠮷野屋')
    expect(str.slice(1)).toEqual('野屋')
    expect(str.slice(2)).toEqual('屋')
  })

  it('charAt', () => {
    var str = new SurrogateAwareString('𠮷野屋') // target object
    expect(str.charAt(0)).toEqual('𠮷')
    expect(str.charAt(1)).toEqual('野')
    expect(str.charAt(2)).toEqual('屋')
  })

  it('charCodeAt', () => {
    var str = new SurrogateAwareString('𠮷野屋') // target object
    expect(str.charCodeAt(0)).toEqual(0x20bb7)
    expect(str.charCodeAt(1)).toEqual('野'.charCodeAt(0))
    expect(str.charCodeAt(2)).toEqual('屋'.charCodeAt(0))
  })
})
