// Generates source-derived design snapshots, SVGs and a native Figma importer.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const OUT = __dirname;
const ROOT = path.resolve(OUT, '../..');
const themeSource = fs.readFileSync(path.join(ROOT, 'src/technician/theme.js'), 'utf8');
const palettes = vm.runInNewContext(themeSource.replace(/export /g, '') + '\n({light:TECH_LIGHT,dark:TECH_DARK})');
const copy = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n/locales/en.json'), 'utf8')).technician;
const icons = {};
function iconSvg(name, color) {
  if(name === 'history') name = 'rotate-ccw-clock';
  if (!icons[name]) {
    const raw = fs.readFileSync(path.join(ROOT, 'node_modules/lucide-react-native/dist/cjs/icons', name + '.js'), 'utf8');
    const start = raw.indexOf('[', raw.indexOf('createLucideIcon('));
    icons[name] = vm.runInNewContext(raw.slice(start, raw.indexOf(']);', start) + 1));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name].map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k,v]) => `${k}="${v}"`).join(' ')}/>`).join('')}</svg>`;
}
const screens = [];
let s, T;
function rect(x,y,w,h,fill,r=0,stroke=null,name='Surface',extra={}) { s.ops.push({kind:'rect',x,y,w,h,fill,r,stroke,name,...extra}); }
function text(x,y,value,size=13,color=T.text,weight=400,w=350,name='Text') { s.ops.push({kind:'text',x,y,w:Math.min(w,390-x),h:Math.ceil(size*1.45)*(String(value).split('\n').length),value:String(value),size,color,weight,name}); }
function icon(x,y,name,color=T.orange,size=20) { s.ops.push({kind:'icon',x,y,w:size,h:size,svg:iconSvg(name,color),name:name+' icon'}); }
function line(y,x=20,w=350,color=T.border) { rect(x,y,w,1,color,0,null,'Divider'); }
function hot(x,y,w,h,target,label) { s.ops.push({kind:'hotspot',x,y,w,h,target,name:label}); }
function button(y,label,target=null,{x=20,w=350,secondary=false,disabled=false,color=T.action}={}) {
  rect(x,y,w,50,secondary?T.orangeSoft:color,12,secondary?T.orangeBorder:null,label,{opacity:disabled?0.4:1});
  text(x+12,y+15,label,12,secondary?T.orange:'#FFFFFF',600,w-24,label+' label');s.ops[s.ops.length-1].align='CENTER';
  if(target&&!disabled) hot(x,y,w,50,target,label);
}
function panel(y,h,title,ico='cpu') {rect(20,y,350,h,T.card,14,T.border,title); icon(34,y+15,ico);text(62,y+16,title.toUpperCase(),12,T.text,600,290);}
function note(y,value,color=T.textSecondary) {text(20,y,value,12,color,400,350);}
function header(connection='Live') {
  rect(0,0,390,70,T.bg);line(69,0,390);rect(20,15,38,38,T.orangeSoft,12,T.orangeBorder,'Brand mark');icon(28,23,'sun',T.orange,22);
  text(68,16,'SolarCoop',17,T.text,700,160);text(68,39,copy.design.fieldService,11,T.textSecondary,400,160);
  rect(285,31,6,6,connection==='Offline'?T.red:connection==='Syncing'?T.amber:T.green,3);text(296,24,connection,11,T.textSecondary,400,60);
  icon(353,25,'sliders-horizontal',T.text,21);hot(343,13,44,44,'settings','Workspace settings');
}
function nav(active='dashboard') {
  const y=s.h-64;rect(0,y,390,64,T.card);line(y,0,390);
  [['dashboard','wrench','Dashboard'],['diagnostics','stethoscope','Diagnostics'],['health','activity','Health'],['profile','user','Profile']].forEach(([key,ico,label],i)=>{
    const x=i*97.5;const c=key===active?T.orange:T.textMuted;
    if(key===active)rect(x+39,y+4,18,2,T.orange,1);
    icon(x+39,y+13,ico,c);text(x+10,y+39,label,11,c,key===active?700:400,90);
    if(key==='diagnostics'){rect(x+59,y+7,16,16,T.red,8);text(x+63,y+8,'2',9,'#FFFFFF',700,14);}
    hot(x,y,97.5,64,key==='dashboard'?'board-active':key,label+' tab');
  });
}
function back(label='Back to Dashboard',target='board-active') {icon(20,92,'arrow-left',T.orange,16);text(43,91,label.toUpperCase(),12,T.orange,600,320);hot(20,78,350,44,target,label);}
function hero(y=90) {
  rect(20,y,350,186,T.heroStart,22,T.orangeBorder,'Job board hero',{gradient:T.heroEnd});
  [28,45,62].forEach(r=>s.ops.push({kind:'ellipse',x:306-r,y:y+68-r,w:r*2,h:r*2,fill:r===28?T.orangeSoft:null,stroke:T.orange,opacity:0.22,name:'Solar orbit'}));
  text(38,y+19,copy.design.jobBoard,28,T.text,700,280);text(38,y+61,copy.design.boardCaption,13,T.textSecondary,400,295);
  [['3','Waiting',T.amber,'board-pending'],['1','In progress',T.orange,'board-active'],['2','Urgent',T.red,'diagnostics']].forEach(([n,l,c,target],i)=>{
    const x=38+i*105;if(i)rect(x-12,y+111,1,56,T.orangeBorder);text(x,y+109,n,28,c,600,100);text(x,y+149,l,11,T.textSecondary,500,100);hot(x,y+105,100,70,target,l);
  });
}
function tabs(selected,y=298) {['pending','active','completed'].forEach((key,i)=>{const x=20+i*116.7;text(x+11,y+15,key==='completed'?'Completed':`${key==='active'?'Active':'Pending'} (${key==='active'?1:3})`,12,key===selected?T.orange:T.textSecondary,600,111);hot(x,y,116.7,48,'board-'+key,key+' filter');if(key===selected)rect(x,y+46,116.7,2,T.orange);});line(y+48);}
function job(y,{code='JOB-1042',title='Solis Inverter Fault · 5 kW',client='Kamal Jayasinghe',area='4.6 km (Athurugiriya)',urgency='Urgent',error='F05',completed=false,source='Inverter alert',target='ticket-active'}={}) {
  rect(20,y,350,177,T.card,16,target==='ticket-active'?T.orangeBorder:T.border,'Job card · '+code);
  text(37,y+16,code,11,T.textMuted,600,185);const c=completed?T.green:urgency==='Urgent'?T.red:urgency==='Medium'?T.amber:T.green;
  rect(280,y+12,74,27,completed?T.greenSoft:urgency==='Urgent'?T.redSoft:T.amberSoft,6);text(288,y+17,completed?'Completed':urgency,11,c,600,72);
  text(37,y+48,title,17,T.text,600,320);icon(37,y+79,'user-round',T.textMuted,14);text(58,y+75,client,13,T.textSecondary,400,290);
  icon(37,y+106,'map-pin',T.textMuted,14);text(58,y+101,area,13,T.textSecondary,400,290);line(y+135,37,316);
  text(37,y+147,(error?error+' · ':'')+source,11,T.textMuted,400,225);text(276,y+147,'View Job',12,T.orange,600,72);icon(340,y+149,'chevron-right',T.orange,16);hot(20,y,350,177,target,'Open '+code);
}
function board(selected='active',state=null) {
  hero();tabs(selected);
  if(state==='loading'){icon(180,407,'loader-circle',T.orange,30);text(113,461,copy.dashboard.loading,12,T.textSecondary,600,255);}
  else if(state==='error'){rect(20,367,350,130,T.redSoft,12,T.redBorder,'Load error');text(33,384,'Could not load job tickets.',13);button(426,'Retry','board-active',{x:33,w:110,color:T.red});}
  else if(state==='empty'){text(20,368,'Pending Jobs',14,T.textSecondary,600);rect(20,400,350,98,T.card,16,T.border);text(43,435,copy.dashboard.noPending,13,T.textSecondary,400,310);}
  else if(selected==='active'){text(20,368,'Active Job Ticket',14,T.textSecondary,600);job(402);text(20,603,'Pending Jobs',14,T.textSecondary,600);job(636,{code:'JOB-1043',title:'Huawei PV String Low Voltage',client:'Nadeesha Silva',area:'2.8 km (Malabe)',urgency:'Medium',error:'F12',target:'ticket-pending'});}
  else if(selected==='pending'){text(20,368,'Pending Jobs',14,T.textSecondary,600);job(402,{code:'JOB-1043',title:'Huawei PV String Low Voltage',client:'Nadeesha Silva',area:'2.8 km (Malabe)',urgency:'Medium',error:'F12',target:'ticket-pending'});job(594,{code:'JOB-1044',title:'Solar panel cloud sync delay',client:'Saman Fernando',area:'2.1 km (Kottawa)',urgency:'Low',error:'',source:'Service request',target:'ticket-pending'});}
  else {text(20,368,'Completed Jobs',14,T.textSecondary,600);job(402,{code:'JOB-1037',title:'MC4 connector replacement',completed:true,target:'ticket-completed'});}
  nav();
}
function ticket(status='pending') {
  back();text(20,138,'JOB TICKET · JOB-1042',11,T.textSecondary,600);rect(357,143,8,8,T.red,4);text(20,164,'Solis Inverter Fault · 5 kW',18,T.text,600);
  panel(206,196,'Client Info','user');text(34,249,'Name: Kamal Jayasinghe',14);text(34,276,'Contact: +94 77 000 0000',14);text(34,303,'No. 12, School Lane, Athurugiriya',14);
  button(338,copy.detail.navigate.toUpperCase(),null,{x:34,w:322});
  panel(416,158,'System Telemetry');text(34,460,'Auto-detected',14);text(34,484,'Inverter: Solis 5 kW Single Phase',14);text(34,508,'Fault location: String 2',14);
  rect(34,536,322,28,T.redSoft,8,T.redBorder,'Fault code');text(43,541,'Error F05: DC Arc Fault on String 2',12,T.red,700,305);
  panel(588,149,'Maintenance History Timeline','history');rect(38,635,8,8,T.blue,4);rect(41,649,1,31,T.borderStrong);text(56,629,'2026-02-14: Battery Replacement',13,T.text,600,295);text(56,651,'by Thilanka',12,T.textMuted);rect(38,689,8,8,T.blue,4);text(56,683,'2025-10-12: DC Fuse Fixed',13,T.text,600,295);text(56,705,'by Thilanka',12,T.textMuted);
  if(status==='pending')button(757,copy.detail.accept.toUpperCase(),'ticket-active');
  if(status==='active'){rect(20,757,350,50,T.orangeSoft,12,T.orangeBorder,'Accepted status');text(34,773,'You accepted this job on 2026-10-14.',12);button(827,copy.closure.complete.toUpperCase(),'closure-empty');}
  if(status==='completed'){
    panel(757,173,'Repair Completion Record','circle-check');text(34,800,'Replaced damaged MC4 connector.\nSystem verified stable after repair.',13,T.text,400,322);
    ['Test DC voltage','Inspect MC4 joint','Check isolation switch'].forEach((l,i)=>{icon(34,850+i*24,'check',T.green,15);text(58,848+i*24,l,12,T.textSecondary);});
    evidence(944,true,true);rect(20,1270,350,48,T.greenSoft,12,T.greenBorder);text(34,1286,'Completed on 2026-10-14.',12,T.green,600);
  }
}
function checks(y,done=0,editable=true) {['Test DC voltage','Inspect MC4 joint','Check isolation switch'].forEach((label,i)=>{rect(34,y+i*48,26,26,i<done?T.orange:T.card,4,i<done?T.orange:T.borderStrong,'Checklist · '+label,{opacity:editable?1:0.5});if(i<done)icon(37,y+3+i*48,'check',T.onAccent,20);text(70,y+3+i*48,label,14,i<done?T.textSecondary:T.text,400,280);});}
function evidence(y,hasPhoto=false,readOnly=false) {
  panel(y,hasPhoto?(readOnly?310:378):180,'Repair Evidence','camera');text(34,y+48,'Take a photo or choose a JPG/PNG from\nyour gallery, up to 10 MB.',13,T.textSecondary,400,320);
  if(!readOnly){button(y+97,'Take Photo','closure-ready',{x:34,w:156,secondary:true});button(y+97,'Choose Photo','closure-ready',{x:200,w:156,secondary:true});}
  if(!hasPhoto)text(34,y+151,copy.closure.noPhotos,13,T.textSecondary);
  else {const py=y+(readOnly?96:163);rect(34,py,322,180,T.cardRaised,10,null,'Repair photo placeholder');icon(176,py+63,'image',T.textMuted,32);text(92,py+109,'Repair photo · sample placeholder',11,T.textMuted,400,266);text(34,py+189,'Saved 14/10/2026, 10:35',12,T.textSecondary);}
}
function closure(ready=false) {
  back('Active Job: Solis Inverter F05','ticket-active');text(20,144,copy.closure.title,20,T.text,600);note(176,copy.closure.subtitle);
  evidence(214,ready);const y=ready?612:414;panel(y,212,copy.closure.checklist,'list-checks');text(283,y+17,ready?'3 / 3 done':'0 / 3 done',11,T.textSecondary,600,78);checks(y+53,ready?3:0);
  panel(y+226,222,copy.closure.notes,'file-text');rect(34,y+277,322,96,T.bg,10,T.borderStrong,'Resolution notes input');text(46,y+290,ready?'Replaced damaged MC4 connector on\nstring 2. System verified stable.':'Describe the repair…',13,ready?T.text:T.textMuted,400,296);
  text(34,y+393,ready?'Notes saved':'Unsaved changes',12,T.textSecondary,400,155);button(y+382,'Save Notes',ready?null:'closure-ready',{x:235,w:120,secondary:true,disabled:ready});
  if(!ready){note(y+458,'Add at least one repair photo before\nclosing the ticket.');note(y+496,'Write at least 10 characters describing the repair.');}
  button(y+(ready?467:539),copy.closure.complete.toUpperCase(),'board-completed',{disabled:!ready});
}
function fault(y,expanded=false,pending=false,medium=false){
  const c=medium?T.amber:T.red;rect(20,y,350,expanded?403:166,medium?T.amberSoft:T.redSoft,16,medium?T.orangeBorder:T.redBorder,'Fault alert');rect(37,y+21,7,7,c,4);
  text(51,y+15,medium?'FAULT ALERT':'CRITICAL ALERT',10,c,600,195);text(293,y+15,medium?'JOB-1043':'JOB-1042',10,T.textMuted,600,75);
  text(36,y+44,medium?'Error Code: F12':'Error Code: F05',17,T.text,600);text(36,y+76,medium?'PV string voltage below expected range':'DC Arc Fault on String 2',13,T.textSecondary);text(36,y+101,medium?'Location: Malabe':'Location: String 2',13,T.textSecondary);
  text(36,y+137,expanded?'Hide details':'Show details',12,T.textSecondary,600,150);hot(30,y+123,180,40,expanded?'diagnostics':'diagnostics-expanded','Expand diagnostics');text(277,y+137,'View Job',12,T.orange,600,75);hot(256,y+122,100,44,pending?'ticket-pending':'ticket-active','View full ticket');
  if(expanded){line(y+173,36,318);text(36,y+185,'Solis 5 kW Single Phase',13,T.textSecondary);text(36,y+218,'DIAGNOSTIC CHECKLIST',11,T.textSecondary,600,252);text(286,y+218,pending?'0 / 3 done':'1 / 3 done',11,T.textMuted,400,78);checks(y+245,pending?0:1,!pending);if(pending)text(36,y+383,copy.alert.acceptToStart,11,T.textMuted,400,318);}
}
function diagnostics(expanded=false,pending=false,empty=false) {text(20,91,copy.alert.sectionTitle.toUpperCase(),12,T.textSecondary,600);if(empty){rect(20,129,350,160,T.card,14,T.border);icon(182,154,'shield-check',T.green,26);text(120,208,copy.alert.noneTitle,14,T.text,600,245);text(88,240,copy.alert.noneBody,12,T.textMuted,400,284);}else{fault(130,expanded,pending);fault(expanded?550:314,false,false,true);}nav('diagnostics');}
function systemCard(y,status='Fault',name='Kamal Jayasinghe') {const c=status==='Healthy'?T.green:['Degraded','Stale reading','No reading'].includes(status)?T.amber:T.red;rect(16,y,358,169,T.card,14,T.border,'System · '+name);text(28,y+14,name,14,T.text,600,210);rect(270,y+10,90,28,status==='Healthy'?T.greenSoft:T.redSoft,7);text(277,y+16,status,11,c,600,87);text(28,y+46,'INV-SOL-001 · 5.0 kW · 12 panels',11,T.textSecondary);if(status==='Fault')text(28,y+69,'F05 · DC Arc Fault on String 2',11,T.red);line(y+91,28,332);[['Output','0.00 kW'],['Today','12.5 kWh'],['Battery','72%']].forEach(([l,v],i)=>{text(28+i*112,y+101,l,11,T.textSecondary,400,105);text(28+i*112,y+120,v,12,status==='Stale reading'?T.textMuted:T.text,600,106);});text(28,y+148,status==='Stale reading'?'Reading 125s ago · Last known':'Reading 8s ago',11,T.textMuted,400,260);if(status==='Fault'){text(290,y+146,'View Job',12,T.orange,600,73);hot(269,y+128,90,40,'ticket-active','System fault ticket');}}
function health(mode='all') {
  text(16,87,'System health',20,T.text,600);icon(350,88,'activity');text(16,120,copy.health.source,10,T.textMuted);
  [['4','Systems',T.text],['1','Healthy',T.green],['3','Needs attention',T.red]].forEach(([v,l,c],i)=>{text(16+i*122,151,v,16,c,600,28);text(36+i*122,154,l,10,T.textSecondary,400,106);});
  text(16,189,'Data feed',12,T.text,600,240);text(304,189,mode==='partial'?'2 / 4 fresh':'4 / 4 fresh',10,T.textMuted,400,80);
  if(mode==='partial')text(16,210,copy.feed.partial,10,T.amber);
  const my=mode==='partial'?237:224;
  [['Production','16.80 kW',T.orange],['Consumption','12.40 kW',T.text],['Net balance',mode==='partial'?'—':'4.40 kW',T.green],['Pool today','43.20 kWh',T.text],['Open faults','2 devices',T.red],['Repair jobs','4 open',T.text]].forEach(([l,v,c],i)=>{const x=16+(i%3)*122,y=my+Math.floor(i/3)*58;text(x,y,l,10,T.textSecondary,400,113);text(x,y+19,v,17,c,600,114);});
  const fy=my+121;rect(16,fy,358,166,T.heroStart,14,T.orangeBorder,'Community balance',{gradient:T.heroEnd});text(28,fy+14,'COMMUNITY BALANCE',10,T.orange,600);
  text(28,fy+37,mode==='partial'?'Balance needs fresh readings from all\nhouseholds.':'4.40 kW surplus after household demand.',12,T.textSecondary,400,330);
  [['sun','Owners'],['zap','Pool'],['house','Consumers']].forEach(([ico,label],i)=>{const x=43+i*123;rect(x,fy+81,38,38,T.orangeSoft,19,T.orangeBorder);icon(x+9,fy+90,ico);text(x-6,fy+124,label,10,T.textSecondary,400,85);if(i<2)icon(x+69,fy+91,'arrow-right',T.orange,16);});text(178,fy+144,'↓ Grid',10,T.green,400,80);
  const q=fy+179;rect(16,q,358,46,T.card,12,T.borderStrong,'System search');icon(29,q+13,'search',T.textMuted,18);text(59,q+14,mode==='search'?'No matching owner':'Search owner or inverter',13,T.textMuted,400,290);
  button(q+58,'All systems','health',{x:16,w:112,secondary:true});button(q+58,'Needs attention','health-attention',{x:140,w:150,secondary:true});
  if(mode==='search'){text(67,q+146,copy.health.noMatches,13,T.textSecondary,400,289);}else{systemCard(q+124);systemCard(q+305,mode==='attention'?'Stale reading':'Healthy','Nadeesha Silva');systemCard(q+486,'Offline','Saman Fernando');}nav('health');
}
function profile(edit=false) {
  rect(16,98,358,240,'#22C55E',24,null,'Technician profile hero',{gradient:'#15803D'});rect(159,124,72,72,'#FFFFFF',36);text(177,145,'NP',26,'#172331',800,64);text(102,219,'Welcome, Nimal',22,'#FFFFFF',800,290);text(98,254,'nimal@example.com',13,'#FFFFFF',400,280);
  rect(77,284,118,30,'#187547',15);text(91,291,'Technician',12,'#FFFFFF',800,112);rect(207,284,115,30,'#187547',15);text(217,291,'Status: Active',12,'#FFFFFF',600,110);
  rect(16,354,358,edit?403:330,T.card,20,T.border,'Profile details');text(34,373,'Profile Details',16,T.text,800,245);text(302,377,edit?'Cancel':'Edit',12,T.orange,800,66);hot(288,363,76,44,edit?'profile':'profile-edit','Edit profile');
  text(34,420,'Registered Role',13,T.textSecondary,600,230);text(267,420,'Technician',14,T.text,700,100);line(451,34,322);
  const rows=[['Full Name','Nimal Perera'],['Mobile Number','+94 77 000 0000'],['Household ID','H-0091']];
  rows.forEach(([l,v],i)=>{const y=edit?466+i*80:471+i*50;text(34,y,l,12,T.textSecondary,600,180);if(edit){rect(34,y+23,322,44,T.bg,10,T.borderStrong,l+' input');text(47,y+35,v,14);}else{text(204,y,v,13,T.text,700,164);line(y+34,34,322);}});
  text(34,edit?726:623,'Account Status',13,T.textSecondary,600,220);text(303,edit?726:623,'Active',13,T.green,700,65);
  const ly=edit?773:700;rect(16,ly,358,108,T.card,18,T.border,'Language selector');text(30,ly+15,'Language',13,T.text,700);[['English','en'],['සිංහල','si'],['தமிழ்','ta']].forEach(([l,font],i)=>{rect(30+i*109,ly+48,101,40,i?T.card:T.orangeSoft,14,i?T.border:T.orangeBorder);text(43+i*109,ly+58,l,13,i?T.textSecondary:T.orange,700,93,'Language '+font);s.ops[s.ops.length-1].script=font;});
  if(edit)button(ly+124,'Save Changes','profile');button(ly+(edit?190:126),'Logout','logout',{color:'#C13232'});nav('profile');
}
function settings(){board();rect(0,0,390,s.h,'#000000',0,null,'Modal backdrop',{opacity:0.45});const y=s.h-425;rect(0,y,390,425,T.card,24,null,'Workspace settings sheet');text(24,y+25,'Workspace settings',22,T.text,700,300);icon(347,y+28,'x',T.text);hot(332,y+12,44,44,'board-active','Close settings');text(24,y+83,'Appearance',12,T.text,700);
  [['smartphone','System'],['sun','Light'],['moon','Dark']].forEach(([ico,l],i)=>{const x=24+i*117;const active=l.toLowerCase()===s.theme;rect(x,y+113,108,80,active?T.orangeSoft:T.card,12,active?T.orangeBorder:T.borderStrong);icon(x+43,y+126,ico,active?T.orange:T.textSecondary,22);text(x+28,y+164,l,12,T.text,600,85);if(l!=='System')hot(x,y+113,108,80,'settings','Choose '+l,l.toLowerCase());s.ops[s.ops.length-1].targetTheme=l.toLowerCase()==='system'?s.theme:l.toLowerCase();});line(y+211,24,342);text(24,y+235,'Incident alerts',12,T.text,700);text(24,y+259,'Sounds while this workspace is open',12,T.textSecondary,400,340);button(y+301,'Sound on',null,{x:24,w:151,secondary:true});button(y+301,'Test sound',null,{x:187,w:178,secondary:true});text(24,y+365,'In a browser, tap Test sound once to allow audio.',11,T.textSecondary,400,346);}
function alert(){rect(20,84,350,152,T.cardRaised,14,T.red,'New fault notification');icon(33,99,'bell-ring',T.red);text(61,98,'New system fault',12,T.text,600,260);icon(336,99,'x',T.textSecondary,17);hot(326,87,44,44,'board-active','Dismiss notification');text(33,132,'Solis Inverter Fault · 5 kW',14,T.text,700);text(33,163,'JOB-1042 · F05 · Kamal Jayasinghe',12,T.textSecondary,400,323);text(33,200,'Review incident →',13,T.orange,600,320);hot(27,189,320,40,'ticket-pending','Review incident');hero(256);tabs('active',464);text(20,535,'Active Job Ticket',14,T.textSecondary,600);job(568);nav();}
function stateComponents() {text(20,96,'Operational states',22,T.text,700);let y=148;[['Loading','Loading job tickets…',T.orange],['No active job',copy.dashboard.noActive,T.textSecondary],['No completed jobs',copy.dashboard.noCompleted,T.textSecondary],['Upload error','Could not upload this photo. Please try again.',T.red],['Preview error','Retry photo previews',T.orange],['Camera permission','Allow camera access in device settings.\nYou can also choose a photo from your gallery.',T.amber],['History unavailable',copy.detail.historyError,T.textMuted],['Sound unavailable','Check device volume and try Test sound.',T.amber],['Saving','Saving notes… / Uploading photo…',T.orange]].forEach(([title,body,c])=>{rect(20,y,350,84,T.card,14,T.border,title);text(34,y+12,title,13,c,600);text(34,y+37,body,12,T.textSecondary,400,322);y+=97;});}
const specs=[
 ['board-active','Dashboard · Active',900,()=>board()],['board-pending','Dashboard · Pending',900,()=>board('pending')],['board-completed','Dashboard · Completed',844,()=>board('completed')],
 ['ticket-pending','Pending ticket · Diagnostic dossier',844,()=>ticket()],['ticket-active','Active ticket · Accepted by you',940,()=>ticket('active')],['closure-empty','Close ticket · Evidence required',1100,()=>closure()],['closure-ready','Close ticket · Ready to resolve',1190,()=>closure(true)],['ticket-completed','Completed ticket · Repair record',1350,()=>ticket('completed')],
 ['diagnostics','Diagnostics · Collapsed alerts',844,()=>diagnostics()],['diagnostics-expanded','Diagnostics · Editable checklist',844,()=>diagnostics(true)],['diagnostics-pending','Diagnostics · Pending read-only',844,()=>diagnostics(true,true)],['diagnostics-empty','Diagnostics · All systems healthy',844,()=>diagnostics(false,false,true)],
 ['health','System health · Community feed',1280,()=>health()],['health-attention','System health · Needs attention',1280,()=>health('attention')],['health-partial','System health · Partial readings',1300,()=>health('partial')],['health-search','System health · No search results',844,()=>health('search')],
 ['profile','Profile · Technician',970,()=>profile()],['profile-edit','Profile · Edit details',1130,()=>profile(true)],['settings','Workspace settings · Appearance and sound',900,settings],['new-fault','New fault · Foreground notification',900,alert],
 ['board-empty','Dashboard · Empty pending queue',844,()=>board('pending','empty')],['board-loading','Dashboard · Initial loading',844,()=>board('active','loading')],['board-error','Dashboard · Load error and retry',844,()=>board('active','error')],['board-offline','Dashboard · Offline connection',900,()=>board()],
 ['health-error','System health · Unavailable',844,()=>{text(16,90,'System health',20,T.text,600);text(16,126,copy.health.source,10,T.textMuted);rect(16,166,358,105,T.redSoft,12);text(28,180,copy.health.loadError,12,T.textSecondary,400,330);button(214,'Retry','health',{x:28,w:100,secondary:true});nav('health');}],
 ['logout','Profile · Logout confirmation',970,()=>{profile();rect(0,0,390,s.h,'#000000',0,null,'Dialog backdrop',{opacity:.45});rect(28,346,334,196,T.card,20,T.border,'Native logout dialog');text(50,369,'Logout',20,T.text,700);text(50,410,'Are you sure you want to log out\nof SolarCoop?',13,T.textSecondary,400,290);button(472,'Cancel','profile',{x:50,w:130,secondary:true});button(472,'Log Out',null,{x:196,w:144,color:'#C13232'});}],
 ['state-components','Additional error and busy states',1080,stateComponents],
 ['health-statuses','System health · All status variants',1240,()=>{text(16,94,'System status variants',20,T.text,600);['Healthy','Fault','Offline','Degraded','Stale reading','No reading'].forEach((status,i)=>systemCard(144+i*177,status,'Demo household '+(i+1)));}]
];
for(const theme of ['light','dark'])for(const [id,name,h,draw] of specs){T=palettes[theme];s={id,theme,name,h,w:390,ops:[]};header(id==='board-offline'?'Offline':id==='board-loading'?'Syncing':'Live');draw();screens.push(s);}
const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function svg(screen){let defs='';const body=screen.ops.map((o,i)=>{const opacity=o.opacity==null?'':` opacity="${o.opacity}"`;if(o.kind==='hotspot')return '';if(o.kind==='text')return `<text x="${o.align ? o.x+o.w/2 : o.x}" text-anchor="${o.align ? 'middle' : 'start'}" y="${o.y+o.size}" font-family="Inter,Segoe UI,Nirmala UI,sans-serif" font-size="${o.size}" fill="${o.color}" font-weight="${o.weight}">${o.value.split('\n').map((l,j)=>`<tspan x="${o.align ? o.x+o.w/2 : o.x}" dy="${j?o.size*1.45:0}">${esc(l)}</tspan>`).join('')}</text>`;if(o.kind==='icon')return `<g transform="translate(${o.x} ${o.y}) scale(${o.w/24})">${o.svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'').replace(/<g/,'<g')}</g>`.replace('<g transform=',`<g fill="none" stroke="${o.svg.match(/stroke="([^"]+)/)[1]}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" transform=`);let fill=o.fill||'none';if(o.gradient){const id='g'+i;defs+=`<linearGradient id="${id}" x2="1" y2="1"><stop stop-color="${fill}"/><stop offset="1" stop-color="${o.gradient}"/></linearGradient>`;fill='url(#'+id+')';}if(o.kind==='ellipse')return `<ellipse cx="${o.x+o.w/2}" cy="${o.y+o.h/2}" rx="${o.w/2}" ry="${o.h/2}" fill="${fill}" stroke="${o.stroke||'none'}"${opacity}/>`;return `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${o.r||0}" fill="${fill}" stroke="${o.stroke||'none'}"${opacity}/>`;}).join('');return `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="${screen.h}" viewBox="0 0 390 ${screen.h}"><title>${esc(screen.name)} · ${screen.theme}</title><defs>${defs}</defs><rect width="390" height="${screen.h}" fill="${palettes[screen.theme].bg}"/>${body}</svg>`;}
fs.mkdirSync(path.join(OUT,'svg'),{recursive:true});fs.mkdirSync(path.join(OUT,'plugin'),{recursive:true});
for(const screen of screens)fs.writeFileSync(path.join(OUT,'svg',screen.theme+'-'+screen.id+'.svg'),svg(screen));
fs.writeFileSync(path.join(OUT,'screens.json'),JSON.stringify({palettes,screens},null,2));
const preview=`<!doctype html><html><meta charset="utf-8"><title>SolarCoop · Technician design handoff</title><style>*{box-sizing:border-box}body{margin:0;background:#10151c;color:#edf3f9;font:15px 'Segoe UI',sans-serif}header{padding:40px 48px;border-bottom:1px solid #2b3948}h1{font-size:34px;margin:8px 0 12px;letter-spacing:-1px}p{color:#b1bfce;max-width:940px;line-height:1.6}.eyebrow{color:#ffad70;letter-spacing:2px;font-size:12px}nav{display:flex;gap:12px;padding-top:16px}button,a{background:#23303d;color:#eef3f8;border:1px solid #465669;padding:12px 18px;border-radius:10px;cursor:pointer;text-decoration:none}button.active{border-color:#ffad70;color:#ffad70}main{padding:32px 48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,390px));gap:34px}article h2{font-size:15px;margin:0 0 8px}article p{font-size:12px;margin:0 0 12px}article img{width:100%;display:block;border:1px solid #465669;border-radius:14px}article a{display:inline-block;font-size:12px;margin-top:12px}</style><header><div class="eyebrow">SOLARCOOP / IMPLEMENTATION HANDOFF / 14 OCT 2026</div><h1>Technician workspace</h1><p>All current technician areas, reconstructed from app source. ${specs.length} screen and state designs in each theme. Sample names, measurements, dates, and repair-photo placeholders are illustrative. Long frames show scroll content. Use the importer for native editable Figma text and shapes.</p><nav><button class="active" data-theme="light">Light theme</button><button data-theme="dark">Dark theme</button><a href="README.md">Import instructions</a></nav></header><main id="screens"></main><script>const specs=${JSON.stringify(specs.map(([id,name,h])=>({id,name,h})))};function show(theme){document.querySelector('#screens').innerHTML=specs.map((s,i)=>'<article><h2>'+String(i+1).padStart(2,'0')+' / '+s.name+'</h2><p>390 × '+s.h+' · '+theme+'</p><img loading="lazy" src="svg/'+theme+'-'+s.id+'.svg"><a href="svg/'+theme+'-'+s.id+'.svg" download>Download SVG</a></article>').join('');document.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.theme===theme));}document.querySelectorAll('button').forEach(b=>b.onclick=()=>show(b.dataset.theme));show('light');</script></html>`;
fs.writeFileSync(path.join(OUT,'preview.html'),preview);
fs.writeFileSync(path.join(OUT,'plugin','manifest.json'),JSON.stringify({name:'SolarCoop · Current Technician Workspace',api:'1.0.0',main:'code.js',editorType:['figma'],documentAccess:'dynamic-page',networkAccess:{allowedDomains:['none']}},null,2));
const runtime=fs.readFileSync(path.join(OUT,'importer-runtime.js'),'utf8');
fs.writeFileSync(path.join(OUT,'plugin','code.js'),'const DATA = '+JSON.stringify({palettes,screens})+';\n'+runtime);
console.log('Generated '+screens.length+' screen SVGs, native Figma importer, and preview.');



