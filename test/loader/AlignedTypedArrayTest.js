/*
 * Regression tests for the ArrayBuffer alignment guard.
 *
 * Upstream issues:
 *   takuyaa/kuromoji.js#47  "Doesn't work in Firefox because of error in
 *                            loading array buffer"
 *   takuyaa/kuromoji.js#49  "byte length of Int16Array should be a
 *                            multiple of 2"
 *
 * A gunzip implementation may hand back a buffer whose byte length is not
 * an exact multiple of the element size. `new Int16Array(buffer)` then
 * throws a RangeError, which is why the same .gz dictionaries load in
 * Chrome and fail in Firefox.
 *
 * Every one of these assertions throws against the pre-fix loader.
 */

"use strict";

var expect = require("chai").expect;
var DictionaryLoader = require("../../src/loader/DictionaryLoader");
var alignedTypedArray = DictionaryLoader.alignedTypedArray;

describe("alignedTypedArray", function () {
    it("returns a plain view when the buffer is already aligned", function () {
        var buffer = new ArrayBuffer(8);
        new Uint8Array(buffer).set([1, 0, 2, 0, 3, 0, 4, 0]);

        var view = alignedTypedArray(Int16Array, buffer);

        expect(view.length).to.equal(4);
        expect(Array.from(view)).to.deep.equal([1, 2, 3, 4]);
    });

    it("truncates a misaligned buffer for Int16Array instead of throwing", function () {
        // 9 bytes: 4 whole Int16 elements plus one stray byte.
        var buffer = new ArrayBuffer(9);
        new Uint8Array(buffer).set([1, 0, 2, 0, 3, 0, 4, 0, 0xff]);

        expect(function () {
            new Int16Array(buffer);
        }).to.throw(RangeError);

        var view = alignedTypedArray(Int16Array, buffer);

        expect(view.length).to.equal(4);
        expect(Array.from(view)).to.deep.equal([1, 2, 3, 4]);
    });

    it("truncates a misaligned buffer for Uint32Array", function () {
        // 9 bytes: 2 whole Uint32 elements plus one stray byte.
        var buffer = new ArrayBuffer(9);
        new Uint8Array(buffer).set([1, 0, 0, 0, 2, 0, 0, 0, 0xff]);

        expect(function () {
            new Uint32Array(buffer);
        }).to.throw(RangeError);

        var view = alignedTypedArray(Uint32Array, buffer);

        expect(view.length).to.equal(2);
        expect(Array.from(view)).to.deep.equal([1, 2]);
    });

    it("truncates a misaligned buffer for Int32Array", function () {
        // The trie (base.dat / check.dat) is read as Int32Array and has
        // the same hazard. Upstream PR #48 guarded only Uint32Array.
        var buffer = new ArrayBuffer(6);
        new Uint8Array(buffer).set([1, 0, 0, 0, 0xff, 0xff]);

        expect(function () {
            new Int32Array(buffer);
        }).to.throw(RangeError);

        var view = alignedTypedArray(Int32Array, buffer);

        expect(view.length).to.equal(1);
        expect(view[0]).to.equal(1);
    });

    it("yields an empty view when the buffer is shorter than one element", function () {
        var buffer = new ArrayBuffer(3);

        var view = alignedTypedArray(Uint32Array, buffer);

        expect(view.length).to.equal(0);
    });
});
