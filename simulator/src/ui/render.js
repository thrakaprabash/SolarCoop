import { FAULTS, faultEffect } from '../engine/faults.js';
import { parseTime, formatTime } from '../engine/clock.js';
import { sunCurve } from '../engine/solar.js';
export const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fixed = n => Number(n || 0).toFixed(2);
const $=id=>document.getElementById(id);
function card(d, f, value, config) {
  const prod=value?.instantProduction ?? Number(d.metrics?.instant_production || 0), cons=value?.instantConsumption ?? Number(d.metrics?.instant_consumption || 0);
  const effect=faultEffect(d,f,sunCurve(parseTime(config.sim_time)),0);
  const history=value?.history || [];
  const max=Math.max(1,...history);
  const points=history.map((v,i)=>`${i*280/Math.max(1,history.length-1)},${33-v/max*30}`).join(' ');
  return `<div class="house-top"><div><h3>${escape(d.name || 'Household')}</h3><p class="house-meta">${escape(d.role)} · ${escape(d.inverter_serial)}</p></div><span class="status">● ${escape(d.status)}</span></div>
    <div class="panels">${d.panel_count ? effect.health.map(h=>`<span class="panel ${Number(h)===0?'off':''}" title="Panel health ${Math.round(h*100)}%"></span>`).join('') : '<span class="consumer-array">⌂ Consumer household · community powered</span>'}</div>
    <div class="readings"><div><small>SOLAR</small><strong>${fixed(prod)} <span>kW</span></strong></div><div><small>LOAD</small><strong>${fixed(cons)} <span>kW</span></strong></div><div><small>NET FLOW</small><strong class="${prod>=cons?'net-positive':'net-negative'}">${prod>=cons?'+':''}${fixed(prod-cons)} <span>kW</span></strong></div></div>
    <svg class="sparkline" viewBox="0 0 280 36" preserveAspectRatio="none" aria-label="Recent solar production"><polyline points="${points}"/></svg>
    <div class="house-totals">Today ${fixed(value?.production ?? d.metrics?.daily_production)} kWh solar · ${fixed(value?.consumption ?? d.metrics?.daily_consumption)} kWh used${Number(d.battery_kwh)>0?` · Battery ${Math.round(value?.batteryLevel ?? d.battery_level)}%`:''}</div>
    ${f?`<div class="fault-info"><strong>${escape(f.code)} · ${escape(f.title)}</strong><p>${escape(f.ticket_code)} · ${escape(f.job_status)}${f.technician_name?` · 🔧 ${escape(f.technician_name)}`:''}</p>${effect.stale?'<p>No new meter readings · testing stale-data detection</p>':''}${effect.safety?'<p class="safety">Safety shutdown · isolate before inspection</p>':''}</div>`:''}
    <div class="house-controls"><label>Load <span>${Math.round(d.load_factor*100)}%</span><input type="range" min="0" max="200" value="${Math.round(d.load_factor*100)}" data-load="${escape(d.id)}" data-control aria-label="Load for ${escape(d.name)}"></label>
    ${Number(d.capacity_kw)>0?(f?`<button class="danger" data-clear="${escape(d.id)}" data-control>Clear fault</button>`:`<label>Fault<select data-fault="${escape(d.id)}" data-control aria-label="Inject fault at ${escape(d.name)}"><option value="">Inject…</option>${Object.entries(FAULTS).map(([code,v])=>`<option value="${code}">${code} · ${escape(v.title)}</option>`).join('')}</select></label>`):''}<button data-edit="${escape(d.id)}" data-control>Edit</button></div>`;
}
export function render(s) {
  if(!s.snapshot) return;
  const {config,devices,faults,events}=s.snapshot;
  const editable=s.connected&&s.leader&&!s.busy;
  $('gate').hidden=true; $('workspace').hidden=false;
  $('connection').textContent=s.preview?'Offline preview':!s.connected?'Disconnected':s.leader?'● Connected · controller':'● Connected · viewer';
  $('connection').className=`badge ${s.connected?'connected':'disconnected'}`;
  $('viewer').hidden=!!s.leader||!s.connected; $('preview-notice').hidden=!s.preview;
  $('error').textContent=s.error || ''; $('error').hidden=!s.error;
  $('play').textContent=config.running?'Ⅱ Pause':'▶ Play';
  for(const [id,val] of Object.entries({mode:config.mode,speed:config.speed,weather:config.weather,time:Math.floor(parseTime(config.sim_time)*60),probability:Number(config.fault_probability)*100})) {
    if(document.activeElement!==$(id)) $(id).value=val;
  }
  $('random').checked=config.random_faults;
  $('time-display').textContent=formatTime(parseTime(config.sim_time));
  $('clock-mode').textContent=`${config.mode.toUpperCase()} · ASIA/COLOMBO`;
  let prod=0,cons=0,pool=0;
  for(const d of devices){const v=s.leader?s.readings[d.id]:null;prod+=v?.instantProduction??Number(d.metrics?.instant_production||0);cons+=v?.instantConsumption??Number(d.metrics?.instant_consumption||0);pool+=Math.max(0,(v?.production??Number(d.metrics?.daily_production||0))-(v?.consumption??Number(d.metrics?.daily_consumption||0)));}
  const kpis=[['Production',fixed(prod),'kW'],['Consumption',fixed(cons),'kW'],['Net balance',fixed(prod-cons),'kW'],['Pool today',fixed(pool),'kWh'],['Open faults',faults.length,'devices'],['Repair jobs',faults.filter(f=>f.job_status!=='completed').length,'open']];
  $('kpis').innerHTML=kpis.map(([title,value,unit])=>`<div class="kpi"><small>${title}</small><strong>${value} <span>${unit}</span></strong></div>`).join('');
  $('flow-caption').textContent=prod>=cons?`${fixed(prod-cons)} kW available for export after household demand.`:`${fixed(cons-prod)} kW of grid support covers community demand.`;
  $('flow-line').style.animationPlayState=config.running?'running':'paused';
  $('household-count').textContent=`${devices.length} households · ${devices.filter(d=>d.status==='online'||d.status==='degraded').length} online`;
  const container=$('households');
  for(const node of [...container.children]) if(!devices.some(d=>d.id===node.dataset.id)) node.remove();
  if(!devices.length) container.innerHTML='<p class="empty">No virtual inverters yet. Create them from your existing owner and consumer profiles.</p>';
  for(const d of devices) {
    let node=[...container.children].find(node=>node.dataset.id===d.id);
    if(!node){node=document.createElement('article');node.dataset.id=d.id;container.append(node);}
    const f=faults.find(f=>f.device_id===d.id);
    node.className=`house-card ${f?'faulted':''}`;
    const editing = node.contains(document.activeElement) && document.activeElement.matches('input,select') && !s.busy;
    if(!editing) node.innerHTML=card(d,f,s.leader?s.readings[d.id]:null,config);
  }
  $('events').innerHTML=events.length?events.map(e=>`<li><time>${escape(new Date(e.created_at).toLocaleTimeString('en-GB',{timeZone:'Asia/Colombo',hour:'2-digit',minute:'2-digit'}))}</time> ${escape(e.message)}</li>`).join(''):'<li>No events yet. Start the simulation or inject a fault.</li>';
  document.querySelectorAll('[data-control]').forEach(node=>node.disabled=!editable);
  $('time').disabled=!editable||config.mode==='live'; $('speed').disabled=!editable||config.mode==='live';
}
