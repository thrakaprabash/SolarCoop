const fs = require('fs');
const path = require('path');
const out = __dirname;
const themes = {
  light: {bg:'#FFFFFF',card:'#FFF9F2',soft:'#FFF3E6',text:'#221408',muted:'#6F5B45',line:'#F0E3D3',green:'#2F9E63'},
  dark: {bg:'#121212',card:'#1E1E1E',soft:'#26241F',text:'#F7F3EE',muted:'#B8AFA5',line:'#35312C',green:'#48BB78'}
};
const orange='#ED8936', amber='#F6AD55';
const rect=(x,y,w,h,r,fill,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const txt=(x,y,s,size,fill,weight=400,anchor='start')=>`<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${s}</text>`;
const line=(x1,y1,x2,y2,c,w=2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
const circle=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
function mark(c, x=0,y=0,size=180){return `<g transform="translate(${x} ${y}) scale(${size/200})" aria-label="SolarCoop sun and three homes">${circle(100,88,48,'url(#sun)')}<g stroke="${amber}" stroke-width="10" stroke-linecap="round"><path d="M100 8V28M62 18L73 36M30 45L48 55M17 87H37M138 18L127 36M170 45L152 55M183 87H163"/></g><g fill="${c}"><path d="M20 139L48 111L76 139V175H20Z"/><path d="M80 126L108 98L136 126V175H80Z"/><path d="M136 139L164 111L192 139V175H136Z"/></g></g>`;}
function brand(t,x=28,y=77){return `${mark(t.text,x,y-32,40)}${txt(x+49,y,'SolarCoop',21,t.text,750)}`;}
function shell(t,name,body){return `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844" role="img" aria-labelledby="title"><title id="title">${name}</title><defs><linearGradient id="sun" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${amber}"/><stop offset="1" stop-color="${orange}"/></linearGradient></defs>${rect(0,0,390,844,0,t.bg)}${body}${rect(139,825,112,4,2,t.text)}</svg>`;}
function status(t){return `${txt(28,30,'9:41',14,t.text,650)}<g fill="${t.text}">${rect(305,22,3,5,1,t.text)}${rect(310,19,3,8,1,t.text)}${rect(315,16,3,11,1,t.text)}</g><path d="M325 20Q332 13 339 20M328 23Q332 19 336 23" fill="none" stroke="${t.text}" stroke-width="2" stroke-linecap="round"/>${rect(347,16,20,11,3,'none',t.text)}${rect(349,18,15,7,1,t.text)}${rect(368,19,2,5,1,t.text)}`;}
function button(t,label,y=727,secondary=false){return `${rect(28,y,334,56,18,secondary?t.bg:orange,secondary?t.line:'none')}${txt(195,y+35,label,16,secondary?t.text:'#221408',700,'middle')}${secondary?'':`<path d="M329 ${y+23}L334 ${y+28}L329 ${y+33}M323 ${y+28}H334" fill="none" stroke="#221408" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`}`;}
function dots(t,i){let x=163.5;return [0,1,2].map(n=>{const w=n===i?25:7;const v=rect(x,683,w,7,4,n===i?orange:t.line);x+=w+12;return v;}).join('');}
function house(t,x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">${rect(0,37,90,70,8,t.bg,t.line)}<path d="M-8 40L45 0L98 40" fill="${t.text}"/><path d="M8 22L39 0H69L88 22Z" fill="#386572"/><g stroke="#8AB2BC" stroke-width="1"><path d="M15 14H81M23 7H73M33 3L22 22M47 1L47 22M60 1L72 22"/></g>${rect(12,55,20,22,3,amber)}${rect(58,55,20,22,3,amber)}${rect(37,72,17,35,3,t.soft)}</g>`;}
function pill(t,x,y,label,w){return `${rect(x,y,w,32,16,t.bg,t.line)}${circle(x+15,y+16,4,t.green)}${txt(x+27,y+21,label,11,t.text,600)}`;}
function monitoring(t){return `${circle(195,291,145,t.soft)}${circle(282,194,31,'url(#sun)')}${line(282,150,282,142,amber,3)}${line(322,174,328,170,amber,3)}${house(t,89,225,1.75)}${rect(45,358,178,86,20,t.bg,t.line)}${txt(63,383,'SOLAR GENERATION',9,t.muted,650)}${txt(63,415,'Live energy',17,t.text,700)}<path d="M155 415L166 400L177 407L188 389L207 396" fill="none" stroke="${orange}" stroke-width="3" stroke-linecap="round"/>${pill(t,227,325,'System online',122)}<path d="M42 210C22 191 37 169 53 177C66 157 94 176 82 194H48" fill="${t.card}"/>`;
}
function sharing(t){return `${circle(195,293,145,t.soft)}${circle(195,192,29,'url(#sun)')}<path d="M89 331Q195 427 301 331M89 311Q195 241 301 311" fill="none" stroke="${orange}" stroke-width="2" stroke-dasharray="5 7"/>${house(t,53,269,.87)}${house(t,249,269,.87)}${house(t,151,217,.98)}${rect(132,367,126,58,18,t.bg,t.line)}${txt(195,391,'Shared locally',12,t.muted,500,'middle')}${txt(195,412,'Better together',13,t.text,700,'middle')}${circle(91,240,19,t.bg)}${circle(300,240,19,t.bg)}<path d="M83 241L89 247L101 233M292 241L298 247L310 233" fill="none" stroke="${t.green}" stroke-width="2"/>${pill(t,105,146,'Your energy community',180)}`;}
function support(t){return `${circle(195,291,145,t.soft)}${rect(105,170,180,261,27,t.bg,t.line)}${rect(166,182,58,5,3,t.line)}${rect(120,206,150,95,16,t.card)}<path d="M195 222L218 232V248Q217 267 195 279Q173 267 172 248V232Z" fill="${t.green}"/><path d="M183 246L192 255L208 238" fill="none" stroke="${t.bg}" stroke-width="3" stroke-linecap="round"/>${txt(195,291,'You’re in good hands',10,t.text,650,'middle')}${rect(121,315,149,37,11,t.soft)}${circle(139,333,5,orange)}${txt(152,337,'Timely system alerts',10,t.text,600)}${rect(121,360,149,37,11,t.soft)}${circle(139,378,5,t.green)}${txt(152,382,'Technician support',10,t.text,600)}${rect(49,399,108,58,16,t.bg,t.line)}${txt(65,423,'STATUS',9,t.muted,650)}${txt(65,443,'All connected',12,t.text,700)}${circle(294,211,25,orange)}<path d="M285 211L292 218L304 204" fill="none" stroke="#221408" stroke-width="3" stroke-linecap="round"/>`;
}
const slides=[
  {id:'02-monitor',kicker:'YOUR ENERGY, AT A GLANCE',title:['See your solar.','Know your power.'],copy:['Keep generation and usage in view,','with a clear picture of your solar system.'],art:monitoring},
  {id:'03-community',kicker:'A BRIGHTER COMMUNITY',title:['Good energy.','Shared together.'],copy:['Connect with your local solar community','and put surplus energy to better use.'],art:sharing},
  {id:'04-support',kicker:'CONNECTED AND CARED FOR',title:['Stay informed.','Feel supported.'],copy:['Get system alerts and connect with','technicians when your solar needs care.'],art:support}
];
const files=[];
for(const [mode,t] of Object.entries(themes)){
  const dir=path.join(out,'svg',mode);fs.mkdirSync(dir,{recursive:true});
  const screens=[];
  screens.push(['00-opening','Opening',`${circle(195,355,144,t.soft)}${circle(195,355,116,t.card)}${mark(t.text,105,269,180)}${txt(195,512,'SolarCoop',38,t.text,750,'middle')}${txt(195,546,'Share the sun.',18,t.muted,400,'middle')}${txt(195,756,'A brighter tomorrow starts together.',12,t.muted,500,'middle')}`]);
  screens.push(['01-loading','Loading',`${mark(t.text,125,247,140)}${txt(195,450,'SolarCoop',32,t.text,750,'middle')}${txt(195,480,'Share the sun.',16,t.muted,400,'middle')}${rect(104,551,182,4,2,t.line)}${rect(104,551,116,4,2,orange)}${txt(195,585,'Getting things ready…',13,t.muted,500,'middle')}${txt(195,756,'Your solar community, connected.',12,t.muted,500,'middle')}`]);
  slides.forEach((s,i)=>screens.push([s.id,s.title.join(' '),`${status(t)}${brand(t)}${txt(359,76,'Skip',13,t.muted,600,'end')}${s.art(t)}${txt(28,493,s.kicker,10,mode==='dark'?amber:'#9A4716',700)}${s.title.map((l,n)=>txt(28,538+n*39,l,33,t.text,750)).join('')}${s.copy.map((l,n)=>txt(28,616+n*22,l,14,t.muted)).join('')}${dots(t,i)}${button(t,i===2?'Get started':'Next')}`]));
  screens.push(['05-welcome','Welcome',`${status(t)}${brand(t)}${circle(195,286,126,t.soft)}${mark(t.text,116,201,156)}${txt(195,454,'Welcome to a',32,t.text,750,'middle')}${txt(195,494,'brighter everyday.',32,t.text,750,'middle')}${txt(195,538,'Your solar. Your community.',15,t.muted,400,'middle')}${txt(195,561,'All connected in one place.',15,t.muted,400,'middle')}${button(t,'Create an account',651)}${button(t,'Log in',720,true)}${txt(195,799,'Share the sun. Grow together.',11,t.muted,500,'middle')}`]);
  for(const [id,title,body] of screens){const name=`${id}.svg`;fs.writeFileSync(path.join(dir,name),shell(t,`SolarCoop — ${title} — ${mode}`,body));files.push({mode,id,title,file:`svg/${mode}/${name}`});}
  const assets=path.join(out,'brand');fs.mkdirSync(assets,{recursive:true});
  fs.writeFileSync(path.join(assets,`logo-mark-${mode}.svg`),`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="sun"><stop stop-color="${amber}"/><stop offset="1" stop-color="${orange}"/></linearGradient></defs>${mark(t.text,0,0,200)}</svg>`);
}
fs.writeFileSync(path.join(out,'screens.json'),JSON.stringify(files,null,2));
console.log(`Created ${files.length} screen SVGs and 2 transparent vector logo marks.`);
