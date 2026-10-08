import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoop } from '../src/loop.js';
import { createStore } from '../src/store.js';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(running=false) {
  const snapshot={config:{running,mode:'demo',sim_time:'12:00:00',speed:60,weather:'sunny',random_faults:false},faults:[],events:[],devices:[{
    id:'one',capacity_kw:4,panel_count:8,string_count:2,panel_health:Array(8).fill(1),load_profile:'family',load_factor:1,battery_kwh:0,battery_level:50,
  }]};
  const writes=[];
  const store=createStore({snapshot:null,readings:{},leader:false,connected:false});
  const api={async call(name,p={}) {
    if(name==='claim_lease') return true;
    if(name==='snapshot') return structuredClone(snapshot);
    if(name==='update_config') Object.assign(snapshot.config,p.p_patch);
    if(name==='push_tick') {writes.push(p);snapshot.config.sim_time=p.p_sim_time;}
    if(name==='reset') snapshot.config.running=false;
  }};
  return {snapshot,writes,store,api};
}
test('opening a paused simulator and polling after reset never overwrite restored data',async t=>{
  t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.UTC(2026,9,7,6,30)});
  const f=fixture();const loop=createLoop(f.api,f.store);
  try {
    loop.start();await flush();assert.equal(f.writes.length,0);
    await loop.mutate('update_config',{p_patch:{running:true}});
    assert.equal(f.writes.length,1);
    await loop.mutate('reset',{p_scope:'data'});
    t.mock.timers.tick(3000);await flush();
    assert.equal(f.writes.length,1);assert.deepEqual(f.store.get().readings,{});
  } finally {loop.stop();}
});
test('a lost tick response retries the same batch id after reconnecting',async t=>{
  t.mock.timers.enable({apis:['setTimeout','Date'],now:Date.UTC(2026,9,7,6,30)});
  const f=fixture(true);const base=f.api.call;let dropped=false;
  f.api.call=async(name,p)=>{
    const value=await base(name,p);
    if(name==='push_tick'&&!dropped){dropped=true;throw new Error('Lost response');}
    return value;
  };
  const loop=createLoop(f.api,f.store);
  try {
    loop.start();await flush();assert.equal(f.store.get().connected,false);
    assert.equal(f.writes.length,1);
    t.mock.timers.tick(6000);await flush();
    assert.equal(f.writes.length,2);
    assert.equal(f.writes[0].p_tick_id,f.writes[1].p_tick_id);
    assert.deepEqual(f.writes[0].p_batch,f.writes[1].p_batch);
    assert.equal(f.store.get().connected,true);
  } finally {loop.stop();}
});
