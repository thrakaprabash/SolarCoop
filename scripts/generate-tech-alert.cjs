// Original two-note notification chime, reproducible without external assets.
const fs=require('node:fs'),path=require('node:path');
const rate=32000,duration=0.8,samples=Math.round(rate*duration);
const wav=Buffer.alloc(44+samples*2);
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);
wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);
wav.write('data',36);wav.writeUInt32LE(samples*2,40);
for(let i=0;i<samples;i++){
 const t=i/rate;
 const note=(start,hz)=>{const dt=t-start;if(dt<0)return 0;
  const envelope=Math.min(1,dt/0.012)*Math.exp(-dt*9)*Math.min(1,(duration-t)/0.04);
  return envelope*(Math.sin(2*Math.PI*hz*dt)+0.15*Math.sin(4*Math.PI*hz*dt));};
 wav.writeInt16LE(Math.round((note(0,659.25)+note(0.21,987.77))*0.2*32767),44+i*2);
}
fs.writeFileSync(path.join(__dirname,'..','assets','technician-alert.wav'),wav);
