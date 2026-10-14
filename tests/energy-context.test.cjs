const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
function harness(overrides={}) {
  const slots=[],effects=[];let cursor=0,user={id:'owner-a'};
  const hooks={createContext:()=>({}),useContext:()=>null,useCallback:f=>f,
    useEffect:f=>effects.push(f),
    useRef(initial){const i=cursor++;if(!(i in slots))slots[i]={current:initial};return slots[i];},
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],next=>slots[i]=typeof next==='function'?next(slots[i]):next];}};
  let realtime;
  const channel={on(event,filter,callback){realtime=callback;return channel;},subscribe(){return channel;}};
  const dependencies={...hooks,useAuth:()=>({user}),AsyncStorage:{getItem:async()=>null,setItem:async()=>{}},
    supabase:{channel:()=>channel,removeChannel:()=>{}},
    readingStatus:(stamp,now=Date.now())=>!stamp?'offline':now-Date.parse(stamp)>60000?'stale':'live',
    fetchMetrics:async()=>null,fetchHistory:async()=>({logs:[],hasMore:false}),fetchAppliances:async()=>[],fetchChartData:async()=>null,
    fetchMyFaultAlerts:async()=>[],subscribeToMyFaultAlerts:()=>()=>{},postShareEnergy:async()=>{throw Error('Write unavailable');},postBorrowEnergy:async()=>{throw Error('Write unavailable');},updateAppliance:async()=>{},
    AppState:{addEventListener:()=>({remove(){}})},setInterval:()=>1,clearInterval:()=>{},...overrides};
  const source=fs.readFileSync('src/context/EnergyContext.js','utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm,'').replaceAll('export const ','const ')
    .replace(/return \(\s*<EnergyContext.Provider\s+value=\{\{/, 'return ({')
    .replace(/\}\}\s*>\s*\{children\}\s*<\/EnergyContext.Provider>\s*\);/, '});');
  const provider=new Function(...Object.keys(dependencies),source+'\nreturn EnergyProvider;')(...Object.values(dependencies));
  return {render(){cursor=0;effects.length=0;return provider({children:null});},switchUser(id){user=id?{id}:null;},
    mount(){const cleanup=effects.map(f=>f());return ()=>cleanup.forEach(f=>typeof f==='function'&&f());},
    push(row){realtime({new:row});}};
}
const row=(production=3)=>({user_id:'owner-a',updated_at:new Date().toISOString(),instant_production:production,instant_consumption:1,daily_production:12,daily_consumption:4,surplus_available:8,is_simulated:true});
function deferred(){let resolve;const promise=new Promise(done=>resolve=done);return{promise,resolve};}
test('missing energy has no placeholder history, chart, or successful fake actions',async()=>{
 const h=harness();await h.render().refreshMetricsNow();const v=h.render();
 assert.equal(v.hasMetrics,false);assert.equal(v.telemetryStatus,'offline');assert.equal(v.lastFetchedAt,null);
 assert.deepEqual(v.historyLogs,[]);assert.deepEqual(v.chartData.production,[]);
 assert.equal(await v.executeShareEnergy(2,'household'),false);assert.equal(await v.executeBorrowEnergy(2),false);
 assert.deepEqual(h.render().historyLogs,[]);
});
test('database values and original timestamp are retained through a connection failure',async()=>{
 let fail=false;const stored={...row('3.25'),updated_at:'2020-01-01T00:00:00Z'};
 const h=harness({fetchMetrics:async()=>{if(fail)throw Error('Network unavailable');return stored;}});
 await h.render().refreshMetricsNow();let v=h.render();assert.equal(v.metrics.instantProduction,3.25);
 assert.equal(v.metrics.isSimulated,true);assert.equal(v.lastFetchedAt,stored.updated_at);assert.equal(v.telemetryStatus,'stale');
 fail=true;await v.refreshMetricsNow();v=h.render();assert.equal(v.metrics.instantProduction,3.25);assert.equal(v.telemetryStatus,'offline');
});
test('removed database reading clears previously available values',async()=>{
 let reading=row();const h=harness({fetchMetrics:async()=>reading});await h.render().refreshMetricsNow();assert.equal(h.render().hasMetrics,true);
 reading=null;await h.render().refreshMetricsNow();assert.equal(h.render().hasMetrics,false);assert.equal(h.render().lastFetchedAt,null);
});
test('late reads and visible values cannot leak across household accounts',async()=>{
 const old=deferred();const h=harness({fetchMetrics:id=>id==='owner-a'?old.promise:Promise.resolve({...row(9),user_id:id})});
 const pending=h.render().refreshMetricsNow();h.switchUser('owner-b');assert.equal(h.render().hasMetrics,false);
 await h.render().refreshMetricsNow();old.resolve(row(2));await pending;assert.equal(h.render().metrics.instantProduction,9);
 h.switchUser(null);assert.equal(h.render().hasMetrics,false);assert.equal(h.render().lastFetchedAt,null);
});
test('a newer read wins when an earlier request completes afterward',async()=>{
 const old=deferred();let calls=0;const h=harness({fetchMetrics:()=>++calls===1?old.promise:Promise.resolve(row(7))});
 const pending=h.render().refreshMetricsNow();await h.render().refreshMetricsNow();old.resolve(row(1));await pending;
 assert.equal(h.render().metrics.instantProduction,7);
});
test('charts request the stored simulator ranges and never invent missing curves',async()=>{
 const ranges=[];const h=harness({fetchChartData:async(id,range)=>{ranges.push(range);return range==='day'?{hours:['12:00'],production:['3.2']}:null;}});
 await h.render().refreshMetricsNow();await h.render().loadChartData('today');assert.deepEqual(h.render().chartData.production,[3.2]);
 await h.render().loadChartData('7d');assert.deepEqual(h.render().chartData.production,[]);await h.render().loadChartData('30d');
 assert.deepEqual(ranges,['day','week','month']);
});
test('realtime readings supersede an in-flight poll and household faults reach the dashboard',async()=>{
 const old=deferred();const h=harness({fetchMetrics:()=>old.promise,fetchMyFaultAlerts:async()=>[{id:'fault-1',status:'pending'}]});
 h.render();const unmount=h.mount();await Promise.resolve();h.push(row(6));old.resolve(row(1));await Promise.resolve();await Promise.resolve();
 const v=h.render();assert.equal(v.metrics.instantProduction,6);assert.equal(v.faultAlerts[0].id,'fault-1');unmount();
});
test('reading freshness uses persisted time, including invalid and absent timestamps',()=>{
 const source=fs.readFileSync('src/utils/energyTelemetry.js','utf8').replace('export function ','function ');
 const status=new Function(source+';return readingStatus;')();
 assert.equal(status(null),'offline');assert.equal(status('invalid'),'offline');
 const now=Date.now();assert.equal(status(new Date(now-60000).toISOString(),now),'live');assert.equal(status(new Date(now-60001).toISOString(),now),'stale');
});
test('household polling and phone foreground refresh remove cleared maintenance cards without Realtime',async()=>{
 let alerts=[{id:'fault-job',status:'pending'}],poll,foreground;
 const h=harness({fetchMyFaultAlerts:async()=>alerts,
   setInterval:(callback,ms)=>{if(ms===10000)poll=callback;return 1;},
   AppState:{addEventListener:(_,callback)=>{foreground=callback;return{remove(){foreground=null;}};}}});
 h.render();const stop=h.mount();await Promise.resolve();await Promise.resolve();
 assert.equal(h.render().faultAlerts.length,1);
 alerts=[];await poll();assert.deepEqual(h.render().faultAlerts,[]);
 alerts=[{id:'another-fault',status:'pending'}];foreground('active');await Promise.resolve();await Promise.resolve();
 assert.equal(h.render().faultAlerts[0].id,'another-fault');stop();assert.equal(foreground,null);
});
