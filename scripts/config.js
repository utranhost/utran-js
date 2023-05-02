'use strict';

const packageName = 'utran'
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const eslint = require('@rollup/plugin-eslint');
const replace = require('@rollup/plugin-replace');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const terser = require('@rollup/plugin-terser');
const fileSize = require('rollup-plugin-filesize');
const progress = require('rollup-plugin-progress');

const paths = require('./paths');

const packageJson = require(paths.packageJson);

const version = packageJson.version;

const plugins = (env) => [
  typescript(),
  eslint({
    throwOnError: true
  }),
  nodeResolve(),
  commonjs(),
  progress(),
  replace({
    preventAssignment: true,
    values: {
      '__BUILD_ENV__': env,
      '__BUILD_VERSION__': version
    }
  }),
  fileSize(),
  env === 'production' && terser({
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true
    }
  })
];


function inputConfig (env,isH5=false) {
  // rollup配置
  const opts = {plugins: plugins(env),external:['ws']};  //external: ['ws'],  //不打包ws模块  ,globals:{ws:'WebSocket'}
  if(isH5){
    opts.input = paths.h5  
    return opts
  }
  opts.input = paths.index
  return opts
}


function outputConfig (env, fileName,isH5=false) {
  const isSourcemap = isH5?false:env === 'development';
  const file = isH5?paths.resolvePath(fileName, paths.buildH5Dir):paths.resolvePath(fileName, paths.buildDir)
  return {
    file,
    format: 'umd',
    name: packageName,
    sourcemap: isSourcemap,
    indent: false,
    banner: `
/**
 * @license
 * ${packageName} v${version}
 * Copyright (c) 2023 ${packageName}.
 * Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
 */`.trim(),
  };
}

module.exports = { 
  packageName,
  inputConfig,
  outputConfig
};