import { createLoop } from './loop.js';
import { createStore } from './store.js';

// Node drives readings even when no browser control page is open.
export function createRunner(api, { log = console.log, retryMs = 5000 } = {}) {
  const store = createStore({ snapshot:null, readings:{}, leader:false, connected:false });
  const loop = createLoop(api, store);
  let stopped=false, ready=false, timer, lastError;
  const unsubscribe = store.subscribe(value => {
    if(value.error && value.error !== lastError) log(`Simulator: ${value.error}`);
    lastError = value.error;
  });
  async function initialize() {
    try {
      if(!await api.call('claim_lease')) throw new Error('Waiting for the previous simulator controller.');
      if(stopped) return;
      await api.call('bootstrap');
      if(stopped) return;
      await api.call('update_config',{p_patch:{mode:'demo',sim_time:'12:00',speed:60,weather:'sunny',running:true}});
      if(stopped) return;
      ready=true; loop.start();
      log('Simulator is automatically feeding energy into the app database.');
    } catch(error) {
      if(stopped) return;
      const detail=/simulator key|schema cache/i.test(error.message) ? 'Database demo setup is not connected yet.' : error.message;
      const message=`${detail} One-time setup: run simulator/.demo-setup.sql in Supabase SQL Editor.`;
      if(message !== lastError) log(message);
      lastError=message;
      timer=setTimeout(initialize,retryMs);
    }
  }
  return {
    start:initialize,
    async call(name,params) {
      if(name==='snapshot') {
        const snapshot=await api.call(name,params),status=store.get();
        return {...snapshot,runner:{connected:status.connected,error:status.error || null}};
      }
      if(name==='claim_lease') return api.call(name,params);
      if(!ready) throw new Error('Run simulator/.demo-setup.sql in Supabase SQL Editor once to finish demo setup.');
      await loop.mutate(name,params); return null;
    },
    stop(){stopped=true;clearTimeout(timer);loop.stop();unsubscribe();},store,
  };
}
