const fs=require('fs');const path=require('path');
const sharp=require('C:/Users/irush/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=__dirname;const screens=require('./screens.json');
(async()=>{
 fs.mkdirSync(path.join(root,'png'),{recursive:true});
 for(const s of screens)await sharp(path.join(root,s.file)).png().toFile(path.join(root,'png',`${s.mode}-${s.id}.png`));
 for(const mode of ['light','dark']){
  const items=screens.filter(s=>s.mode===mode);const panels=[];
  for(let i=0;i<items.length;i++)panels.push({input:await sharp(path.join(root,items[i].file)).resize(273,591).png().toBuffer(),left:28+i*297,top:60});
  const label=`<svg width="1814" height="60"><text x="28" y="34" font-family="Arial" font-size="19" fill="${mode==='dark'?'#F7F3EE':'#221408'}">SolarCoop / ${mode} / Opening → Loading → Onboarding → Welcome</text></svg>`;
  panels.push({input:Buffer.from(label),left:0,top:0});
  await sharp({create:{width:1814,height:679,channels:4,background:mode==='dark'?'#292623':'#F0E9E0'}}).composite(panels).png().toFile(path.join(root,`overview-${mode}.png`));
 }
 console.log('Rendered and parsed all 12 SVG screens.');
})();
