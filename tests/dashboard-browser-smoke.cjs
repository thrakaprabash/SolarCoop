// Optional browser check against an Expo web export. All backend responses are isolated test fixtures.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(process.env.DASHBOARD_WEB_DIR||'.simulator-web-check');
 const server=http.createServer((req,res)=>{
  let name=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!name.startsWith(root+path.sep)&&name!==root){res.writeHead(404);res.end();return;}
  if(name===root)name=path.join(root,'index.html');
  fs.readFile(name,(err,body)=>{if(err){res.writeHead(404);res.end();return;}
   res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.html')?'text/html':'application/octet-stream');res.end(body);});
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));let browser;
 try {
  browser=await chromium.launch({channel:process.env.SIM_BROWSER_CHANNEL||'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const id='44444444-4444-4444-8444-444444444444',user={id,email:'browser-test@example.test',aud:'authenticated',role:'authenticated',user_metadata:{role:'owner'}};
  const errors=[];page.on('pageerror',e=>errors.push(e.message));let hasReading=false;
  const row={user_id:id,updated_at:new Date().toISOString(),is_simulated:true,instant_production:3.25,instant_consumption:1.1,daily_production:12,daily_consumption:4,battery_level:40,battery_capacity:5,battery_power_flow:0,surplus_available:8,coop_pool_shared_today:0,coop_tokens_earned:0,monetary_saved:0,co2_saved_kg:5.1,grid_independence:70,coop_members_online:2,coop_total_capacity:8};
  await page.route('**/*.supabase.co/**',async route=>{
   const url=new URL(route.request().url()),table=url.pathname.split('/').pop();let data=[];
   if(table==='profiles')data={id,name:'Browser Test Owner',role:'owner',status:'active'};
   if(table==='energy_metrics')data=hasReading?row:null;
   if(table==='chart_data')data={hours:['10:00','12:00'],production:[2,3.25],consumption:[1,1.1],surplus:[1,2.15],deficit:[0,0]};
   if(table==='jobs')data=hasReading?[{id:'fault-test',status:'pending',source:'telemetry',error_code:'E01',consumer_message:'Inverter needs attention'}]:[];
   if(url.pathname.includes('/auth/'))data=user;
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.routeWebSocket('**/*.supabase.co/**',ws=>ws.close());
  await page.addInitScript(({user})=>{
   localStorage.setItem('solarcoop.supabase.auth',JSON.stringify({access_token:'test-only-token',refresh_token:'test-only-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));
  },{user});
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.getByText('Waiting for energy readings',{exact:true}).first().waitFor({timeout:30000});
  assert(!(await page.locator('body').innerText()).includes('6.8 kW'));
  hasReading=true;await page.reload();await page.getByText('Simulated',{exact:true}).waitFor({timeout:30000});
  await page.getByText('Routine Maintenance Scheduled',{exact:true}).waitFor();
  await page.getByText('Production',{exact:true}).first().click();await page.getByText('3.25 kW',{exact:true}).filter({visible:true}).first().waitFor();
  assert(!(await page.locator('body').innerText()).includes('980 W/m'));
  await page.getByText('Surplus',{exact:true}).last().click();await page.getByText('8 kWh',{exact:true}).filter({visible:true}).waitFor();
  assert(!(await page.locator('body').innerText()).includes('11.8 kWh'));
  await page.getByText('P2P Trade',{exact:true}).filter({visible:true}).first().click();
  await page.getByText('Available Community Energy',{exact:true}).waitFor();
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('Owner dashboard browser check passed: empty state, stored readings, faults, production, surplus and P2P navigation.');
 } finally {if(browser)await browser.close();await new Promise(done=>server.close(done));}
})().catch(error=>{console.error(error.message);process.exitCode=1;});
