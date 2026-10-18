const createdNodeIds=[],mutatedNodeIds=[];
const oldPage=await figma.getNodeByIdAsync('0:1');
const main=await figma.getNodeByIdAsync('125:169');
const target=main.parent.type==='PAGE'&&main.parent.id!=='0:1'?main.parent:await figma.getNodeByIdAsync('126:180');
if(!target||target.type!=='PAGE')throw new Error('User-created technician page is unavailable');
const frames=[];for(const id of FRAME_IDS){const n=await figma.getNodeByIdAsync(id);if(!n||n.type!=='FRAME'||!/^dark-/.test(n.name))throw new Error('Technician source changed: '+id);frames.push(n);}
const fonts=new Map();for(const frame of frames)for(const n of frame.findAllWithCriteria({types:['TEXT']}))for(const s of n.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);
const notice=oldPage.children.find(n=>n.type==='COMPONENT'&&n.name==='Technician / State notice');if(notice)for(const n of notice.findAllWithCriteria({types:['TEXT']}))for(const s of n.getStyledTextSegments(['fontName']))fonts.set(JSON.stringify(s.fontName),s.fontName);
await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
await figma.setCurrentPageAsync(target);
const collection=(await figma.variables.getLocalVariableCollectionsAsync()).find(c=>c.name==='SolarCoop Technician · Dark');
if(!collection)throw new Error('Technician tokens are unavailable');
collection.name='SolarCoop Technician · Dark';
const dark=collection.modes.find(m=>m.name==='Dark').modeId;
let lightCollection=(await figma.variables.getLocalVariableCollectionsAsync()).find(c=>c.name==='SolarCoop Technician · Light');if(!lightCollection){lightCollection=figma.variables.createVariableCollection('SolarCoop Technician · Light');lightCollection.renameMode(lightCollection.defaultModeId,'Light');}const light=lightCollection.defaultModeId;
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const aliases={raised:'cardRaised',secondary:'textSecondary',muted:'textMuted'};
const vars=await figma.variables.getLocalVariablesAsync('COLOR');const variableIds=[];
for(const [key,value]of Object.entries(PALETTES.dark)){
  const name=Object.keys(aliases).find(a=>aliases[a]===key)||key;
  let v=vars.find(v=>v.variableCollectionId===collection.id&&v.name===name);
  if(!v){v=figma.variables.createVariable(name,collection,'COLOR');v.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];v.setVariableCodeSyntax('ANDROID','TECH.'+key);}
  v.setValueForMode(dark,rgb(value));let lv=vars.find(v=>v.variableCollectionId===lightCollection.id&&v.name===name);if(!lv){lv=figma.variables.createVariable(name,lightCollection,'COLOR');lv.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];lv.setVariableCodeSyntax('ANDROID','TECH.'+key);}lv.setValueForMode(light,rgb(PALETTES.light[key]));variableIds.push(v.id,lv.id);
}
for(let i=0;i<frames.length;i++){const f=frames[i];target.appendChild(f);f.x=400+(i%7)*460;f.y=500+Math.floor(i/7)*1040;f.setExplicitVariableModeForCollection(collection,dark);mutatedNodeIds.push(f.id);}
if(notice){target.appendChild(notice);notice.x=400;notice.y=5100;mutatedNodeIds.push(notice.id);}
// Keep all non-technician flow starting points on their existing page.
oldPage.flowStartingPoints=oldPage.flowStartingPoints.filter(f=>!FRAME_IDS.includes(f.nodeId));mutatedNodeIds.push(oldPage.id);
target.flowStartingPoints=[...target.flowStartingPoints.filter(f=>f.nodeId!=='125:169'),{nodeId:'125:169',name:'Technician · Dark'}];mutatedNodeIds.push(target.id);
// Remove only our logout link into another page; the theme prototype gets its own end state.
const logout=frames.find(f=>f.name==='dark-logout 1');const exit=logout.findOne(n=>n.name==='Prototype / Log out to existing login');if(exit){await exit.setReactionsAsync([]);mutatedNodeIds.push(exit.id);}
return {createdNodeIds,mutatedNodeIds,pageId:target.id,pageName:target.name,collectionId:collection.id,collectionIds:{dark:collection.id,light:lightCollection.id},modeIds:{dark,light},variableIds,frames:frames.map(f=>({id:f.id,key:f.name.replace(/^dark-/,'').replace(/ 1$/,''),x:f.x,y:f.y})),oldPageRemaining:oldPage.children.length};

