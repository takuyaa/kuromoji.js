"use strict";

const fs = require("fs");
const gulp = require("gulp");
const del = require('del');
const sequence = require("run-sequence");
const jshint = require("gulp-jshint");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const gzip = require("gulp-gzip");
const sourcemaps = require("gulp-sourcemaps");
const mocha = require("gulp-mocha");
const istanbul = require("gulp-istanbul");
const webserver = require('gulp-webserver');
const jsdoc = require("gulp-jsdoc");
const bower = require('gulp-bower');
const ghPages = require('gulp-gh-pages');

gulp.task("clean", (done) => {
    return del([ "dist/browser/", "dist/node/", "publish/" ], done);
});

gulp.task("build", () => {
    if (!fs.existsSync("dist")) {
        fs.mkdirSync("dist");
    }
    if (!fs.existsSync("dist/browser/")) {
        fs.mkdirSync("dist/browser/");
    }
    if (!fs.existsSync("dist/node/")) {
        fs.mkdirSync("dist/node/");
    }

    gulp.src("src/**/*.js")
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist/node/"));

    const b = browserify({
        entries: [ "src/kuromoji.js" ],
        standalone: "kuromoji" // window.kuromoji
    });
    // replace NodeDictionaryLoader to BrowserDictionaryLoader
    b.require(__dirname + "/src/loader/BrowserDictionaryLoader.js", { expose: "loader/NodeDictionaryLoader.js" });
    return b.bundle()
        .pipe(source("kuromoji.js"))
        .pipe(gulp.dest("dist/browser/"));
});

gulp.task("watch", () => {
    gulp.watch([ "src/**/*.js", "test/**/*.js" ], [ "lint", "build", "jsdoc" ]);
});

gulp.task("clean-dict", (done) => {
    return del([ "dist/dict/" ], done);
});

gulp.task("create-dat-files", (done) => {
    const IPADic = require('mecab-ipadic-seed');
    const kuromoji = require("./dist/node/kuromoji.js");

    if (!fs.existsSync("dist/")) {
        fs.mkdirSync("dist/");
    }
    if (!fs.existsSync("dist/dict/")) {
        fs.mkdirSync("dist/dict/");
    }

    // To node.js Buffer
    function toBuffer (typed) {
        var ab = typed.buffer;
        var buffer = new Buffer(ab.byteLength);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buffer.length; ++i) {
            buffer[i] = view[i];
        }
        return buffer;
    }

    const dic = new IPADic();
    const builder = kuromoji.dictionaryBuilder();

    // Build token info dictionary
    const tokenInfoPromise = dic.readTokenInfo((line) => {
        builder.addTokenInfoDictionary(line);
    }).then(() => {
        console.log('Finishied to read token info dics');
    });

    // Build connection costs matrix
    const matrixDefPromise = dic.readMatrixDef((line) => {
        builder.putCostMatrixLine(line);
    }).then(() => {
        console.log('Finishied to read matrix.def');
    });

    // Build unknown dictionary
    const unkDefPromise = dic.readUnkDef((line) => {
        builder.putUnkDefLine(line);
    }).then(() => {
        console.log('Finishied to read unk.def');
    });

    // Build character definition dictionary
    const charDefPromise = dic.readCharDef((line) => {
        builder.putCharDefLine(line);
    }).then(() => {
        console.log('Finishied to read char.def');
    });

    // Build kuromoji.js binary dictionary
    Promise.all([ tokenInfoPromise, matrixDefPromise, unkDefPromise, charDefPromise ]).then(() => {
        console.log('Finishied to read all seed dictionary files');
        console.log('Building binary dictionary ...');
        return builder.build();
    }).then((dic) => {
        const base_buffer = toBuffer(dic.trie.bc.getBaseBuffer());
        const check_buffer = toBuffer(dic.trie.bc.getCheckBuffer());
        const token_info_buffer = toBuffer(dic.token_info_dictionary.dictionary.buffer);
        const tid_pos_buffer = toBuffer(dic.token_info_dictionary.pos_buffer.buffer);
        const tid_map_buffer = toBuffer(dic.token_info_dictionary.targetMapToBuffer());
        const connection_costs_buffer = toBuffer(dic.connection_costs.buffer);
        const unk_buffer = toBuffer(dic.unknown_dictionary.dictionary.buffer);
        const unk_pos_buffer = toBuffer(dic.unknown_dictionary.pos_buffer.buffer);
        const unk_map_buffer = toBuffer(dic.unknown_dictionary.targetMapToBuffer());
        const char_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.character_category_map);
        const char_compat_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.compatible_category_map);
        const invoke_definition_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.invoke_definition_map.toBuffer());

        fs.writeFileSync("dist/dict/base.dat", base_buffer);
        fs.writeFileSync("dist/dict/check.dat", check_buffer);
        fs.writeFileSync("dist/dict/tid.dat", token_info_buffer);
        fs.writeFileSync("dist/dict/tid_pos.dat", tid_pos_buffer);
        fs.writeFileSync("dist/dict/tid_map.dat", tid_map_buffer);
        fs.writeFileSync("dist/dict/cc.dat", connection_costs_buffer);
        fs.writeFileSync("dist/dict/unk.dat", unk_buffer);
        fs.writeFileSync("dist/dict/unk_pos.dat", unk_pos_buffer);
        fs.writeFileSync("dist/dict/unk_map.dat", unk_map_buffer);
        fs.writeFileSync("dist/dict/unk_char.dat", char_map_buffer);
        fs.writeFileSync("dist/dict/unk_compat.dat", char_compat_map_buffer);
        fs.writeFileSync("dist/dict/unk_invoke.dat", invoke_definition_map_buffer);

        done();
    });
});

gulp.task("compress-dict", () => {
    return gulp.src("dist/dict/*.dat")
        .pipe(gzip())
        .pipe(gulp.dest("dist/dict/"));
});

gulp.task("clean-dat-files", (done) => {
    return del([ "dist/dict/*.dat" ], done);
});

gulp.task("build-dict", [ "build", "clean-dict" ], () => {
    sequence("create-dat-files", "compress-dict", "clean-dat-files");
});

gulp.task("test", [ "build" ], () => {
    return gulp.src("test/**/*.js", { read: false })
        .pipe(mocha({ reporter: "list" }));
});

gulp.task("coverage", (done) => {
    gulp.src([ "src/**/*.js" ])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on("finish", () => {
            gulp.src([ "test/**/*.js" ])
                .pipe(mocha({ reporter: "mocha-lcov-reporter" }))
                .pipe(istanbul.writeReports())
                .on("end", done);
        });
});

gulp.task("lint", () => {
    return gulp.src([ "src/**/*.js" ])
        .pipe(jshint())
        .pipe(jshint.reporter("default"));
});

gulp.task("clean-jsdoc", (done) => {
    return del([ "publish/jsdoc/" ], done);
});

gulp.task("jsdoc", [ "clean-jsdoc" ], () => {
    return gulp.src([ "src/**/*.js" ])
        .pipe(jsdoc("publish/jsdoc"));
});

gulp.task("clean-demo", (done) => {
    return del([ "publish/demo/" ], done);
});

gulp.task("copy-demo", () => {
    return gulp.src('demo/**/*')
        .pipe(gulp.dest('publish/demo/'));
});

gulp.task("build-demo", [ "clean-demo", "copy-demo" ], () => {
    return bower({ cwd: 'publish/demo/' });
});

gulp.task("webserver", [ "build-demo", "jsdoc" ], () => {
    gulp.src("publish/")
        .pipe(webserver({
            port: 8000,
            livereload: true,
            directoryListing: true
        }));
});

gulp.task("deploy", [ "build-demo", "jsdoc" ], () => {
    return gulp.src('publish/**/*')
        .pipe(ghPages());
});

gulp.task("default", () => {
    sequence("lint", "clean", "build", "jsdoc");
});
