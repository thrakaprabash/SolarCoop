const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);
const createdNodeIds=[],mutatedNodeIds=[],removedNodeIds=[],variableIds=[];
const rgb=hex=>({r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255});
const collection=(await figma.variables.getLocalVariableCollectionsAsync()).find(c=>c.name==='SolarCoop Technician · Dark');
const variables=await figma.variables.getLocalVariablesAsync();
function variable(name,type,value,scopes=[]){let v=variables.find(v=>v.variableCollectionId===collection.id&&v.name===name);if(!v){v=figma.variables.createVariable(name,collection,type);v.scopes=type==='BOOLEAN'?['ALL_SCOPES']:scopes;v.hiddenFromPublishing=true;v.setValueForMode(collection.defaultModeId,value);}variableIds.push(v.id);return v;}
const ref=(v,type)=>({type:'VARIABLE_ALIAS',resolvedType:type,value:{type:'VARIABLE_ALIAS',id:v.id}});
const literal=(value,type)=>({type,resolvedType:type,value});
const eq=(a,b)=>({type:'EXPRESSION',resolvedType:'BOOLEAN',value:{expressionFunction:'EQUALS',expressionArguments:[a,b]}});
const set=(v,data)=>({type:'SET_VARIABLE',variableId:v.id,variableValue:data});
const expression=(fn,args)=>({type:'EXPRESSION',resolvedType:'FLOAT',value:{expressionFunction:fn,expressionArguments:args}});
function rectangle(parent,name,x,y,w,h,fill='#19232E'){const n=figma.createRectangle();n.name=name;n.resize(w,h);n.fills=[{type:'SOLID',color:rgb(fill)}];parent.appendChild(n);n.x=x;n.y=y;createdNodeIds.push(n.id);return n;}
for(const [id,key,y,defaults]of [['125:611','diagnostics',305,[true,false,false]],['112:1817','closure-empty',397,[false,false,false]],['112:1899','closure-ready',595,[true,true,true]]]){
  const frame=await figma.getNodeByIdAsync(id);const content=frame.children.find(n=>n.name==='Prototype / Scroll viewport').children[0];
  for(const n of content.findAllWithCriteria({types:['RECTANGLE']}))if(n.name==='Prototype / Continue repair checklist'){removedNodeIds.push(n.id);n.remove();}
  const count=variable('prototype/'+key+'/checked-count','FLOAT',defaults.filter(Boolean).length);
  const countLabel=variable('prototype/'+key+'/checked-label','STRING',defaults.filter(Boolean).length+' / 3 done',['TEXT_CONTENT']);
  const label=content.findAllWithCriteria({types:['TEXT']}).find(n=>/^\d \/ 3 done$/.test(n.characters));
  if(label){for(const seg of label.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);label.setBoundVariable('characters',countLabel);mutatedNodeIds.push(label.id);}
  for(let i=0;i<3;i++){
    const checked=variable('prototype/'+key+'/step-'+(i+1),'BOOLEAN',defaults[i]);
    const base=rectangle(content,'Checklist / Step '+(i+1)+' unchecked',34,y+i*48,26,26);base.cornerRadius=4;base.strokes=[{type:'SOLID',color:rgb('#465669')}];
    const on=rectangle(content,'Checklist / Step '+(i+1)+' checked',34,y+i*48,26,26,'#FFAD70');on.cornerRadius=4;on.setBoundVariable('visible',checked);
    const icon=figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#101820" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>');icon.name='Checklist / Step '+(i+1)+' tick';content.appendChild(icon);icon.x=37;icon.y=y+3+i*48;icon.setBoundVariable('visible',checked);createdNodeIds.push(icon.id,...icon.findAll(()=>true).map(n=>n.id));
    const hot=rectangle(content,'Prototype / Toggle checklist '+(i+1),30,y-10+i*48,326,48);hot.fills=[{type:'SOLID',color:rgb('#FFFFFF'),opacity:0}];
    const toggle={type:'CONDITIONAL',conditionalBlocks:[{condition:eq(ref(checked,'BOOLEAN'),literal(true,'BOOLEAN')),actions:[set(checked,literal(false,'BOOLEAN')),set(count,expression('SUBTRACTION',[ref(count,'FLOAT'),literal(1,'FLOAT')]))]},{actions:[set(checked,literal(true,'BOOLEAN')),set(count,expression('ADDITION',[ref(count,'FLOAT'),literal(1,'FLOAT')]))]}]};
    const updateCount={type:'CONDITIONAL',conditionalBlocks:[0,1,2,3].map(n=>({condition:eq(ref(count,'FLOAT'),literal(n,'FLOAT')),actions:[set(countLabel,literal(n+' / 3 done','STRING'))]}))};
    await hot.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[toggle,updateCount]}]);
  }
}
const settings=await figma.getNodeByIdAsync('112:969');
for(const n of settings.findAllWithCriteria({types:['RECTANGLE']}))if(n.name.startsWith('Prototype / ')&&n.name!=='Prototype / Close settings'){removedNodeIds.push(n.id);n.remove();}
const soundLabel=variable('prototype/settings/sound-label','STRING','Sound on',['TEXT_CONTENT']);
const soundText=settings.findAllWithCriteria({types:['TEXT']}).find(n=>n.characters==='Sound on');
for(const seg of soundText.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);soundText.setBoundVariable('characters',soundLabel);mutatedNodeIds.push(soundText.id);
const sound=rectangle(settings,'Prototype / Toggle incident sound',24,720,151,50);sound.fills=[{type:'SOLID',color:rgb('#FFFFFF'),opacity:0}];await sound.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'CONDITIONAL',conditionalBlocks:[{condition:eq(ref(soundLabel,'STRING'),literal('Sound on','STRING')),actions:[set(soundLabel,literal('Muted','STRING'))]},{actions:[set(soundLabel,literal('Sound on','STRING'))]}]}]}]);
const helpText=settings.findAllWithCriteria({types:['TEXT']}).find(n=>n.characters.startsWith('In a browser, tap Test sound'));
if(helpText){const help=variable('prototype/settings/audio-help','STRING',helpText.characters,['TEXT_CONTENT']);for(const seg of helpText.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);helpText.setBoundVariable('characters',help);mutatedNodeIds.push(helpText.id);const hot=rectangle(settings,'Prototype / Test sound demonstration',187,720,178,50);hot.fills=[{type:'SOLID',color:rgb('#FFFFFF'),opacity:0}];await hot.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[set(help,literal('Test sound requested · prototype demonstration','STRING'))]}]);}
const startingPoints=page.flowStartingPoints;
if(!startingPoints.some(f=>f.nodeId==='125:169')){page.flowStartingPoints=[...startingPoints,{nodeId:'125:169',name:'Technician · Dark interactive prototype'}];mutatedNodeIds.push(page.id);}
const nonTechnician=BASELINE.filter(b=>!/^dark-/.test(b.name));const unaffected=[];
for(const b of nonTechnician){const n=await figma.getNodeByIdAsync(b.id);if(n.name!==b.name||n.x!==b.x||n.y!==b.y||n.width!==b.w||n.height!==b.h||('children'in n?n.children.length:0)!==b.childCount)unaffected.push(b.id);}
if(unaffected.length)throw new Error('Unexpected changes outside technician scope: '+unaffected.join(','));
return {createdNodeIds,mutatedNodeIds,removedNodeIds,variableIds,flowStartingPoints:page.flowStartingPoints,otherRolesUnchanged:true,checkedOtherFrames:nonTechnician.length,interactiveChecklists:3,soundToggle:true};

