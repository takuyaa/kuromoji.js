/*
 * Regression tests for dictionary path joining.
 *
 * Upstream used `path.join`, which collapses the double slash in a URL
 * ("https://host/dict" -> "https:/host/dict") and so made every
 * absolute-URL dictionary location fail:
 *
 *   takuyaa/kuromoji.js#37  "Can not load dict from external URL"
 *   takuyaa/kuromoji.js#39  "Builder wont accept url to data folder in
 *                            chrome extension"
 *   takuyaa/kuromoji.js#43  works locally, fails when served over HTTP
 *
 * It was also a Node builtin, which is why the browser bundle needed a
 * shim.
 */

"use strict";

var expect = require("chai").expect;
var joinPath = require("../../src/loader/DictionaryLoader").joinPath;

describe("joinPath", function () {
    it("preserves the scheme separator in an https URL", function () {
        expect(joinPath("https://cdn.example.com/dict", "base.dat.gz"))
            .to.equal("https://cdn.example.com/dict/base.dat.gz");
    });

    it("preserves the scheme separator in an http URL", function () {
        expect(joinPath("http://localhost:8080/dict", "cc.dat.gz"))
            .to.equal("http://localhost:8080/dict/cc.dat.gz");
    });

    it("handles a chrome-extension:// URL", function () {
        expect(joinPath("chrome-extension://abcdef/dict", "tid.dat.gz"))
            .to.equal("chrome-extension://abcdef/dict/tid.dat.gz");
    });

    it("handles a protocol-relative URL", function () {
        expect(joinPath("//cdn.example.com/dict", "base.dat.gz"))
            .to.equal("//cdn.example.com/dict/base.dat.gz");
    });

    it("joins a plain relative directory", function () {
        expect(joinPath("dict", "base.dat.gz")).to.equal("dict/base.dat.gz");
    });

    it("joins an absolute POSIX path", function () {
        expect(joinPath("/var/lib/dict", "base.dat.gz"))
            .to.equal("/var/lib/dict/base.dat.gz");
    });

    it("does not double the separator when the base already ends in one", function () {
        expect(joinPath("dict/", "base.dat.gz")).to.equal("dict/base.dat.gz");
        expect(joinPath("https://cdn.example.com/dict/", "base.dat.gz"))
            .to.equal("https://cdn.example.com/dict/base.dat.gz");
    });

    it("accepts a Windows-style base", function () {
        expect(joinPath("C:\\dict\\", "base.dat.gz")).to.equal("C:\\dict/base.dat.gz");
    });

    it("returns the filename when the base is empty", function () {
        expect(joinPath("", "base.dat.gz")).to.equal("base.dat.gz");
    });
});
