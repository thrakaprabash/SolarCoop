const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

function alertService(rows) {
  const filters=[],listeners=[];
  const query={select(columns){assert(columns.includes('resolution_source:closure_record->>source'));return query;},
    eq(...args){filters.push(args);return query;},or(){return query;},order:async()=>({data:rows,error:null})};
  const channel={on(event,filter,callback){listeners.push({filter,callback});return channel;},subscribe(){return channel;}};
  let removed=false;
  const supabase={from:()=>query,channel:()=>channel,removeChannel(){removed=true;}};
  const source=fs.readFileSync('src/services/faultAlertService.js','utf8').replace(/^import[^;]+;\r?\n/gm,'').replaceAll('export ','');
  const service=new Function('supabase',source+';return {fetchMyFaultAlerts,subscribeToMyFaultAlerts};')(supabase);
  return {...service,filters,listeners,removed:()=>removed};
}
test('manual simulator clears remove cards while pending faults and genuine repair confirmations remain',async()=>{
  const service=alertService([
    {id:'cleared',status:'completed',source:'telemetry',resolution_source:'simulator'},
    {id:'repaired',status:'completed',source:'telemetry',resolution_source:null},
    {id:'open',status:'pending',source:'telemetry',resolution_source:null},
    {id:'manual-job',status:'completed',source:'manual',resolution_source:null},
  ]);
  assert.deepEqual((await service.fetchMyFaultAlerts('owner')).map(row=>row.id),['repaired','open','manual-job']);
  assert.deepEqual(service.filters,[['household_user_id','owner']]);
});
test('job changes refresh only the household subscription and clean up',()=>{
  const service=alertService([]);let changes=0;
  const stop=service.subscribeToMyFaultAlerts('owner',()=>changes++);
  assert.deepEqual(service.listeners.map(x=>x.filter.table),['jobs']);
  for(const event of service.listeners){assert.equal(event.filter.filter,'household_user_id=eq.owner');event.callback();}
  assert.equal(changes,1);stop();assert(service.removed());
});

function technicianHarness() {
  const slots=[],effects=[],timers=[];let cursor=0,foreground,realtime,user={id:'tech'},fetchJobs=async()=>[];
  const hooks={createContext:()=>({}),useContext:()=>null,useCallback:f=>f,useMemo:f=>f(),useEffect:f=>effects.push(f),
    useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];}};
  const deps={...hooks,useAuth:()=>({user,profile:{}}),fetchTechnicianJobs:id=>fetchJobs(id),
    subscribeToJobs:(_,callback)=>{realtime=callback;return()=>{};},buildJob:r=>r,createJobMutationQueue:()=>({enqueue:(_,f)=>f()}),
    AppState:{addEventListener:(_,callback)=>{foreground=callback;return{remove(){foreground=null;}};}},
    setInterval:(callback,ms)=>{assert.equal(ms,10000);timers.push(callback);return callback;},clearInterval:()=>{}};
  const source=fs.readFileSync('src/technician/context/TechnicianContext.js','utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm,'').replaceAll('export const ','const ')
    .replace(/return \(\s*<TechnicianContext.Provider\s+value=\{\{/,'return ({')
    .replace(/\}\}\s*>\s*\{children\}\s*<\/TechnicianContext.Provider>\s*\);/,'});');
  const provider=new Function(...Object.keys(deps),source+';return TechnicianProvider;')(...Object.values(deps));
  return {render(){cursor=0;effects.length=0;return provider({children:null});},
    mount(){const cleanups=effects.map(f=>f());return()=>cleanups.forEach(f=>f?.());},
    fetch(fn){fetchJobs=fn;},poll:()=>timers[0](),foreground:()=>foreground('active'),switchUser:id=>user={id},
    push:row=>realtime({eventType:'UPDATE',new:row})};
}
test('technician polling removes cleared pending jobs even without Realtime and foreground refresh reloads',async()=>{
  const h=technicianHarness();let rows=[{id:'fault-job',status:'pending'}];h.fetch(async()=>rows);
  let state=h.render();const stop=h.mount();await state.loadJobs();assert.equal(h.render().jobCounts.pending,1);
  rows=[];await h.poll();assert.equal(h.render().jobCounts.pending,0);
  rows=[{id:'new-fault',status:'pending'}];h.foreground();await Promise.resolve();await Promise.resolve();
  assert.equal(h.render().jobCounts.pending,1);stop();
});
test('an older technician fetch cannot restore a cleared job or cross accounts',async()=>{
  const h=technicianHarness();let release;
  h.fetch(()=>new Promise(resolve=>release=resolve));const old=h.render().loadJobs();
  h.fetch(async()=>[]);await h.render().loadJobs();release([{id:'old-job',status:'pending'}]);await old;
  assert.deepEqual(h.render().jobs,[]);
  h.fetch(()=>new Promise(resolve=>release=resolve));const accountRead=h.render().loadJobs();
  h.switchUser('another-tech');h.render();release([{id:'private-job',status:'active'}]);await accountRead;
  assert.deepEqual(h.render().jobs,[]);
});
test('a delayed poll cannot bring a job back after Realtime clears it',async()=>{
 const h=technicianHarness(),pending={id:'fault-job',status:'pending'};
 h.fetch(async()=>[pending]);h.render();const stop=h.mount();await h.render().loadJobs();
 let release;h.fetch(()=>new Promise(resolve=>release=resolve));const old=h.render().loadJobs();
 h.push({...pending,status:'completed',technicianId:null});release([pending]);await old;
 assert.deepEqual(h.render().jobs,[]);assert.equal(h.render().jobsLoading,false);stop();
});
