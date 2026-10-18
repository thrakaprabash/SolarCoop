// Executed through Figma MCP, on the existing Page 1 only.
const page = await figma.getNodeByIdAsync('0:1');
await figma.setCurrentPageAsync(page);
const createdNodeIds = [], mutatedNodeIds = [], removedNodeIds = [];
const original = page.children.filter(n => /^dark-/.test(n.name));
const fonts = new Map();
for (const frame of original) for (const text of frame.findAllWithCriteria({types:['TEXT']})) for(const seg of text.getStyledTextSegments(['fontName'])) fonts.set(JSON.stringify(seg.fontName),seg.fontName);
const available = await figma.listAvailableFontsAsync();
for(const style of ['Regular','Semi Bold','Bold']) {
  const f = available.find(f=>f.fontName.family==='Inter'&&f.fontName.style===style);
  if(!f)throw new Error('Existing product font Inter '+style+' is unavailable');
  fonts.set(JSON.stringify(f.fontName),f.fontName);
}
await Promise.all([...fonts.values()].map(f=>figma.loadFontAsync(f)));
const T = {bg:'#101820',card:'#19232E',raised:'#23303D',border:'#2B3948',orange:'#FFAD70',orangeSoft:'#34271F',orangeBorder:'#775237',action:'#B94D0B',text:'#EEF3F8',secondary:'#B1BFCE',muted:'#94A5B8',red:'#FF9393',redSoft:'#342329',green:'#7CD8A5',greenSoft:'#1C342B',amber:'#EEC66B'};
const rgb = hex=>({r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255});
const collections = await figma.variables.getLocalVariableCollectionsAsync();
let collection = collections.find(c=>c.name==='SolarCoop Technician · Dark');
if(!collection){collection=figma.variables.createVariableCollection('SolarCoop Technician · Dark');collection.renameMode(collection.defaultModeId,'Dark');}
const localVars=await figma.variables.getLocalVariablesAsync('COLOR');
const vars={};
for(const [key,value] of Object.entries(T)) {
  let variable=localVars.find(v=>v.variableCollectionId===collection.id&&v.name===key);
  if(!variable){variable=figma.variables.createVariable(key,collection,'COLOR');variable.scopes=['FRAME_FILL','SHAPE_FILL','TEXT_FILL','STROKE_COLOR'];variable.setValueForMode(collection.defaultModeId,rgb(value));variable.setVariableCodeSyntax('ANDROID','TECH.'+(key==='secondary'?'textSecondary':key));variable.setVariableCodeSyntax('iOS','TECH.'+key);}
  vars[key]=variable;
}
const fill = key=>[figma.variables.setBoundVariableForPaint({type:'SOLID',color:rgb(T[key])},'color',vars[key])];
const track = n=>{createdNodeIds.push(n.id);return n;};
const text = (value,size=13,key='secondary',bold=false,width=322)=>{
  const n=track(figma.createText());n.fontName={family:'Inter',style:bold?'Bold':'Regular'};n.fontSize=size;n.lineHeight={unit:'PIXELS',value:Math.ceil(size*1.45)};n.characters=value;n.fills=fill(key);n.textAutoResize='HEIGHT';n.resize(width,n.height);n.name=value.slice(0,48);return n;
};
const stack = (parent,name,width,gap=10,pad=0,bg=null)=>{
  const n=track(figma.createAutoLayout('VERTICAL'));n.name=name;n.resize(width,10);n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.itemSpacing=gap;n.paddingLeft=n.paddingRight=n.paddingTop=n.paddingBottom=pad;n.fills=bg?fill(bg):[];parent.appendChild(n);return n;
};
function collect(node,list){list.push(node.id);if('children'in node)for(const c of node.children)collect(c,list);}
function clone(sourceId,key,x,y){const existing=page.children.find(n=>n.name==='dark-'+key+' 1');if(existing)return existing;const source=original.find(n=>n.id===sourceId);const n=source.clone();n.name='dark-'+key+' 1';n.x=x;n.y=y;page.appendChild(n);collect(n,createdNodeIds);return n;}
function removeMiddle(n,start=368,end=n.height-64){for(const child of [...n.children])if(child.y>=start&&child.y<end){collect(child,removedNodeIds);child.remove();}}
async function rewrite(n,from,to){for(const node of n.findAllWithCriteria({types:['TEXT']}))if(node.characters===from){node.characters=to;mutatedNodeIds.push(node.id);}}
function liveDot(n){const dot=n.children.find(c=>c.x===285&&c.y===31&&c.width<=7);if(dot){dot.fills=fill('green');mutatedNodeIds.push(dot.id);}}
const active=clone('112:1602','board-active',-4800,1826);await rewrite(active,'Offline','Live');liveDot(active);
const empty=clone('112:1710','board-empty',-5360,1826);removeMiddle(empty);const emptyBody=stack(empty,'Pending queue · empty',350,12);emptyBody.x=20;emptyBody.y=368;emptyBody.appendChild(text('Pending Jobs',14,'secondary',true));const emptyPanel=stack(emptyBody,'No pending jobs',350,0,24,'card');emptyPanel.cornerRadius=16;emptyPanel.appendChild(text('No pending jobs. The queue is clear.',13,'secondary',false,302));
const loading=clone('112:1602','board-loading',-4800,3100);await rewrite(loading,'Offline','Syncing');removeMiddle(loading);const loadingBody=stack(loading,'Loading tickets',350,12,24);loadingBody.x=20;loadingBody.y=392;loadingBody.counterAxisAlignItems='CENTER';loadingBody.appendChild(text('◌',30,'orange',true,40));loadingBody.appendChild(text('Loading job tickets…',13,'secondary',false,270));
const error=clone('112:1602','board-error',-5360,3100);await rewrite(error,'Offline','Live');liveDot(error);removeMiddle(error);const errorPanel=stack(error,'Job board error',350,14,14,'redSoft');errorPanel.x=20;errorPanel.y=367;errorPanel.cornerRadius=12;errorPanel.appendChild(text('Could not load job tickets.',13,'text'));
const retry=stack(errorPanel,'Retry button',110,0,12,'action');retry.cornerRadius=8;retry.appendChild(text('Retry',12,'text',true,86));
const expanded=clone('112:2201','diagnostics-expanded',-5360,4400);await rewrite(expanded,'0 / 3 done','1 / 3 done');for(const n of [...expanded.findAllWithCriteria({types:['TEXT']})])if(n.characters==='Accept this job to start the checklist.'){removedNodeIds.push(n.id);n.remove();}
const checkBg=track(figma.createRectangle());checkBg.name='Accepted job · First diagnostic step checked';checkBg.resize(26,26);checkBg.cornerRadius=4;checkBg.fills=fill('orange');expanded.appendChild(checkBg);checkBg.x=34;checkBg.y=375;
const checkMark=track(figma.createNodeFromSvg('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#101820" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>'));expanded.appendChild(checkMark);checkMark.x=37;checkMark.y=378;collect(checkMark,createdNodeIds);
const diagEmpty=clone('112:1991','diagnostics-empty',-4800,4400);removeMiddle(diagEmpty,130);const healthy=stack(diagEmpty,'No open fault alerts',350,10,28,'card');healthy.x=20;healthy.y=130;healthy.cornerRadius=14;healthy.appendChild(text('✓',28,'green',true));healthy.appendChild(text('All systems healthy',14,'text',true));healthy.appendChild(text('No open fault alerts right now.',12));
// A single reusable native notice component supplies supporting states.
let notice=page.children.find(n=>n.type==='COMPONENT'&&n.name==='Technician / State notice');
if(!notice){notice=track(figma.createComponent());notice.name='Technician / State notice';notice.description='Technician loading, empty and error notice. Editable title and body; source dark tokens.';notice.layoutMode='VERTICAL';notice.resize(350,90);notice.primaryAxisSizingMode='AUTO';notice.counterAxisSizingMode='FIXED';notice.paddingLeft=notice.paddingRight=notice.paddingTop=notice.paddingBottom=14;notice.itemSpacing=6;notice.cornerRadius=14;notice.fills=fill('card');notice.appendChild(text('State title',13,'orange',true));notice.appendChild(text('State description',12));notice.x=-5950;notice.y=5700;page.appendChild(notice);}
const states=clone('112:1991','state-components',-5360,5700);removeMiddle(states,70,states.height);states.resize(390,1120);const statesBody=stack(states,'Operational state examples',350,13);statesBody.x=20;statesBody.y=94;statesBody.appendChild(text('Operational states',22,'text',true));for(const [title,body] of [['No active job','No active job. Accept a pending job to start.'],['No completed jobs','No completed jobs yet.'],['Upload error','Could not upload this photo. Please try again.'],['Preview error','Retry photo previews'],['Camera permission','Allow camera access in device settings. You can also choose a photo from your gallery.'],['History unavailable','Could not load maintenance history.'],['Sound unavailable','Check device volume and try Test sound.'],['Saving','Saving notes… / Uploading photo…']]){const inst=track(notice.createInstance());statesBody.appendChild(inst);inst.children[0].characters=title;inst.children[1].characters=body;mutatedNodeIds.push(inst.children[0].id,inst.children[1].id);}
const statuses=clone('112:1991','health-statuses',-4800,5700);removeMiddle(statuses,70,statuses.height);statuses.resize(390,1210);const statusBody=stack(statuses,'System status examples',350,16);statusBody.x=20;statusBody.y=94;statusBody.appendChild(text('System status variants',20,'text',true));for(const state of ['Healthy','Fault','Offline','Degraded','Stale reading','No reading']){const inst=track(notice.createInstance());statusBody.appendChild(inst);inst.children[0].characters=state;inst.children[1].characters=state==='No reading'?'INV-SOL-001 · 5.0 kW · 12 panels\nOutput —   Today —   Battery —\nNo reading received':state==='Stale reading'?'INV-SOL-001 · 5.0 kW · 12 panels\nOutput 0.00 kW   Today 12.5 kWh   Battery 72%\nReading 125s ago · Last known':'INV-SOL-001 · 5.0 kW · 12 panels\nOutput 0.00 kW   Today 12.5 kWh   Battery 72%\nReading 8s ago';mutatedNodeIds.push(inst.children[0].id,inst.children[1].id);}
return {createdNodeIds:[...new Set(createdNodeIds)],mutatedNodeIds:[...new Set(mutatedNodeIds)],removedNodeIds:[...new Set(removedNodeIds)],collectionId:collection.id,variableIds:Object.values(vars).map(v=>v.id),screens:page.children.filter(n=>/^dark-/.test(n.name)).map(n=>({id:n.id,key:n.name.replace(/^dark-/,'').replace(/ 1$/,''),name:n.name,x:n.x,y:n.y,w:n.width,h:n.height})),fontFamily:'Inter',source:'Existing technician SVG layers and source-derived dark palette; other roles untouched'};
