const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const children = new Set();
let closing = false;
function stop(code=0) {
  if(closing) return; closing=true;
  for(const child of children) child.kill();
  process.exitCode=code;
}
function start(file,args=[]) {
  const child=spawn(process.execPath,[file,...args],{cwd:root,stdio:'inherit',windowsHide:true});
  children.add(child);
  child.on('error',error=>{console.error(error.message);stop(1);});
  child.on('exit',code=>{children.delete(child);if(!closing)stop(code||0);});
  return child;
}
async function main() {
  let existing=false, legacy=false;
  try {
    const response=await fetch('http://127.0.0.1:5050/health',{signal:AbortSignal.timeout(1000)});
    if(response.ok) {
      const health=await response.json();
      existing=health.service==='solarcoop-simulator' && health.headless===true;
      legacy=health.service==='solarcoop-simulator' && !existing;
    }
    if(!existing) {
      const page=await fetch('http://127.0.0.1:5050/index.html',{signal:AbortSignal.timeout(1000)});
      legacy=page.ok&&(await page.text()).includes('ENERGY & FAULT SIMULATOR');
    }
  } catch { /* Start our simulator if it is not already running. */ }
  if(legacy) throw new Error('An older simulator server is running. Stop that terminal, then run npm start again.');
  if(existing) console.log('Using running simulator at http://localhost:5050');
  else start(path.join(root,'simulator','server.cjs'));
  console.log('Simulator controls: http://localhost:5050/');
  console.log('Energy generation starts automatically; no browser or key entry is required.');
  start(require.resolve('expo/bin/cli'),['start',...process.argv.slice(2)]);
}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
main().catch(error=>{console.error(error.message);stop(1);});
