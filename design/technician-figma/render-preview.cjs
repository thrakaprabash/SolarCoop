const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/irush/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir = __dirname;
async function main() {
  const screens = JSON.parse(fs.readFileSync(path.join(dir, 'screens.json'))).screens;
  const output = path.join(dir, 'rendered');
  fs.mkdirSync(output, { recursive: true });
  for (const s of screens) await sharp(path.join(dir, 'svg', s.theme + '-' + s.id + '.svg')).png().toFile(path.join(output, s.theme + '-' + s.id + '.png'));
  const ids = ['board-active','ticket-active','closure-ready','diagnostics-expanded','health','profile','settings','new-fault'];
  for (const theme of ['light','dark']) {
    const composite = [];
    const vectors = ['<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="2070" viewBox="0 0 1320 2070"><rect width="1320" height="2070" fill="#10151C"/>'];
    for (let i=0;i<ids.length;i++) {
      const id = ids[i], s = screens.find(s=>s.id===id&&s.theme===theme);
      const svg = '<svg width="300" height="45"><text x="0" y="21" font-family="Segoe UI" font-size="13" fill="#EEF3F8">'+s.name.replace(/&/g,'&amp;')+'</text></svg>';
      const x = 30+(i%4)*320, y=28+Math.floor(i/4)*1020;
      composite.push({input:Buffer.from(svg),left:x,top:y});
      vectors.push('<g transform="translate('+x+' '+y+')">'+svg.replace('<svg width="300" height="45">','<svg width="300" height="45">')+'</g>');
      vectors.push('<g transform="translate('+x+' '+(y+45)+') scale('+(280/390)+')">'+fs.readFileSync(path.join(dir,'svg',theme+'-'+id+'.svg'),'utf8')+'</g>');
      composite.push({input:await sharp(path.join(output,theme+'-'+id+'.png')).resize({width:280}).toBuffer(),left:x,top:y+45});
    }
    await sharp({create:{width:1320,height:2070,channels:4,background:'#10151C'}}).composite(composite).png().toFile(path.join(dir,'overview-'+theme+'.png'));
    vectors.push('</svg>');
    fs.writeFileSync(path.join(dir,'overview-'+theme+'.svg'),vectors.join(''));
  }
  console.log('Rendered all '+screens.length+' SVGs and two overview images.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
