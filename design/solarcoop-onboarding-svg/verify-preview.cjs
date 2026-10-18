const {chromium}=require('C:/Users/irush/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {pathToFileURL}=require('url');const path=require('path');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(__dirname,'preview.html')).href);
  const button=name=>page.getByRole('button',{name,exact:true});
  await button('Next').waitFor();await button('Next').click();await button('Next').click();await button('Get started').click();
  await button('Create an account').click();if(!(await page.locator('#feedback').textContent()).includes('Register'))throw Error('Register handoff');
  await button('Switch to dark').click();if(!(await page.locator('#screen').getAttribute('src')).includes('/dark/'))throw Error('Dark theme');
  await button('Replay opening').click();await button('Skip onboarding').waitFor();await button('Skip onboarding').click();
  await button('Log in').click();if(!(await page.locator('#feedback').textContent()).includes('Login'))throw Error('Login handoff');
  if(errors.length)throw Error(errors.join('; '));
  console.log('Verified opening/loading, Next, Get started, Skip, dark theme and both auth handoffs.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
