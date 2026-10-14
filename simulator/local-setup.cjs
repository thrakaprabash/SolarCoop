const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');

async function prepareLocalSetup(root=__dirname) {
  const keyFile=path.join(root,'.demo-key');
  let key;
  try {key=(await fs.readFile(keyFile,'utf8')).trim();}
  catch(error) {
    if(error.code!=='ENOENT') throw error;
    key=crypto.randomBytes(24).toString('hex');
    try {await fs.writeFile(keyFile,key,{flag:'wx',mode:0o600});}
    catch(error) {if(error.code!=='EEXIST')throw error;key=(await fs.readFile(keyFile,'utf8')).trim();}
  }
  if(!/^[a-f0-9]{48}$/.test(key)) throw new Error('Invalid local simulator configuration.');
  const migrations=await Promise.all(['0011_simulator','0012_simulator_auto_devices','0013_simulator_generated_surplus'].map(name=>
    fs.readFile(path.join(root,'..','supabase','migrations',name+'.sql'),'utf8')));
  const sql='-- One-time local demo setup. Copy this whole file into Supabase SQL Editor.\n'
    +migrations.join('\n')+`\nselect public.sim_set_key('${key}');\n`;
  await fs.writeFile(path.join(root,'.demo-setup.sql'),sql,{mode:0o600});
  return key;
}
module.exports={prepareLocalSetup};
