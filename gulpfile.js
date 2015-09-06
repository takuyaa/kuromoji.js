var fs = require("fs"),
    gulp = require("gulp"),
    clean = require("gulp-clean"),
    merge = require("event-stream").merge,
    sequence = require("run-sequence"),
    jshint = require("gulp-jshint"),
    browserify = require("browserify"),
    source = require("vinyl-source-stream"),
    gzip = require("gulp-gzip"),
    gunzip = require("gulp-gunzip"),
//    untar = require("gulp-untar"),
    remotesrc = require("gulp-remote-src"),
    sourcemaps = require("gulp-sourcemaps"),
    mocha = require("gulp-mocha"),
    istanbul = require("gulp-istanbul"),
    webserver = require('gulp-webserver'),
    jsdoc = require("gulp-jsdoc");


gulp.task("clean", function () {
    return merge(
        gulp.src("./dist/browser/kuromoji.js")
            .pipe(clean()),
        gulp.src("./dist/node/")
            .pipe(clean())
    );
});


gulp.task("build", function () {
    if (!fs.existsSync("./dist")) {
        fs.mkdirSync("./dist");
    }
    if (!fs.existsSync("./dist/browser/")) {
        fs.mkdirSync("./dist/browser/");
    }
    if (!fs.existsSync("./dist/node/")) {
        fs.mkdirSync("./dist/node/");
    }

    gulp.src("./src/**/*.js")
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("./dist/node/"));

    browserify({ entries: [ "./src/kuromoji.js" ] })
        .bundle()
        .pipe(source("kuromoji.js"))
        .pipe(gulp.dest("./dist/browser/"));

    console.log("Build done");
});


gulp.task("watch", function () {
    gulp.watch([ "./src/**/*.js", "./test/**/*.js" ], [ "lint", "build", "jsdoc" ]);
});


gulp.task("clean-dict", function () {
    gulp.src("./dist/dict/")
        .pipe(clean());
});


gulp.task("copy-dict", function () {
    if (!fs.existsSync("./dict-input/")) {
        fs.mkdirSync("./dict-input/");
    }

    return remotesrc(["mecab-ipadic-2.7.0-20070801.tar.gz"], {
        base: "http://atilika.com/releases/mecab-ipadic/"
//        base: "http://jaist.dl.sourceforge.net/project/mecab/mecab-ipadic/2.7.0-20070801/mecab-ipadic-2.7.0-20070801.tar.gz"
    })
        .pipe(gunzip())
//        .pipe(untar())  // TODO Fail to untar
        .pipe(gulp.dest("./dict-input/"));
});


gulp.task("build-dict", function () {
    if (!fs.existsSync("./dist/")) {
        fs.mkdirSync("./dist/");
    }
    if (!fs.existsSync("./dist/dict/")) {
        fs.mkdirSync("./dist/dict/");
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

    var dic = require("./scripts/build-dict.js");

    var base_buffer = toBuffer(dic.trie.bc.getBaseBuffer()),
        check_buffer = toBuffer(dic.trie.bc.getCheckBuffer()),
        token_info_buffer = toBuffer(dic.token_info_dictionary.dictionary.buffer),
        tid_pos_buffer = toBuffer(dic.token_info_dictionary.pos_buffer.buffer),
        tid_map_buffer = toBuffer(dic.token_info_dictionary.targetMapToBuffer()),
        connection_costs_buffer = toBuffer(dic.connection_costs.buffer),
        unk_buffer = toBuffer(dic.unknown_dictionary.dictionary.buffer),
        unk_pos_buffer = toBuffer(dic.unknown_dictionary.pos_buffer.buffer),
        unk_map_buffer = toBuffer(dic.unknown_dictionary.targetMapToBuffer()),
        char_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.character_category_map),
        char_compat_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.compatible_category_map),
        invoke_definition_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.invoke_definition_map.toBuffer());

    fs.writeFileSync("./dist/dict/base.dat", base_buffer);
    fs.writeFileSync("./dist/dict/check.dat", check_buffer);
    fs.writeFileSync("./dist/dict/tid.dat", token_info_buffer);
    fs.writeFileSync("./dist/dict/tid_pos.dat", tid_pos_buffer);
    fs.writeFileSync("./dist/dict/tid_map.dat", tid_map_buffer);
    fs.writeFileSync("./dist/dict/cc.dat", connection_costs_buffer);
    fs.writeFileSync("./dist/dict/unk.dat", unk_buffer);
    fs.writeFileSync("./dist/dict/unk_pos.dat", unk_pos_buffer);
    fs.writeFileSync("./dist/dict/unk_map.dat", unk_map_buffer);
    fs.writeFileSync("./dist/dict/unk_char.dat", char_map_buffer);
    fs.writeFileSync("./dist/dict/unk_compat.dat", char_compat_map_buffer);
    fs.writeFileSync("./dist/dict/unk_invoke.dat", invoke_definition_map_buffer);

    gulp.src("./dist/dict/*.dat")
        .pipe(gzip())
        .pipe(gulp.dest("./dist/dict/"));

    gulp.src("./dist/dict/*.dat")
        .pipe(clean());
});


gulp.task("test", function () {
    return gulp.src("./test/**/*.js", { read: false })
        .pipe(mocha({ reporter: "list" }));
});


gulp.task("coverage", function (done) {
    gulp.src(["./src/**/*.js"])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on("finish", function () {
            gulp.src(["test/**/*.js"])
                .pipe(mocha({ reporter: "list" }))
                .pipe(istanbul.writeReports())
                .on("end", done);
        });
});


gulp.task("lint", function () {
    return gulp.src(["./src/**/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter("default"));
});


gulp.task("webserver", function() {
    gulp.src("./")
        .pipe(webserver({
            port: 8000,
            livereload: true,
            directoryListing: true
        }));
});


gulp.task("jsdoc", function () {
    gulp.src(["./src/**/*.js"])
        .pipe(jsdoc("./jsdoc"));
});


gulp.task("default", function () {
    sequence("lint", "clean", "build", "jsdoc");
});
