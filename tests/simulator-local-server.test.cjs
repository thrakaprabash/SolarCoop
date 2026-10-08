const {test}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs/promises');
const pause=ms=>new Promise(done=>setTimeout(done,ms));
async function until(fn){const end=Date.now()+12000;while(Date.now()<end){if(await fn())return;await pause(50);}throw Error('Local simulator did not become ready');}
test('automatic local runner hides its key, drives ticks without a browser, and serializes controls',async()=>{
 let port,output='',key,tab,writes=0;const calls=[];
 const snapshot={config:{running:false,mode:'demo',sim_time:'12:00',speed:60,weather:'sunny',random_faults:false},faults:[],events:[],devices:[{id:'one',household_user_id:'owner-a',capacity_kw:4,panel_count:8,string_count:2,panel_health:Array(8).fill(1),load_profile:'family',load_factor:1,battery_kwh:0,battery_level:50}]};
 const backend=http.createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;
  const params=JSON.parse(body),name=req.url.split('/').pop().replace('sim_','');calls.push({name,params});
  assert.match(params.p_key,/^[a-f0-9]{48}$/);key ||= params.p_key;assert.equal(params.p_key,key);
  if(params.p_tab_id){tab ||= params.p_tab_id;assert.equal(params.p_tab_id,tab);}
  let data=null;
  if(name==='claim_lease')data=true;
  if(name==='snapshot'||name==='bootstrap')data=snapshot;
  if(name==='update_config')Object.assign(snapshot.config,params.p_patch);
  if(name==='push_tick'){writes++;snapshot.config.sim_time=params.p_sim_time;snapshot.devices[0].metrics={instant_production:params.p_batch[0].instant_production};}
  if(name==='reset')snapshot.config.running=false;
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));
 });
 await new Promise(done=>backend.listen(0,'127.0.0.1',done));
 const child=spawn(process.execPath,['simulator/server.cjs'],{cwd:path.resolve('.'),windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,SIM_PORT:'0',EXPO_PUBLIC_SUPABASE_URL:'http://127.0.0.1:'+backend.address().port,EXPO_PUBLIC_SUPABASE_ANON_KEY:'local-test-public-key'}});
 child.stdout.on('data',chunk=>{output+=chunk;port ||= Number(output.match(/http:\/\/localhost:(\d+)/)?.[1]);});child.stderr.on('data',chunk=>output+=chunk);
 try {
  await until(()=>port&&writes>0);const base='http://127.0.0.1:'+port;
  assert.equal(snapshot.config.running,true);assert(snapshot.devices[0].metrics.instant_production>0);
  const runtime=await(await fetch(base+'/runtime-config.js')).text();assert(runtime.includes('HEADLESS=true'));assert(!runtime.includes(key));
  for(const file of ['.demo-key','.demo-setup.sql','config.js'])assert.equal((await fetch(base+'/'+file)).status,404);
  const health=await(await fetch(base+'/health')).json();assert.equal(health.headless,true);
  const invoke=(name,body,headers={})=>fetch(base+'/api/sim/'+name,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
  const before=calls.length;
  assert.equal((await invoke('update_config',{p_patch:{weather:'storm'}},{Origin:'https://other-site.example'})).status,403);assert.equal(calls.length,before);
  assert.equal((await invoke('set_key',{})).status,405);
  const response=await invoke('update_config',{p_key:'override',p_tab_id:'override',p_patch:{weather:'cloudy'}});
  assert.equal(response.status,200);assert.equal(snapshot.config.weather,'cloudy');
  assert(!output.includes(key));
  const sql=await fs.readFile('simulator/.demo-setup.sql','utf8');assert(sql.includes('select public.sim_set_key('));assert(sql.includes(key));
  assert(sql.includes('trg_profile_sim_device'));assert(!sql.includes('require_key=false'));
  const ticks=writes;await until(()=>writes>ticks); // No browser page has been opened.
 }finally{
  child.kill();await new Promise(done=>{if(child.exitCode!==null)done();else child.once('exit',done);});
  backend.closeAllConnections();await new Promise(done=>backend.close(done));
 }
});
