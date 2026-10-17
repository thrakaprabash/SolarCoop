const { chromium } = require('C:/Users/P R E D A T O R/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve('tmp/theme-web');
  const server = http.createServer((request, response) => {
    const target = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0] === '/' ? '/index.html' : request.url.split('?')[0]));
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', target.endsWith('.js') ? 'text/javascript' : target.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    fs.createReadStream(target).pipe(response);
  });
  await new Promise(resolve => server.listen(8765,'127.0.0.1',resolve));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 412, height: 915 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8765', { waitUntil: 'domcontentloaded' });
  await page.getByRole('radio', { name: 'Light', exact: true }).waitFor({ timeout: 90000 });
  await page.getByRole('radio', { name: 'Light', exact: true }).click();
  await page.waitForFunction(() => localStorage.getItem('solarcoop_theme') === 'light');
  await page.screenshot({ path: 'tmp/pdfs/app-login-light.png', fullPage: true });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('radio', { name: 'Light', exact: true }).waitFor();
  assert.equal(await page.getByRole('radio', { name: 'Light', exact: true }).getAttribute('aria-checked'), 'true');
  await page.getByRole('radio', { name: 'Dark', exact: true }).click();
  await page.waitForFunction(() => localStorage.getItem('solarcoop_theme') === 'dark');
  await page.screenshot({ path: 'tmp/pdfs/app-login-dark.png', fullPage: true });
  await page.getByRole('radio', { name: 'Device', exact: true }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForFunction(() => document.body.innerText.includes('SolarCoop'));
  assert.deepEqual(errors, []);
  console.log('Mobile web: theme switch, saved reload, system option, and no runtime errors passed.');
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
