// Execute repository TypeScript helpers without depending on a Vite build.
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
let ts; try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const cache = new Map();
function loadTs(relativePath) {
  const full = path.resolve(__dirname, '..', relativePath);
  if (cache.has(full)) return cache.get(full).exports;
  const m = new Module(full, module);
  m.filename = full;
  m.paths = Module._nodeModulePaths(path.dirname(full));
  cache.set(full, m);
  m.require = function(name) {
    if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(full), name + (path.extname(name) ? '' : '.ts'));
      if (fs.existsSync(target) && target.endsWith('.ts')) return loadTs(path.relative(path.resolve(__dirname,'..'), target));
    }
    return Module.prototype.require.call(m, name);
  };
  m._compile(ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    fileName: full, compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}
  }).outputText, full);
  return m.exports;
}
module.exports = {loadTs};
