import { FAULTS } from './engine/faults.js';
export function previewApi() {
  let eventId=0;
  const snapshot={config:{running:false,mode:'demo',sim_time:'12:00:00',speed:60,weather:'sunny',random_faults:false,fault_probability:0.002},devices:[],faults:[],events:[]};
  const event=message=>snapshot.events.unshift({id:++eventId,created_at:new Date().toISOString(),message});
  for(let i=0;i<6;i++) snapshot.devices.push({id:`preview-${i}`,household_user_id:`person-${i}`,name:['Perera','Silva','Fernando','Kumari','Jayasinghe','De Silva'][i],role:i<4?'owner':'consumer',inverter_serial:`SC-INV-000${i+1}`,capacity_kw:i<4?4+i*0.5:0,panel_count:i<4?12:0,string_count:2,panel_health:Array(i<4?12:0).fill(1),load_profile:i===3?'business':'family',load_factor:1,battery_kwh:i===0?5:0,battery_level:50,status:'online'});
  event('Offline preview — no database writes or technician dispatch');
  return {async call(name,p={}) {
    const d=snapshot.devices.find(d=>d.id===p.p_device_id);
    switch(name) {
      case 'snapshot':return structuredClone(snapshot);
      case 'claim_lease':return true;
      case 'update_config':Object.assign(snapshot.config,p.p_patch);event('Controls updated');break;
      case 'update_device':Object.assign(d,p.p_patch);d.panel_health=Array(d.panel_count).fill(1);break;
      case 'inject_fault':{
        if(d.active_fault_id) throw new Error('This device already has a fault');
        const f={id:crypto.randomUUID(),device_id:d.id,code:p.p_code,title:FAULTS[p.p_code].title,details:p.p_details,job_status:'pending',ticket_code:'PREVIEW-JOB'};
        snapshot.faults.push(f);d.active_fault_id=f.id;d.status=FAULTS[p.p_code].status;event(`${p.p_code} at ${d.name} — preview job`);break;
      }
      case 'clear_fault':snapshot.faults=snapshot.faults.filter(f=>f.device_id!==d.id);d.active_fault_id=null;d.status='online';event(`Fault cleared at ${d.name}`);break;
      case 'push_tick':snapshot.config.sim_time=p.p_sim_time;break;
      case 'backfill':event('Backfill is available when connected to Supabase');break;
      case 'reset':snapshot.config.running=false;snapshot.faults=[];snapshot.devices.forEach(d=>{d.status='online';d.active_fault_id=null;});event('Preview reset');break;
    }
    return null;
  }};
}
