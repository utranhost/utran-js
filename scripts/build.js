'use strict';

const {ish5} = require('yargs').default({ish5:false}).argv;

const rollup = require('rollup');

const chalk = require('chalk');

const { inputConfig, outputConfig,packageName } = require('./config');

const env = process.env.NODE_ENV;

async function build() {
  const fileName = ish5? env === 'development' ? `${packageName}.h5.js` : `${packageName}.h5.min.js` 
                        :env === 'development' ? `${packageName}.js` : `${packageName}.min.js`

  console.log(`Creating an optimized ${chalk.blue(`${fileName}`)} build...\n`);
  const input = inputConfig(env,ish5);
  // console.log(`${fileName},输入配置:\n`)
  // console.log(input)
  try {
    const bundle = await rollup.rollup(input);

    console.log('\n\nFile info: ');

    const output = outputConfig(env, fileName,ish5);
    // console.log(`${fileName}输出配置:\n`)
    // console.log(output)
    await bundle.write(output);

    console.log(chalk.green(`\nCompiled ${fileName} successfully.\n`));
  } catch (err) {
    console.log(`\n\n${chalk.red(err)}\n`);
    console.log(chalk.red(`Failed to compile ${fileName}.\n`));
    process.exit(1);
  }
}

build();