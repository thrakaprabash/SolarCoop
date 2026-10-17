// Render real component styles with React Native Web, using synthetic display data.
// This static local page has no authentication, network client or write actions.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const React = require('react');
const RN = require('react-native-web');
const { renderToStaticMarkup } = require('react-dom/server');
const babel = require('@babel/core');
const root = path.resolve(__dirname, '..');
function load(relative, name, deps = {}) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
    .replace(/^import[\s\S]*?from ['"][^'"]+['"];?\r?\n/gm, '')
    .replace(/export default function /g, 'function ').replace(/export const /g, 'const ')
    .replace(/^export default .*;\r?$/gm, '');
  const code = babel.transformSync(source, { configFile: false, babelrc: false,
    plugins: ['@babel/plugin-transform-react-jsx'] }).code;
  const args = { React, ...RN, ...deps };
  return new Function(...Object.keys(args), `${code}\nreturn ${name};`)(...Object.values(args));
}
const colors = load('theme/colors.js', 'colors');
const weight = load('theme/typography.js', 'weight');
const layout = load('theme/layout.js', '{radius,shadow}');
const theme = { colors, weight, ...layout };
const Card = load('components/ui/Card.js', 'Card', theme);
const DetailRow = load('components/ui/DetailRow.js', 'DetailRow', theme);
const reference = 'TXN-E3BED65B5B0641CE870E330558931BEC';
const fixtures = [320, 375, 430].map(width => `<section data-width="${width}" style="width:${width}px;margin:24px 0">
  <h2>${width}px screen: transaction reference</h2>
  ${renderToStaticMarkup(React.createElement(RN.View, { style: { paddingHorizontal: 16 } },
    React.createElement(Card, { padding: 18 },
      React.createElement(DetailRow, { label: 'Transaction ID', value: reference }))))}
  </section>`).join('\n');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>SolarCoop component audit fixtures</title>
  <style>${RN.StyleSheet.getSheet().textContent}\nbody{margin:12px;background:#0B1020;color:white;font-family:Arial}h2{font-size:14px}</style>
  <h1 style="font-size:20px">Component audit: synthetic layout fixtures</h1>${fixtures}</html>`;
fs.writeFileSync(path.join(__dirname, 'visual-fixtures.html'), html);
if (process.argv.includes('--serve')) {
  http.createServer((_req, res) => { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); })
    .listen(8085, '127.0.0.1', () => console.log('Static audit fixtures: http://127.0.0.1:8085/'));
}
