const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const workspace=path.join(root,'database');
const migrations=path.join(workspace,'supabase','migrations');
const marker=path.join(workspace,'baseline.json');

function projectRef(env=process.env) {
  const match=new URL(env.EXPO_PUBLIC_SUPABASE_URL || '').hostname.match(/^([a-z0-9]{20})\.supabase\.co$/);
  if(!match)throw Error('The app .env must contain its hosted EXPO_PUBLIC_SUPABASE_URL.');
  if(env.SUPABASE_PROJECT_REF && env.SUPABASE_PROJECT_REF!==match[1])throw Error('Database project differs from the app project. Check .env.db.local.');
  return match[1];
}
function requireBaseline(ref,file=marker) {
  if(!fs.existsSync(file))throw Error('Capture the existing hosted schema with npm run db:baseline before planning or pushing migrations.');
  const state=JSON.parse(fs.readFileSync(file,'utf8'));
  if(state.projectRef!==ref)throw Error('This schema baseline belongs to a different Supabase project.');
  if(!state.files?.length || state.files.some(name=>!/^\d{14}_\w+\.sql$/.test(name)))throw Error('Invalid schema baseline metadata.');
  return state;
}
function requireLinkedProject(ref,file=path.join(workspace,'supabase','.temp','project-ref')) {
  if(!fs.existsSync(file))throw Error('Run npm run db:link before using linked migration commands.');
  if(fs.readFileSync(file,'utf8').trim()!==ref)throw Error('The linked database differs from the app project. Run npm run db:link.');
}
function cli(args) {
  const entry=path.join(root,'node_modules','supabase','dist','supabase.js');
  if(!fs.existsSync(entry))throw Error('Run npm install to install the Supabase CLI.');
  const result=spawnSync(process.execPath,[entry,'--workdir',workspace,...args],{cwd:root,stdio:'inherit',windowsHide:true,env:process.env});
  if(result.error)throw result.error;
  if(result.status!==0)throw Error('Supabase command failed. Check the CLI error above; schema capture also requires a running Docker engine.');
}
function loadSettings() {
  for(const name of ['.env','.env.db.local']) {
    try{process.loadEnvFile(path.join(root,name));}catch(error){if(error.code!=='ENOENT')throw error;}
  }
}
function main(command) {
  loadSettings();
  if(command==='login'){cli(['login','--name','SolarCoop']);return;}
  const ref=projectRef();
  const remoteQuery=file=>cli(['db','query','--linked','--project-ref',ref,'--file',file]);
  if(command==='doctor') {
    console.log('Checking the app database project:',ref);
    console.log('Managed migrations: database/supabase/migrations (legacy SQL is not replayed).');
    remoteQuery(path.join(workspace,'health.sql'));return;
  }
  if(command==='repair-simulator') {
    remoteQuery(path.join(workspace,'health.sql'));
    remoteQuery(path.join(root,'supabase','migrations','0013_simulator_generated_surplus.sql'));
    remoteQuery(path.join(workspace,'health.sql'));return;
  }
  if(command==='link'){cli(['link','--project-ref',ref]);return;}
  if(command==='baseline') {
    fs.mkdirSync(migrations,{recursive:true});
    if(fs.existsSync(marker) || fs.readdirSync(migrations).some(name=>name.endsWith('.sql')))throw Error('A schema capture already exists. Inspect migration history before capturing another baseline.');
    cli(['link','--project-ref',ref]);
    cli(['db','pull','existing_schema','--linked','--schema','public,trade_private,simulator_private','--diff-engine','pg-delta','--yes']);
    const files=fs.readdirSync(migrations).filter(name=>/^\d{14}_\w+\.sql$/.test(name));
    if(!files.length)throw Error('No baseline migration was produced. Remote history has not been assumed or marked manually.');
    fs.writeFileSync(marker,JSON.stringify({projectRef:ref,files,capturedAt:new Date().toISOString()},null,2)+'\n');return;
  }
  if(command==='status'){requireLinkedProject(ref);cli(['migration','list','--linked']);return;}
  if(command==='plan'||command==='push') {
    requireLinkedProject(ref);
    const state=requireBaseline(ref);
    if(state.files.some(name=>!fs.existsSync(path.join(migrations,name))))throw Error('A captured baseline file is missing.');
    if(command==='push')cli(['db','push','--linked','--dry-run']);
    cli(['db','push','--linked',...(command==='plan'?['--dry-run']:[])]);return;
  }
  throw Error('Use db:login, db:doctor, db:repair-simulator, db:link, db:baseline, db:status, db:plan or db:push.');
}
module.exports={projectRef,requireBaseline,requireLinkedProject};
if(require.main===module)try{main(process.argv[2]);}catch(error){console.error(error.message);process.exitCode=1;}
