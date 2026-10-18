// Structural smoke check. This does not replace running the plugin in Figma.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname,'screens.json')));
const keys = new Set(data.screens.map(s=>s.theme+':'+s.id));
let links=0;
for (const s of data.screens) for (const op of s.ops) {
  assert(Number.isFinite(op.x)&&Number.isFinite(op.y)&&op.w>0&&op.h>0, s.id+' has invalid geometry');
  assert(op.y>=0&&op.y+op.h<=s.h,s.id+' overflows vertically: '+op.name);
  assert(op.x>=0&&op.x+op.w<=s.w,s.id+' overflows horizontally: '+op.name);
  if (op.kind==='hotspot') { assert(keys.has((op.targetTheme||s.theme)+':'+op.target),'Unresolved target '+op.target); links++; }
}
const nodes=[];
function node(type) {
  const n={type,id:'node-'+nodes.length,children:[],resize(w,h){assert(w>0&&h>0);this.width=w;this.height=h;},appendChild(child){this.children.push(child);child.parent=this;},setPluginData(){},async setReactionsAsync(reactions){this.reactions=reactions;}};
  nodes.push(n);return n;
}
let done;
const completion = new Promise(resolve=>{done=resolve;});
const fonts=['Regular','Medium','Semi Bold','Bold','Extra Bold'].map(style=>({fontName:{family:'Inter',style}}));
const figma={
  async listAvailableFontsAsync(){return fonts;},async loadFontAsync(){},
  createPage(){return node('PAGE');},async setCurrentPageAsync(page){this.currentPage=page;},
  createFrame(){return node('FRAME');},createRectangle(){return node('RECTANGLE');},createEllipse(){return node('ELLIPSE');},createText(){return node('TEXT');},createNodeFromSvg(){return node('VECTOR');},
  viewport:{scrollAndZoomIntoView(){}},closePlugin(message){done(message);}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'plugin/code.js'),'utf8'),{figma,console,Date,Map});
completion.then(message=>{
  assert(!message.startsWith('Import stopped'),message);
  assert.equal(nodes.filter(n=>n.type==='FRAME').length,data.screens.length);
  assert.equal(nodes.filter(n=>n.reactions).length,links);
  assert.equal(figma.currentPage.selection.length,1);
  console.log(data.screens.length+' frames checked; '+links+' prototype links resolved; native importer structural smoke check passed.');
}).catch(error=>{console.error(error);process.exitCode=1;});
