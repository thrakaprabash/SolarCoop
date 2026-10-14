const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('src/technician/utils/faultInbox.js','utf8').replace('export function ','function ');
const createInbox=new Function(source+';return createFaultInbox;')();
const fault=(id,extra={})=>({id,status:'pending',source:'telemetry',urgency:'medium',...extra});
test('existing faults stay silent, new telemetry incidents alert once across polling and reconnection',()=>{
 const inbox=createInbox(),old=fault('old'),fresh=fault('new');
 assert.deepEqual(inbox.update([old]),[]);
 assert.deepEqual(inbox.update([old,fresh]).map(x=>x.id),['new']);
 assert.deepEqual(inbox.update([fresh,old]),[]);
 inbox.update([]);assert.deepEqual(inbox.update([fresh,old]),[]);
});
test('only new pending faults alert; highest urgency is selected and a new session seeds silently',()=>{
 const inbox=createInbox();inbox.update([]);
 const rows=[fault('low',{urgency:'low'}),fault('urgent',{urgency:'urgent'}),fault('active',{status:'active'}),fault('closed',{status:'completed'}),fault('seed',{source:'manual'})];
 assert.deepEqual(inbox.update(rows).map(x=>x.id),['urgent','low']);
 assert.deepEqual(inbox.update([fault('active')]),[]);
 assert.deepEqual(createInbox().update(rows),[]);
});
test('the bundled original chime is short mono PCM and does not clip',()=>{
 const wav=fs.readFileSync('assets/technician-alert.wav');assert.equal(wav.toString('ascii',0,4),'RIFF');
 assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt16LE(34),16);
 const seconds=wav.readUInt32LE(40)/wav.readUInt32LE(28);assert(seconds>0.5 && seconds<1);
 let peak=0;for(let i=44;i<wav.length;i+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(i)));
 assert(peak>1000 && peak<16000);
});
