import { tick } from './engine/tick.js';
import { seededRandom } from './engine/random.js';
import { randomFault } from './engine/faults.js';
export function createLoop(api, store) {
  let queue = Promise.resolve(), timer, stopped=false, errors=0, index=0, state={}, pending=null, last=Date.now(), wasLeader=false;
  const random = seededRandom(42);
  const enqueue = task => {
    const promise = queue.then(task);
    queue = promise.catch(()=>{});
    return promise;
  };
  async function refresh() {
    const previous = store.get().snapshot;
    const snapshot = await api.call('snapshot');
    const changed = Boolean(previous && JSON.stringify(previous.faults) !== JSON.stringify(snapshot.faults));
    store.set({snapshot});
    return changed;
  }
  async function push(force=false, elapsed=0) {
    const snapshot = store.get().snapshot;
    if (!pending) pending = { ...tick(snapshot,state,{elapsedSeconds:elapsed,index,forceRecord:force,random}), id:crypto.randomUUID() };
    await api.call('push_tick',{p_tick_id:pending.id,p_batch:pending.batch,p_sim_time:pending.simTime});
    state=pending.state; index++;
    store.set({readings:state,snapshot:{...snapshot,config:{...snapshot.config,sim_time:pending.simTime}}});
    pending=null;
  }
  async function cycle() {
    const leader = await api.call('claim_lease');
    if (leader !== wasLeader) { state = {}; pending = null; store.set({readings:{}}); }
    wasLeader = leader;
    store.set({leader});
    const changed = await refresh();
    const now=Date.now();
    const elapsed=Math.min(15,Math.max(0,(now-last)/1000)); last=now;
    if(leader && (store.get().snapshot.config.running || changed || pending)) {
      await push(changed, store.get().snapshot.config.running ? elapsed : 0);
      const s=store.get().snapshot;
      if(s.config.running && s.config.random_faults) {
        for(const d of s.devices) if(Number(d.capacity_kw)>0 && !d.active_fault_id && random()<Number(s.config.fault_probability)) {
          const code=randomFault(random);
          await api.call('inject_fault',{p_device_id:d.id,p_code:code,p_details:code==='E06'?{string:1}:{}});
          await refresh(); await push(true,0);
        }
      }
    }
    store.set({connected:true,error:null}); errors=0;
  }
  async function scheduled() {
    if(stopped) return;
    try { await enqueue(cycle); }
    catch(e) { errors++; last=Date.now(); store.set({connected:false,leader:false,error:e.message}); }
    if(!stopped) timer=setTimeout(scheduled,Math.min(30000,3000*2**Math.min(errors,4)));
  }
  return {
    start() { stopped=false; scheduled(); }, stop() { stopped=true; clearTimeout(timer); },
    mutate(name, params={}) { return enqueue(async()=>{
      if(!await api.call('claim_lease')) throw new Error('Another tab controls the simulator.');
      // Finish a lost-response retry before any later control change.
      if(pending) await push();
      await api.call(name,params);
      if(name==='reset') {state={};pending=null;index=0;store.set({readings:{}});}
      await refresh(); last=Date.now();
      if(name!=='reset') await push(true,0);
    }); },
  };
}
