// Runs locally in Figma Desktop's development-plugin environment.
// DATA and buildInteractiveComponents are supplied by the package generator.
function createAutoLayout(direction='VERTICAL') {
  const frame=figma.createFrame();frame.layoutMode=direction;frame.fills=[];return frame;
}
async function loadNodeFonts(node) {
  const fonts=new Map();if(node.type==='TEXT')for(const s of node.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);
  if('findAllWithCriteria'in node)for(const text of node.findAllWithCriteria({types:['TEXT']}))for(const s of text.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);
  await Promise.all([...fonts.values()].map(font=>figma.loadFontAsync(font)));
}
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const closeColor=(a,b)=>a&&Math.abs(a.r-b.r)<0.002&&Math.abs(a.g-b.g)<0.002&&Math.abs(a.b-b.b)<0.002;
const aliases={cardRaised:'raised',textSecondary:'secondary',textMuted:'muted'};
function tokenKey(key){return aliases[key]||key;}
async function main() {
  if(figma.fileKey&&figma.fileKey!==DATA.fileKey)throw new Error('Open the original Solar-Coop Figma design file before running.');
  const page=await figma.getNodeByIdAsync(DATA.pageId);
  if(!page||page.type!=='PAGE')throw new Error('The Technican Dahboard page was not found in this file.');
  const darkFrames=new Map();
  for(const record of DATA.frames){const frame=await figma.getNodeByIdAsync(record.id);if(!frame||frame.type!=='FRAME'||frame.parent.id!==page.id)throw new Error('A technician screen was moved or removed: '+record.key);darkFrames.set(record.key,frame);await loadNodeFonts(frame);}
  await figma.setCurrentPageAsync(page);
  const complete=page.children.find(n=>n.name==='Technician / Prototype guide');
  if(complete){figma.viewport.scrollAndZoomIntoView([darkFrames.get('board-active')]);figma.closePlugin('Both-theme prototype was already completed.');return;}
  const existingSets=page.children.filter(n=>n.type==='COMPONENT_SET'&&/^Technician \/ (Interactive checklist|Sound control|Test control) \//.test(n.name));
  let components;
  if(existingSets.length===6){
    components={checklistVariants:{dark:{},light:{}},buttonVariants:{}};
    for(const set of existingSets){const theme=set.name.endsWith('dark')?'dark':'light';if(set.name.includes('Interactive checklist'))for(const c of set.children){const m=c.name.match(/Context=([^,]+), Checked=(\d+)/);components.checklistVariants[theme][m[1]+':'+m[2]]=c.id;}else{const family=set.name.includes('Sound control')?'Sound':'Test';components.buttonVariants[theme+':'+family]={};for(const c of set.children)components.buttonVariants[theme+':'+family][c.name.replace('State=','')]=c.id;}}
  }else if(existingSets.length)throw new Error('A partial previous run is present. Undo that plugin run before retrying.');
  else components=await buildInteractiveComponents();
  const darkToLightComponent=new Map();
  for(const [key,id]of Object.entries(components.checklistVariants.dark))darkToLightComponent.set(id,components.checklistVariants.light[key]);
  for(const family of ['Sound','Test'])for(const [key,id]of Object.entries(components.buttonVariants['dark:'+family]))darkToLightComponent.set(id,components.buttonVariants['light:'+family][key]);
  const allVars=await figma.variables.getLocalVariablesAsync('COLOR');
  const collections=await figma.variables.getLocalVariableCollectionsAsync();
  const darkCollection=collections.find(c=>c.name==='SolarCoop Technician · Dark');
  const lightCollection=collections.find(c=>c.name==='SolarCoop Technician · Light');
  const lightVars=new Map(allVars.filter(v=>v.variableCollectionId===lightCollection.id).map(v=>[v.name,v]));
  const variablesById=new Map(allVars.map(v=>[v.id,v]));
  function matchColor(color,node) {
    if(closeColor(color,rgb(DATA.palettes.dark.bg))&&node.type!=='TEXT'&&node.width<40&&node.height<40)return 'onAccent';
    const found=Object.entries(DATA.palettes.dark).find(([key,h])=>key!=='onAccent'&&closeColor(color,rgb(h)));
    return found?found[0]:null;
  }
  function mapPaint(paint,node) {
    if(paint.type==='SOLID'){
      const bound=paint.boundVariables&&paint.boundVariables.color;
      const source=bound&&variablesById.get(bound.id);
      const name=source?source.name:tokenKey(matchColor(paint.color,node)||'');
      const variable=lightVars.get(name);if(variable)return figma.variables.setBoundVariableForPaint({...paint,color:variable.valuesByMode[lightCollection.defaultModeId]},'color',variable);
    }else if(paint.type.startsWith('GRADIENT_'))return {...paint,gradientStops:paint.gradientStops.map(stop=>{const key=matchColor(stop.color,node);return key?{...stop,color:{...rgb(DATA.palettes.light[key]),a:stop.color.a}}:stop;})};
    return paint;
  }
  async function makeLight(node) {
    const nodes=[node,...node.findAll(()=>true)];
    for(const n of nodes){if('fills'in n&&Array.isArray(n.fills))n.fills=n.fills.map(p=>mapPaint(p,n));if('strokes'in n&&Array.isArray(n.strokes))n.strokes=n.strokes.map(p=>mapPaint(p,n));}
  }
  const notice=page.children.find(n=>n.type==='COMPONENT'&&n.name==='Technician / State notice');
  if(notice){await loadNodeFonts(notice);const lightNotice=notice.clone();lightNotice.name='Technician / State notice / Light';page.appendChild(lightNotice);lightNotice.x=2020;lightNotice.y=9800;await makeLight(lightNotice);darkToLightComponent.set(notice.id,lightNotice.id);}
  const lightFrames=new Map();const darkToLightNodes=new Map();
  function pairNodes(dark,light){darkToLightNodes.set(dark.id,light.id);if('children'in dark&&'children'in light)for(let i=0;i<dark.children.length;i++)pairNodes(dark.children[i],light.children[i]);}
  for(let i=0;i<DATA.order.length;i++){
    const key=DATA.order[i];const dark=darkFrames.get(key);dark.x=400+(i%7)*460;dark.y=500+Math.floor(i/7)*1040;
    const light=dark.clone();light.name='light-'+key+' 1';page.appendChild(light);light.x=dark.x;light.y=dark.y+5000;light.setExplicitVariableModeForCollection(lightCollection,lightCollection.defaultModeId);pairNodes(dark,light);lightFrames.set(key,light);
  }
  for(const light of lightFrames.values()){
    for(const inst of light.findAllWithCriteria({types:['INSTANCE']})){
      const main=await inst.getMainComponentAsync();if(main&&darkToLightComponent.has(main.id)){const texts=inst.findAllWithCriteria({types:['TEXT']}).map(n=>n.characters);inst.swapComponent(await figma.getNodeByIdAsync(darkToLightComponent.get(main.id)));const updated=inst.findAllWithCriteria({types:['TEXT']});for(let i=0;i<texts.length&&i<updated.length;i++){await loadNodeFonts(updated[i]);updated[i].characters=texts[i];}}
    }
    await makeLight(light);
    // Reconnect cloned navigation to matching light screens, not their dark sources.
    const inInstance=n=>{for(let p=n;p&&p!==light;p=p.parent)if(p.type==='INSTANCE')return true;return false;};
    for(const n of light.findAll(()=>true))if(!inInstance(n)&&'reactions'in n&&n.reactions.length){const reactions=n.reactions.map(r=>({...r,actions:(r.actions||[]).map(a=>a.type==='NODE'&&a.navigation!=='CHANGE_TO'&&darkToLightNodes.has(a.destinationId)?{...a,destinationId:darkToLightNodes.get(a.destinationId)}:a)}));await n.setReactionsAsync(reactions);}
  }
  const lightSettings=lightFrames.get('settings');
  const p=name=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',lightVars.get(name))];
  for(const n of lightSettings.children){if(n.type==='VECTOR'&&Math.abs(n.y-532)<1&&Math.abs(n.width-108)<1&&Math.abs(n.height-80)<1){if(Math.abs(n.x-141)<1){n.fills=p('orangeSoft');n.strokes=p('orangeBorder');}if(Math.abs(n.x-258)<1){n.fills=p('card');n.strokes=p('borderStrong');}}}
  for(const n of lightSettings.children)if(n.type==='GROUP'&&n.y>=540&&n.y<570){const selected=n.x>175&&n.x<215,unselected=n.x>290&&n.x<325;if(selected||unselected)for(const v of n.findAll(()=>true)){if('strokes'in v&&v.strokes.length)v.strokes=p(selected?'orange':'secondary');}}
  function hotspot(frame,name,x,y,w,h){const n=figma.createRectangle();n.name=name;n.resize(w,h);n.fills=[{type:'SOLID',color:{r:1,g:1,b:1},opacity:0}];frame.appendChild(n);n.x=x;n.y=y;return n;}
  const nav=id=>[{type:'NODE',destinationId:id,navigation:'NAVIGATE',transition:{type:'DISSOLVE',duration:0.15,easing:{type:'EASE_OUT'}},resetScrollPosition:true}];
  for(const [theme,frames,other]of [['dark',darkFrames,lightFrames],['light',lightFrames,darkFrames]]){
    const settings=frames.get('settings');const switchX=theme==='dark'?141:258;
    const themeButton=hotspot(settings,'Prototype / Switch to '+(theme==='dark'?'light':'dark')+' theme',switchX,532,108,80);await themeButton.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:nav(other.get('settings').id)}]);
    const close=settings.findOne(n=>n.name==='Prototype / Close settings');await close.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:nav(frames.get('board-active').id)}]);
    const signedOut=figma.createFrame();signedOut.name=theme+'-signed-out-demo';signedOut.resize(390,844);signedOut.fills=[{type:'SOLID',color:rgb(DATA.palettes[theme].bg)}];page.appendChild(signedOut);signedOut.x=400+(theme==='light'?460:0);signedOut.y=9600;
    const body=createAutoLayout('VERTICAL');body.name='Prototype session end';body.resize(350,220);body.primaryAxisSizingMode='AUTO';body.counterAxisSizingMode='FIXED';body.itemSpacing=20;signedOut.appendChild(body);body.x=20;body.y=260;
    for(const [value,size]of [['SolarCoop',28],['Signed out',20],['Prototype demonstration complete.\nReturn to the technician workspace to restart.',13],['Return to technician demo →',14]]){const t=figma.createText();t.fontName={family:'Inter',style:'Regular'};t.fontSize=size;t.lineHeight={unit:'PIXELS',value:size*1.4};t.characters=value;t.fills=[{type:'SOLID',color:rgb(DATA.palettes[theme].text)}];t.textAutoResize='HEIGHT';t.resize(350,t.height);body.appendChild(t);}
    const restart=hotspot(signedOut,'Prototype / Restart technician demo',20,260,350,260);await restart.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:nav(frames.get('board-active').id)}]);
    const logout=frames.get('logout').findOne(n=>n.name==='Prototype / Log out to existing login');await logout.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:nav(signedOut.id)}]);
  }
  page.flowStartingPoints=[{nodeId:darkFrames.get('board-active').id,name:'Technician · Dark'},{nodeId:lightFrames.get('board-active').id,name:'Technician · Light'}];
  for(const [value,y]of [['Technician workspace · Dark',350],['Technician workspace · Light',5350]]){const t=figma.createText();t.name=value;t.fontName={family:'Inter',style:'Bold'};t.fontSize=36;t.characters=value;t.fills=[{type:'SOLID',color:rgb('#B1BFCE')}];page.appendChild(t);t.x=400;t.y=y;}
  const guide=figma.createText();guide.name='Technician / Prototype guide';guide.fontName={family:'Inter',style:'Regular'};guide.fontSize=16;guide.characters='28 technician screens in each theme. Play either flow. Change appearance from Workspace settings. Checkboxes and sound controls are interactive. Photos, audio feedback and logout are prototype demonstrations. Other Solar-Coop designs remain on Page 1.';guide.textAutoResize='HEIGHT';guide.resize(1200,200);guide.fills=[{type:'SOLID',color:rgb('#B1BFCE')}];page.appendChild(guide);guide.x=400;guide.y=11600;
  const oldPage=await figma.getNodeByIdAsync('0:1');
  for(const b of DATA.baseline.filter(b=>!/^dark-/.test(b.name))){const n=await figma.getNodeByIdAsync(b.id);if(n.name!==b.name||n.x!==b.x||n.y!==b.y||n.width!==b.w||n.height!==b.h||n.parent.id!==oldPage.id)throw new Error('Unexpected change outside technician scope: '+b.name);}
  figma.viewport.scrollAndZoomIntoView([darkFrames.get('board-active')]);
  figma.closePlugin('Ready: 28 dark + 28 light technician screens, checkbox states, sound controls and theme switching. Other roles unchanged.');
}
main().catch(error=>{console.error(error);figma.closePlugin('Could not finish: '+error.message+' · Undo this plugin run before retrying.');});
