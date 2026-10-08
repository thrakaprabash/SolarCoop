const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = __dirname;
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root,'.'+(pathname==='/' ? '/index.html' : pathname));
    if (!file.startsWith(root+path.sep) || !types[path.extname(file)]) { res.writeHead(404); return res.end('Not found'); }
    const content = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)]+'; charset=utf-8', 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff' });
    res.end(req.method==='HEAD' ? undefined : content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(5050,'127.0.0.1',()=>console.log('SolarCoop Simulator: http://localhost:5050/?key=<demo-key>\nOffline preview: http://localhost:5050/?preview=1'));
