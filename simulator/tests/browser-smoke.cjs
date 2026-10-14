// Run with the local simulator server started and Playwright available on NODE_PATH.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({channel:process.env.SIM_BROWSER_CHANNEL || 'msedge',headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1100}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://localhost:5050/?preview=1');
    await page.waitForFunction(()=>!document.querySelector('#play').disabled);
    assert.equal(await page.locator('.house-card').count(),6);
    await page.locator('#play').click();
    await page.waitForFunction(()=>document.querySelector('#play').textContent.includes('Pause'));
    await page.locator('[data-fault]').first().selectOption('E01');
    await page.waitForSelector('.fault-info');
    await page.waitForFunction(()=>document.querySelector('.house-card .readings strong').textContent.includes('0.00'));
    await page.locator('[data-clear]').first().click();
    await page.waitForFunction(()=>document.querySelectorAll('.fault-info').length===0);
    await page.waitForFunction(()=>parseFloat(document.querySelector('.house-card .readings strong').textContent)>0);
    await page.locator('[data-edit]').first().click();
    await page.locator('[name=capacity_kw]').fill('6');
    await page.locator('#edit-form button[type=submit]').click();
    await page.waitForFunction(()=>!document.querySelector('#edit-dialog').open&&!document.querySelector('#play').disabled);
    await page.locator('[data-preset=evening]').click();
    await page.waitForFunction(()=>document.querySelector('#time-display').textContent.startsWith('19:'));
    await page.waitForFunction(()=>parseFloat(document.querySelector('.house-card .readings strong').textContent)===0);
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#reset').click();
    await page.waitForFunction(()=>document.querySelector('#play').textContent.includes('Play'));
    assert.deepEqual(errors,[]);
    // Normal local controls connect without a URL key and never drive a second engine.
    const localFixture=(await import('../src/preview.js')).previewApi();
    await localFixture.call('update_config',{p_patch:{running:true}});
    let duplicateTicks=0;
    await page.route('**/api/sim/**',async route=>{
      const name=route.request().url().split('/').pop();
      const params=JSON.parse(route.request().postData());
      assert.equal('p_key' in params,false);
      if(name==='push_tick') duplicateTicks++;
      const data=await localFixture.call(name,params);
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data ?? null)});
    });
    await page.goto('http://localhost:5050/');
    await page.waitForFunction(()=>!document.querySelector('#play').disabled);
    assert.equal(await page.locator('.house-card').count(),6);
    assert((await page.locator('#play').textContent()).includes('Pause'));
    await page.locator('#weather').selectOption('cloudy');
    await page.waitForFunction(()=>!document.querySelector('#play').disabled);
    assert.equal((await localFixture.call('snapshot')).config.weather,'cloudy');
    assert.equal(duplicateTicks,0);assert.deepEqual(errors,[]);
    console.log('Browser smoke passed: preview controls, faults, recovery, mobile layout and key-free local controls without duplicate ticks.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
