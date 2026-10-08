const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { prepareLocalSetup } = require('./local-setup.cjs');
const root = __dirname;
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json' };
const actions = new Set(['snapshot','claim_lease','bootstrap','update_config','update_device','inject_fault','clear_fault','backfill','reset']);
let runner;
async function startRunner() {
  try {
    try {process.loadEnvFile(path.join(root,'..','.env'));} catch(error) {if(error.code!=='ENOENT')throw error;}
    let config={};
    if(!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      try {config=await import('./config.js');} catch { /* Existing app .env is normally sufficient. */ }
    }
    const key=await prepareLocalSetup(root);
    const { createApi }=await import('./src/api.js');
    const { createRunner }=await import('./src/runner.js');
    const api=createApi(process.env.EXPO_PUBLIC_SUPABASE_URL || config.SUPABASE_URL,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || config.SUPABASE_ANON_KEY,key,randomUUID());
    runner=createRunner(api);runner.start();
  } catch(error) {console.error('Simulator setup: '+error.message);}
}
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const port=server.address().port;
    const hosts=new Set(['localhost:'+port,'127.0.0.1:'+port]);
    if(!hosts.has(req.headers.host)) {res.writeHead(403);return res.end('Local simulator only');}
    if(pathname.startsWith('/api/sim/')) {
      res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
      const name=pathname.slice('/api/sim/'.length);
      if(req.method!=='POST' || !actions.has(name)) {res.writeHead(405);return res.end(JSON.stringify({message:'Unsupported simulator action'}));}
      if(req.headers.origin && req.headers.origin!=='http://'+req.headers.host) {res.writeHead(403);return res.end(JSON.stringify({message:'Local controls only'}));}
      if(req.headers['sec-fetch-site'] && !['same-origin','none'].includes(req.headers['sec-fetch-site'])) {res.writeHead(403);return res.end(JSON.stringify({message:'Local controls only'}));}
      if(!req.headers['content-type']?.startsWith('application/json')) {res.writeHead(415);return res.end(JSON.stringify({message:'JSON required'}));}
      let body='';
      for await(const chunk of req) {body+=chunk;if(body.length>100000)throw new Error('Request too large');}
      const params=JSON.parse(body || '{}');
      if(!params || typeof params!=='object' || Array.isArray(params))throw new Error('Invalid request');
      delete params.p_key;delete params.p_tab_id;
      try {
        if(!runner)throw new Error('Simulator is starting. Refresh shortly.');
        const data=await runner.call(name,params);
        return res.end(JSON.stringify(data));
      } catch(error) {
        res.writeHead(503);
        const message=/simulator key|sim_snapshot|schema cache/i.test(error.message)
          ? 'Run simulator/.demo-setup.sql in Supabase SQL Editor once. No key entry is required.' : error.message;
        return res.end(JSON.stringify({message}));
      }
    }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    if(pathname==='/runtime-config.js') {
      res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
      return res.end('export const LOCAL_API=true; export const HEADLESS=true;');
    }
    if(pathname==='/health') {
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
      return res.end(JSON.stringify({service:'solarcoop-simulator',headless:true,connected:runner?.store.get().connected || false}));
    }
    if(pathname.split('/').some(part=>part.startsWith('.')) || ['/config.js','/local-setup.cjs'].includes(pathname)) {res.writeHead(404);return res.end('Not found');}
    const file = path.resolve(root,'.'+(pathname==='/' ? '/index.html' : pathname));
    if (!file.startsWith(root+path.sep) || !types[path.extname(file)]) { res.writeHead(404); return res.end('Not found'); }
    const content = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)]+'; charset=utf-8', 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff' });
    res.end(req.method==='HEAD' ? undefined : content);
  } catch { res.writeHead(400); res.end('Invalid request'); }
});
server.on('error',async error=>{
  if(error.code==='EADDRINUSE') {
    try {const response=await fetch('http://127.0.0.1:5050/index.html');
      if(response.ok&&(await response.text()).includes('ENERGY & FAULT SIMULATOR')) {
        console.log('SolarCoop simulator is already running at http://localhost:5050');
        process.exitCode=0;return;
      }
    } catch { /* Report the original port error. */ }
  }
  console.error('Simulator server: '+error.message);process.exitCode=1;
});
server.listen(Number(process.env.SIM_PORT || 5050),'127.0.0.1',()=>{
  console.log('SolarCoop Simulator controls: http://localhost:'+server.address().port+' (no key entry or open browser required)');
  startRunner();
});
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{runner?.stop();server.close();});
