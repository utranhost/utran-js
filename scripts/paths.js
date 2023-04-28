'use strict';

const path = require('path');
const fs = require('fs');

const root = fs.realpathSync(process.cwd());
const resolvePath = (relativePath, rootDirectory = root) => path.resolve(rootDirectory, relativePath);

module.exports = {
  resolvePath,
  buildDir: resolvePath('lib'),
  index: resolvePath('src/index.ts'),
  h5: resolvePath('src/h5.ts'),
  packageJson: resolvePath('package.json')
};