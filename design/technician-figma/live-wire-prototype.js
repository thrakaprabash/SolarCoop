// PAYLOAD contains this batch's technician IDs, source hotspots, and complete destinations.
const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);
const createdNodeIds=[],mutatedNodeIds=[],evidence=[];
const rgb=h=>({r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255});
const loaded=new Map();
for(const screen of PAYLOAD.screens){const frame=await figma.getNodeByIdAsync(screen.nodeId);for(const n of frame.findAllWithCriteria({types:['TEXT']}))for(const seg of n.getStyledTextSegments(['fontName']))loaded.set(JSON.stringify(seg.fontName),seg.fontName);}
await Promise.all([...loaded.values()].map(f=>figma.loadFontAsync(f)));
function makeFrame(parent,name,w,h,x=0,y=0){const n=figma.createFrame();n.name=name;n.resize(w,h);n.fills=[];n.clipsContent=true;parent.appendChild(n);n.x=x;n.y=y;createdNodeIds.push(n.id);return n;}
const navigate=target=>[{type:'NODE',destinationId:PAYLOAD.destinations[target],navigation:'NAVIGATE',transition:{type:'DISSOLVE',duration:0.15,easing:{type:'EASE_OUT'}},resetScrollPosition:true}];
for(const screen of PAYLOAD.screens){
  const frame=await figma.getNodeByIdAsync(screen.nodeId);if(!frame||frame.type!=='FRAME')throw new Error('Missing technician frame '+screen.nodeId);
  if(frame.children.some(n=>n.name==='Prototype / Scroll viewport')){evidence.push({key:screen.id,id:frame.id,status:'already wired'});continue;}
  const originalHeight=frame.height;const isModal=['settings','logout'].includes(screen.id);const isSupport=['state-components','health-statuses'].includes(screen.id);
  const footerNodes=isSupport?[]:frame.children.filter(n=>n.y>=originalHeight-64-0.1);
  const hasFooter=footerNodes.length>3;const oldChildren=[...frame.children];
  let header,scroll,content,footer;let modalShift=0;
  if(!isModal){
    header=makeFrame(frame,'Prototype / Fixed header',390,70);
    scroll=makeFrame(frame,'Prototype / Scroll viewport',390,844-70-(hasFooter?64:0),0,70);scroll.overflowDirection='VERTICAL';
    content=makeFrame(scroll,'Prototype / Full scroll content',390,Math.max(1,originalHeight-70-(hasFooter?64:0)+28));content.clipsContent=false;
    if(hasFooter)footer=makeFrame(frame,'Prototype / Fixed navigation',390,64,0,780);
    for(const n of oldChildren){
      const x=n.x,y=n.y;
      if(y===0&&n.height>=originalHeight-1&&n.width>=389){n.resize(390,844);mutatedNodeIds.push(n.id);continue;}
      if(y<70&&y+n.height<=71){header.appendChild(n);n.x=x;n.y=y;}
      else if(hasFooter&&footerNodes.includes(n)){footer.appendChild(n);n.x=x;n.y=y-(originalHeight-64);}
      else{content.appendChild(n);n.x=x;n.y=y-70;}
      mutatedNodeIds.push(n.id);
    }
    const extent=Math.max(1,...content.children.map(n=>n.y+n.height));content.resize(390,Math.max(extent+28,scroll.height));
    frame.resize(390,844);frame.fills=[{type:'SOLID',color:rgb('#101820')}];frame.clipsContent=true;frame.overflowDirection='NONE';mutatedNodeIds.push(frame.id);
  }else{
    modalShift=originalHeight-844;
    // Keep the source sheet/dialog and background intact; fit the visible modal to the device.
    for(const n of oldChildren){if(n.x===0&&n.y===0&&n.width>=389&&n.height>=originalHeight-1){n.resize(390,844);mutatedNodeIds.push(n.id);}}
    if(screen.id==='settings'){
      const sheetIndex=oldChildren.findIndex(n=>n.x===0&&Math.abs(n.y-(originalHeight-425))<1&&n.width>=389&&Math.abs(n.height-425)<1);
      if(sheetIndex<0)throw new Error('Settings sheet was not found; stopping before guessing');
      for(const n of oldChildren.slice(sheetIndex)){n.y-=modalShift;mutatedNodeIds.push(n.id);}
    }
    frame.resize(390,844);frame.fills=[{type:'SOLID',color:rgb('#101820')}];frame.clipsContent=true;mutatedNodeIds.push(frame.id);
  }
  let links=0;
  const hotspots=screen.hotspots.filter(o=>!isModal||(screen.id==='logout'?o.name==='Cancel':o.name==='Close settings'||o.name.startsWith('Choose ')));
  // Parent hot areas in the same scroll surface as their visual controls.
  for(const op of hotspots){
    if(PAYLOAD.destinations[op.target]===frame.id)continue;
    let parent=frame,x=op.x,y=op.y;
    if(!isModal){if(op.y<70){parent=header;}else if(hasFooter&&op.y>=screen.sourceHeight-64){parent=footer;y=op.y-(screen.sourceHeight-64);}else{parent=content;y=op.y-70;}}
    else if(screen.id==='settings')y-=modalShift;
    if(screen.id==='board-error'&&op.name==='Retry'){const control=frame.findOne(n=>n.name==='Retry button');if(control){const b=control.absoluteBoundingBox;x=b.x-frame.x;y=b.y-frame.y-(parent===content?70:0);}}
    const n=figma.createRectangle();n.name='Prototype / '+op.name;n.resize(op.w,op.h);n.fills=[{type:'SOLID',color:rgb('#FFFFFF'),opacity:0}];parent.appendChild(n);n.x=x;n.y=y;createdNodeIds.push(n.id);
    if(!PAYLOAD.destinations[op.target])throw new Error('Unresolved target '+op.target);
    const actions=(isModal&&op.name==='Close settings')||screen.id==='logout'&&op.name==='Cancel'?[{type:'BACK'}]:navigate(op.target);
    await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions}]);links++;
  }
  // External map handoff is represented by an actual prototype URL action.
  if(screen.id.startsWith('ticket-')){
    const n=figma.createRectangle();n.name='Prototype / Google Maps';n.resize(322,50);n.fills=[{type:'SOLID',color:rgb('#FFFFFF'),opacity:0}];content.appendChild(n);n.x=34;n.y=338-70;createdNodeIds.push(n.id);
    await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'URL',url:'https://www.google.com/maps/search/?api=1&query=Athurugiriya%2C%20Sri%20Lanka',openInNewTab:true}]}]);links++;
  }
  // Completion checklists are demonstrated by switching between the existing prepared states.
  if(screen.id==='diagnostics-expanded'||screen.id==='closure-empty'){
    const n=figma.createRectangle();n.name='Prototype / Continue repair checklist';n.resize(322,144);n.fills=[{type:'SOLID',color:rgb('#FFFFFF'),opacity:0}];content.appendChild(n);n.x=34;n.y=(screen.id==='diagnostics-expanded'?375:467)-70;createdNodeIds.push(n.id);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:navigate('closure-ready')}]);links++;
  }
  if(screen.id==='logout'){
    const n=figma.createRectangle();n.name='Prototype / Log out to existing login';n.resize(144,50);n.fills=[{type:'SOLID',color:rgb('#FFFFFF'),opacity:0}];frame.appendChild(n);n.x=196;n.y=472;createdNodeIds.push(n.id);await n.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:'57:158',navigation:'NAVIGATE',transition:null,resetScrollPosition:true}]}]);links++;
  }
  evidence.push({key:screen.id,id:frame.id,links,width:frame.width,height:frame.height,scroll:scroll?{id:scroll.id,height:scroll.height,contentHeight:content.height}:null});
}
return {createdNodeIds,mutatedNodeIds,evidence};
