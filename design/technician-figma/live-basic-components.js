const page=await figma.getNodeByIdAsync('126:180');await figma.setCurrentPageAsync(page);
const createdNodeIds=[],mutatedNodeIds=[],removedNodeIds=[];
const available=await figma.listAvailableFontsAsync();for(const style of ['Regular','Bold']){const f=available.find(f=>f.fontName.family==='Inter'&&f.fontName.style===style);if(!f)throw new Error('Inter unavailable');await figma.loadFontAsync(f.fontName);}
const fonts=new Map();for(const id of ['125:611','112:1817','112:1899','112:969']){const n=await figma.getNodeByIdAsync(id);for(const t of n.findAllWithCriteria({types:['TEXT']}))for(const s of t.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);}await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
const cols=await figma.variables.getLocalVariableCollectionsAsync();const vars=await figma.variables.getLocalVariablesAsync('COLOR');
const track=n=>{createdNodeIds.push(n.id);return n;};
function paint(theme,key){const c=cols.find(c=>c.name==='SolarCoop Technician · '+(theme==='dark'?'Dark':'Light'));const v=vars.find(v=>v.variableCollectionId===c.id&&v.name===key);if(!v)throw new Error('Missing token '+theme+':'+key);return [figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:0,g:0,b:0}},'color',v)];}
function text(parent,value,size,theme,key='text',bold=false,width=230){const n=track(figma.createText());n.fontName={family:'Inter',style:bold?'Bold':'Regular'};n.fontSize=size;n.lineHeight={unit:'PIXELS',value:Math.ceil(size*1.4)};n.characters=value;n.fills=paint(theme,key);n.textAutoResize='HEIGHT';n.resize(width,n.height);n.name=value;parent.appendChild(n);return n;}
function row(parent,name,w,h){const n=track(figma.createAutoLayout('HORIZONTAL'));n.name=name;n.resize(w,h);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.counterAxisAlignItems='MIN';n.itemSpacing=10;n.fills=[];parent.appendChild(n);return n;}
const checklistSets={},checklistVariants={},buttonSets={},buttonVariants={};
for(const theme of ['dark','light']){
  const components=[];const variant={};
  for(const context of ['Diagnostics','Closure'])for(let mask=0;mask<8;mask++){
    const key=context+':'+mask;const c=track(figma.createComponent());c.name='Context='+context+', Checked='+mask;c.description='Three independent technician repair checks. Single-action variant interactions update the checkbox marks and exact checked count.';c.layoutMode='VERTICAL';c.resize(322,172);c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.itemSpacing=0;c.fills=paint(theme,context==='Diagnostics'?'redSoft':'card');page.appendChild(c);
    const header=row(c,'Checklist header',322,28);header.itemSpacing=6;
    text(header,context==='Diagnostics'?'DIAGNOSTIC CHECKLIST':'PARTS & REPAIR CHECKLIST',11,theme,'secondary',true,242);
    const count=text(header,[0,1,2].filter(i=>mask&(1<<i)).length+' / 3 done',11,theme,'muted',false,74);count.textAlignHorizontal='RIGHT';
    for(let i=0;i<3;i++){
      const r=row(c,'Step '+i,322,48);const on=Boolean(mask&(1<<i));
      const box=track(figma.createAutoLayout('HORIZONTAL'));box.name='Checkbox';box.resize(26,26);box.primaryAxisAlignItems='CENTER';box.counterAxisAlignItems='CENTER';box.primaryAxisSizingMode='FIXED';box.counterAxisSizingMode='FIXED';box.cornerRadius=4;box.fills=paint(theme,on?'orange':context==='Diagnostics'?'redSoft':'card');box.strokes=paint(theme,on?'orange':'borderStrong');r.appendChild(box);
      if(on){const icon=track(figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="'+(theme==='dark'?'#101820':'#FFFFFF')+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>'));icon.name='Check';box.appendChild(icon);createdNodeIds.push(...icon.findAll(()=>true).map(n=>n.id));}
      text(r,['Test DC voltage','Inspect MC4 joint','Check isolation switch'][i],14,theme,on?'secondary':'text',false,286);
    }
    components.push(c);variant[key]=c;
  }
  const set=track(figma.combineAsVariants(components,page));set.name='Technician / Interactive checklist / '+theme;set.description='Diagnostics and closure checklist states; exact counters; compatible single-action interactions; color tokens for '+theme+' theme.';set.x=theme==='dark'?400:2020;set.y=10200;set.fills=[];
  components.forEach((c,i)=>{c.x=24+(i%4)*348;c.y=24+Math.floor(i/4)*198;mutatedNodeIds.push(c.id);});set.resize(1440,840);
  for(const context of ['Diagnostics','Closure'])for(let mask=0;mask<8;mask++)for(let i=0;i<3;i++){const c=variant[context+':'+mask];const r=c.children[i+1];await r.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:variant[context+':'+(mask^(1<<i))].id,navigation:'CHANGE_TO',transition:null}]}]);mutatedNodeIds.push(r.id);}
  checklistSets[theme]=set.id;checklistVariants[theme]=Object.fromEntries(Object.entries(variant).map(([key,n])=>[key,n.id]));
  for(const family of ['Sound','Test']){
    const parts=[];const map={};
    for(const state of ['On','Off']){const c=track(figma.createComponent());c.name='State='+state;c.layoutMode='HORIZONTAL';c.resize(family==='Sound'?151:178,50);c.primaryAxisSizingMode='FIXED';c.counterAxisSizingMode='FIXED';c.primaryAxisAlignItems='CENTER';c.counterAxisAlignItems='CENTER';c.cornerRadius=12;c.fills=paint(theme,state==='On'?'orangeSoft':'card');c.strokes=paint(theme,state==='On'?'orangeBorder':'borderStrong');page.appendChild(c);const label=family==='Sound'?(state==='On'?'Sound on':'Muted'):(state==='On'?'Test sound':'Sound tested');const t=text(c,label,12,theme,'text',true,c.width-24);t.textAlignHorizontal='CENTER';parts.push(c);map[state]=c;}
    const set=track(figma.combineAsVariants(parts,page));set.name='Technician / '+family+' control / '+theme;set.description=family==='Sound'?'Toggle the incident-sound setting in this interactive prototype.':'Demonstrates Test sound feedback; this design prototype does not play audio.';set.fills=[];set.x=(theme==='dark'?400:2020)+(family==='Sound'?0:420);set.y=11200;parts.forEach((c,i)=>{c.x=24+i*210;c.y=24;mutatedNodeIds.push(c.id);});set.resize(440,100);
    for(const state of ['On','Off']){await map[state].setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:map[state==='On'?'Off':'On'].id,navigation:'CHANGE_TO',transition:null}]}]);mutatedNodeIds.push(map[state].id);}
    buttonSets[theme+':'+family]=set.id;buttonVariants[theme+':'+family]=Object.fromEntries(Object.entries(map).map(([k,n])=>[k,n.id]));
  }
}
for(const [id,context,mask,y]of [['125:611','Diagnostics',1,278],['112:1817','Closure',0,360],['112:1899','Closure',7,558]]){
  const frame=await figma.getNodeByIdAsync(id);const content=frame.children.find(n=>n.name==='Prototype / Scroll viewport').children[0];
  for(const n of content.findAllWithCriteria({types:['RECTANGLE']}))if(n.name==='Prototype / Continue repair checklist'){removedNodeIds.push(n.id);n.remove();}
  const variant=await figma.getNodeByIdAsync(checklistVariants.dark[context+':'+mask]);const inst=track(variant.createInstance());inst.name='Interactive / '+context+' checklist';content.appendChild(inst);inst.x=34;inst.y=y;
}
const settings=await figma.getNodeByIdAsync('112:969');for(const n of settings.findAllWithCriteria({types:['RECTANGLE']}))if(n.name.startsWith('Prototype / ')&&n.name!=='Prototype / Close settings'){removedNodeIds.push(n.id);n.remove();}
for(const [family,x]of [['Sound',24],['Test',187]]){const c=await figma.getNodeByIdAsync(buttonVariants['dark:'+family].On);const inst=track(c.createInstance());inst.name='Interactive / '+family+' control';settings.appendChild(inst);inst.x=x;inst.y=720;}
const notice=page.children.find(n=>n.type==='COMPONENT'&&n.name==='Technician / State notice');if(notice){notice.x=400;notice.y=9800;mutatedNodeIds.push(notice.id);}
return {createdNodeIds:[...new Set(createdNodeIds)],mutatedNodeIds:[...new Set(mutatedNodeIds)],removedNodeIds,checklistSets,checklistVariants,buttonSets,buttonVariants,interactiveChecklists:3,componentVariantCount:40,planCompatible:true};
