<a name="0.1.1"></a>
## [0.1.1](https://github.com/takuyaa/kuromoji.js/compare/0.1.0...0.1.1) (2016-08-07)

### Breaking Changes

* dictionary directory path is changed from `dist/dict/` to `dict/`, and browserified file `kuromoji.js` is moved from `dist/browser/kuromoji.js` to `build/kuromoji.js` ([#13](https://github.com/takuyaa/kuromoji.js/pull/13))

### Bug Fixes

* browserified `kuromoji.js` does not work in browser ([#13](https://github.com/takuyaa/kuromoji.js/pull/13))



<a name="0.1.0"></a>
## [0.1.0](https://github.com/takuyaa/kuromoji.js/compare/0.0.5...0.1.0) (2016-08-06)

### Breaking Changes

* change binary format of `cc.dat.gz` (connection costs dictionary) ([761eaf2](https://github.com/takuyaa/kuromoji.js/commit/761eaf299ff5db4887974cbbdc74eaf42fe39cc7), [c64cc22](https://github.com/takuyaa/kuromoji.js/commit/c64cc22c6100edaf95665f9b208837893608a287))

### Bug Fixes

* word_position returns the real position in the text ([#10](https://github.com/takuyaa/kuromoji.js/pull/10))

### Performance Improvements

* read seed dictionary line-by-line to reduce memory consumption when building dictionary

### Bump deps

* update dependencies in package.json

### Miscellaneous

* separate mecab-ipadic seed dictionary to different repo as a npm package [mecab-ipadic-seed](https://www.npmjs.com/package/mecab-ipadic-seed) ([#12](https://github.com/takuyaa/kuromoji.js/pull/12))
* remove jsdoc directory from git repo ([817c23e](https://github.com/takuyaa/kuromoji.js/commit/817c23e6f57160c48655356762a5e6c059d54633))
* define `deploy` gulp task to publish [jsdoc](https://takuyaa.github.io/kuromoji.js/jsdoc/) and [demo](http://takuyaa.github.io/kuromoji.js/demo/tokenize.html) as GitHub Pages ([2d638aa](https://github.com/takuyaa/kuromoji.js/commit/2d638aa57d4ec150c0f03656e05fb327e40d0ef9))



<a name="0.0.5"></a>
## [0.0.5](https://github.com/takuyaa/kuromoji.js/compare/0.0.4...0.0.5) (2015-11-19)

### Bug Fixes

* add error handling when DictionaryLoader try to load non-exist dictionaries ([#7](https://github.com/takuyaa/kuromoji.js/pull/7))
* work with Atom editor ([#8](https://github.com/takuyaa/kuromoji.js/pull/8))



<a name="0.0.4"></a>
## [0.0.4](https://github.com/takuyaa/kuromoji.js/compare/0.0.3...0.0.4) (2015-09-07)

### Bump deps

* update dependencies in package.json ([#5](https://github.com/takuyaa/kuromoji.js/pull/5))

### Performance Improvements

* use built-in zlib module instead of zlib.js on node.js ([#6](https://github.com/takuyaa/kuromoji.js/pull/6))



<a name="0.0.3"></a>
## [0.0.3](https://github.com/takuyaa/kuromoji.js/compare/0.0.2...0.0.3) (2015-09-06)


### Miscellaneous

* introduce Travis CI, Coveralls.io and Code Climate
* update README.md



<a name="0.0.2"></a>
## [0.0.2](https://github.com/takuyaa/kuromoji.js/compare/0.0.1...0.0.2) (2014-12-04)


### Miscellaneous

* version to 0.0.2 because of failure to npm publish ([1cdad3c](https://github.com/takuyaa/kuromoji.js/commit/1cdad3cfc9ec7add7bbe83ed2c8019991bc9d39b))
