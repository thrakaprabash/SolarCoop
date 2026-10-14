const fs = require('fs'), path = require('path');
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
function files(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
const targets = ['App.js', ...files('src').filter(f => f.endsWith('.js'))];
let issues = [];
for (const file of targets) {
  let source = fs.readFileSync(file,'utf8');
  // Explicit white icons on filled actions remain white in both appearances.
  if (!file.endsWith('common/Header.js')) {
    const fixed = source.replaceAll('themeColor("#FFFFFF", "color")', '"#FFFFFF"');
    if (fixed !== source) { fs.writeFileSync(file,fixed); source = fixed; }
  }
  const ast = parser.parse(source,{sourceType:'module',plugins:['jsx']});
  traverse(ast, { ReferencedIdentifier(p) {
    if (['styles','baseStyles','themeColor','COLORS','GLASS','TECH'].includes(p.node.name) && !p.scope.getBinding(p.node.name)) issues.push(`${file}:${p.node.loc.start.line} unbound ${p.node.name}`);
  }});
}
if (issues.length) { console.error(issues.join('\n')); process.exit(1); }
console.log('All app modules parse and theme references resolve.');
