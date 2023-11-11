// https://cly7796.net/blog/other/migrate-gulpfile-js-to-es-modules/

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import pkg_gulp from 'gulp';
const { dest, watch, src, series } = pkg_gulp;
import {deleteAsync} from 'del';
import merge from 'merge-stream';
import jshint from 'gulp-jshint';
const { reporter: _reporter } = jshint;
import browserify from "browserify";
import source from "vinyl-source-stream";
import gzip from "gulp-gzip";
import mocha from "gulp-mocha";
import jsdoc from "gulp-jsdoc3";
import ghPages from 'gulp-gh-pages-will';
import bump from 'gulp-bump';
import connect from 'gulp-connect';
import minimist from 'minimist';
import IPADic from 'mecab-ipadic-seed';
import kuromoji from './src/kuromoji.js';

const argv = minimist(process.argv.slice(2));
import pkg_git from 'gulp-git';
const { add, commit, tag } = pkg_git;

export const clean_task = (done) => {
  return deleteAsync([
    "publish/",
    "coverage/",
    "build/",
    "publish/"
  ]);
}

export const build_task = series( clean_task, function build() {
  return browserify({
    entries: [ "src/kuromoji.js" ],
    standalone: "kuromoji" // window.kuromoji
  })
    .bundle()
    .pipe(source("kuromoji.js"))
    .pipe(dest("build/"));
});

export const watch_task = () => {
  watch([ "src/**/*.js", "test/**/*.js" ], series(lint_task, build_task, jsdoc_task));
};

const clean_dict_task = () => {
  return deleteAsync([ "dict/" ]);
};

export const create_dat_files_task = async () => {
  if (!existsSync("dict/")) {
    mkdirSync("dict/");
  }

  // To node.js Buffer
  function toBuffer (typed) {
    const ab = typed.buffer;
    const buffer = new Buffer(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buffer.length; ++i) {
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
    console.log('Finished to read token info dictionaries');
  });

  // Build connection costs matrix
  const matrixDefPromise = dic.readMatrixDef((line) => {
    builder.putCostMatrixLine(line);
  }).then(() => {
    console.log('Finished to read matrix.def');
  });

  // Build unknown dictionary
  const unkDefPromise = dic.readUnkDef((line) => {
    builder.putUnkDefLine(line);
  }).then(() => {
    console.log('Finished to read unk.def');
  });

  // Build character definition dictionary
  const charDefPromise = dic.readCharDef((line) => {
    builder.putCharDefLine(line);
  }).then(() => {
    console.log('Finished to read char.def');
  });

  // Build kuromoji.js binary dictionary
  await Promise.all([tokenInfoPromise, matrixDefPromise, unkDefPromise, charDefPromise]);
  console.log('Finished to read all seed dictionary files');
  console.log('Building binary dictionary ...');
  const dic_1 = builder.build();
  const base_buffer = toBuffer(dic_1.trie.bc.getBaseBuffer());
  const check_buffer = toBuffer(dic_1.trie.bc.getCheckBuffer());
  const token_info_buffer = toBuffer(dic_1.token_info_dictionary.dictionary.buffer);
  const tid_pos_buffer = toBuffer(dic_1.token_info_dictionary.pos_buffer.buffer);
  const tid_map_buffer = toBuffer(dic_1.token_info_dictionary.targetMapToBuffer());
  const connection_costs_buffer = toBuffer(dic_1.connection_costs.buffer);
  const unk_buffer = toBuffer(dic_1.unknown_dictionary.dictionary.buffer);
  const unk_pos_buffer = toBuffer(dic_1.unknown_dictionary.pos_buffer.buffer);
  const unk_map_buffer = toBuffer(dic_1.unknown_dictionary.targetMapToBuffer());
  const char_map_buffer = toBuffer(dic_1.unknown_dictionary.character_definition.character_category_map);
  const char_compat_map_buffer = toBuffer(dic_1.unknown_dictionary.character_definition.compatible_category_map);
  const invoke_definition_map_buffer = toBuffer(dic_1.unknown_dictionary.character_definition.invoke_definition_map.toBuffer());
  writeFileSync("dict/base.dat", base_buffer);
  writeFileSync("dict/check.dat", check_buffer);
  writeFileSync("dict/tid.dat", token_info_buffer);
  writeFileSync("dict/tid_pos.dat", tid_pos_buffer);
  writeFileSync("dict/tid_map.dat", tid_map_buffer);
  writeFileSync("dict/cc.dat", connection_costs_buffer);
  writeFileSync("dict/unk.dat", unk_buffer);
  writeFileSync("dict/unk_pos.dat", unk_pos_buffer);
  writeFileSync("dict/unk_map.dat", unk_map_buffer);
  writeFileSync("dict/unk_char.dat", char_map_buffer);
  writeFileSync("dict/unk_compat.dat", char_compat_map_buffer);
  writeFileSync("dict/unk_invoke.dat", invoke_definition_map_buffer);
};

export const compress_dict_task = () => {
  return src("dict/*.dat")
    .pipe(gzip())
    .pipe(dest("dict/"));
};

export const clean_dat_files_task = () => {
    return deleteAsync([ "dict/*.dat" ]);
};

export const build_dict_task = series(
  build_task,
  clean_dict_task,
  create_dat_files_task,
  compress_dict_task,
  clean_dat_files_task
);

export const test_task = series(build_task, function test() {
  return src("test/**/*.js", { read: false })
    .pipe(mocha({ reporter: "list" }));
});

export const lint_task = () => {
  return src([ "src/**/*.js" ])
    .pipe(jshint())
    .pipe(_reporter("default"));
};

const clean_jsdoc_task = () => {
  return deleteAsync([ "publish/jsdoc/" ]);
};

export const jsdoc_task = series(clean_jsdoc_task, (cb) => {
  const config = JSON.parse(readFileSync('./jsdoc.json', 'utf8'));
  src([ "src/**/*.js" ], {read: false})
    .pipe(jsdoc(config, cb));
});

const clean_demo_task = () => {
  return deleteAsync([ "publish/demo/" ]);
};

export const copy_demo_task = series(clean_demo_task, build_task, function copy_demo() {
  return merge(
    src('demo/**/*')
      .pipe(dest('publish/demo/')),
    src('build/**/*')
      .pipe(dest('publish/demo/kuromoji/build/')),
    src('dict/**/*')
      .pipe(dest('publish/demo/kuromoji/dict/')));
});

export const webserver_task = series(jsdoc_task, () => {
  connect.server({
    root: 'publish/',
    port: 8000,
    livereload: true,
    directoryListing: true
  })
});

export const deploy_task = series(jsdoc_task, () => {
  return src('publish/**/*')
    .pipe(ghPages());
});

export const version_task = () => {
  let type = 'patch';
  if (argv['minor']) {
    type = 'minor';
  }
  if (argv['major']) {
    type = 'major';
  }
  if (argv['prerelease']) {
    type = 'prerelease';
  }
  return src([ './bower.json', './package.json' ])
    .pipe(bump({ type: type }))
    .pipe(dest('./'));
};

const release_commit_task = () => {
  const version = JSON.parse(readFileSync('./package.json', 'utf8')).version;
  return src('.')
    .pipe(add())
    .pipe(commit(`chore: release ${version}`));
};

const release_tag_task = (callback) => {
  const version = JSON.parse(readFileSync('./package.json', 'utf8')).version;
  tag(version, `${version} release`, function (error) {
    if (error) {
      return callback(error);
    }
    callback();
  });
};

export const release_task = series(test_task, () => {
  series(release_commit_task, release_tag_task);
});
