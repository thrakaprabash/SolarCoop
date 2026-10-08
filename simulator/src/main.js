import { createApi } from './api.js';
import { createStore } from './store.js';
import { createLoop } from './loop.js';
import { render } from './ui/render.js';
import { formatTime } from './engine/clock.js';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const preview=params.get('preview')==='1';
const key=params.get('key');
const store=createStore({snapshot:null,readings:{},leader:false,connected:false,busy:false,error:null,preview});
store.subscribe(render);
let loop;
async function action(work) {
  if(store.get().busy) return;
  store.set({busy:true,error:null});
  try { await work(); }
  catch(e) {store.set({error:e.message});}
  finally {store.set({busy:false});}
}
const change=patch=>action(()=>loop.mutate('update_config',{p_patch:patch}));
const find=id=>store.get().snapshot.devices.find(d=>d.id===id);
const presets={sunny:{sim_time:'12:00',weather:'sunny',load:1},evening:{sim_time:'19:00',weather:'sunny',load:1.4},cloudy:{sim_time:'11:00',weather:'cloudy',load:1},storm:{sim_time:'14:00',weather:'storm',load:1.2}};
async function preset(name) {
  const {load,...patch}=presets[name];
  await loop.mutate('update_config',{p_patch:{...patch,mode:'demo'}});
  for(const d of store.get().snapshot.devices) await loop.mutate('update_device',{p_device_id:d.id,p_patch:{load_factor:load}});
}
function bind() {
  $('play').onclick=()=>change({running:!store.get().snapshot.config.running});
  for(const field of ['mode','speed','weather']) $(field).onchange=e=>change({[field]:field==='speed'?Number(e.target.value):e.target.value});
  $('random').onchange=e=>change({random_faults:e.target.checked});
  $('probability').onchange=e=>change({fault_probability:Number(e.target.value)/100});
  $('time').oninput=e=>$('time-display').textContent=formatTime(Number(e.target.value)/60);
  $('time').onchange=e=>change({sim_time:formatTime(Number(e.target.value)/60)});
  $('bootstrap').onclick=()=>action(()=>loop.mutate('bootstrap'));
  $('backfill').onclick=()=>action(()=>loop.mutate('backfill',{p_days:Number($('days').value)}));
  for(const [id,scope] of [['reset','data'],['reset-all','all']]) $(id).onclick=()=>{
    if(confirm(scope==='all'?'Remove all simulator data, virtual devices and simulator job history?':'Reset simulated energy and close simulator jobs? Original dashboard data will be restored.')) action(()=>loop.mutate('reset',{p_scope:scope}));
  };
  document.querySelectorAll('[data-preset]').forEach(button=>button.onclick=()=>action(()=>preset(button.dataset.preset)));
  $('script').onclick=()=>action(async()=>{
    const d=store.get().snapshot.devices.find(d=>Number(d.capacity_kw)>0&&!d.active_fault_id);
    if(!d) throw new Error('Create an owner inverter without an active fault first.');
    await preset('sunny');
    await loop.mutate('update_config',{p_patch:{sim_time:'12:30',speed:60,running:true}});
    await loop.mutate('inject_fault',{p_device_id:d.id,p_code:'E01',p_details:{}});
  });
  $('households').addEventListener('change',e=>{
    const target=e.target;
    if(target.dataset.load) action(()=>loop.mutate('update_device',{p_device_id:target.dataset.load,p_patch:{load_factor:Number(target.value)/100}}));
    if(target.dataset.fault&&target.value) {
      const id=target.dataset.fault,code=target.value;target.value='';
      let details={};
      if(code==='E06'){
        const value=prompt(`Disconnect which string? (1–${find(id).string_count})`,'1');if(value===null) return;
        const string=Number(value);if(!Number.isInteger(string)||string<1||string>find(id).string_count){store.set({error:'Choose a valid string number.'});return;}details={string};
      }
      action(()=>loop.mutate('inject_fault',{p_device_id:id,p_code:code,p_details:details}));
    }
  });
  $('households').addEventListener('input',e=>{if(e.target.dataset.load)e.target.parentElement.querySelector('span').textContent=`${e.target.value}%`;});
  $('households').addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button) return;
    if(button.dataset.clear){
      const f=store.get().snapshot.faults.find(f=>f.device_id===button.dataset.clear);
      if(f?.job_status==='active'&&!confirm(`A technician is working on ${f.ticket_code}. Clear the fault and close their job?`)) return;
      action(()=>loop.mutate('clear_fault',{p_device_id:button.dataset.clear}));
    }
    if(button.dataset.edit){
      const d=find(button.dataset.edit),form=$('edit-form');
      for(const field of ['device_id','capacity_kw','panel_count','string_count','load_profile','battery_kwh','battery_level']) form.elements[field].value=field==='device_id'?d.id:d[field];
      for(const field of ['capacity_kw','panel_count']) form.elements[field].disabled=d.role==='consumer';
      $('edit-dialog').showModal();
    }
  });
  $('cancel-edit').onclick=()=>$('edit-dialog').close();
  $('edit-form').onsubmit=e=>{
    e.preventDefault();const form=e.target,patch={};
    for(const field of ['capacity_kw','panel_count','string_count','battery_kwh','battery_level']) if(!form.elements[field].disabled) patch[field]=Number(form.elements[field].value);
    patch.load_profile=form.elements.load_profile.value;
    const id=form.elements.device_id.value;$('edit-dialog').close();
    action(()=>loop.mutate('update_device',{p_device_id:id,p_patch:patch}));
  };
}
try {
  if(!preview&&!key) throw new Error('Add ?key=… to the URL. Use ?preview=1 for an offline preview.');
  let api;
  if(preview) api=(await import('./preview.js')).previewApi();
  else {
    let config;
    try {config=await import('../config.js');} catch {throw new Error('Copy simulator/config.example.js to simulator/config.js and fill in your Supabase URL and public anon key.');}
    api=createApi(config.SUPABASE_URL,config.SUPABASE_ANON_KEY,key,crypto.randomUUID());
  }
  const snapshot=await api.call('snapshot');
  store.set({snapshot,connected:true});
  bind();loop=createLoop(api,store);loop.start();
  window.addEventListener('pagehide',()=>loop.stop());
  window.addEventListener('pageshow',e=>{if(e.persisted)loop.start();});
} catch(e) {
  $('gate').querySelector('h1').textContent='Simulator setup';
  $('gate').querySelector('p').textContent=e.message;
  $('connection').textContent='Not connected';
}
