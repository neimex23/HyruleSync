'use strict';
// Retain the documented node tests/*.cjs entry points after moving to React tests.
module.exports = function run(suite) {
  const cp = require('node:child_process'), path = require('node:path');
  const result = cp.spawnSync(process.execPath, [path.join(__dirname, '../node_modules/vitest/vitest.mjs'), 'run', `tests/web/${suite}.test.jsx`], { cwd: path.join(__dirname, '..'), stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
};
