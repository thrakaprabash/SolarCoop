// Offline Figma development plugin. Generated DATA is prepended by generate.cjs.
function rgb(hex) {
  const value = hex.replace('#', '');
  return { r: parseInt(value.slice(0, 2), 16) / 255, g: parseInt(value.slice(2, 4), 16) / 255, b: parseInt(value.slice(4, 6), 16) / 255 };
}
function paint(color) { return [{ type: 'SOLID', color: rgb(color) }]; }
async function main() {
  const styles = { 400: 'Regular', 500: 'Medium', 600: 'Semi Bold', 700: 'Bold', 800: 'Extra Bold' };
  const available = await figma.listAvailableFontsAsync();
  const family = available.some(f => f.fontName.family === 'Inter') ? 'Inter' : 'Roboto';
  const fonts = {};
  for (const weight of Object.keys(styles)) {
    const match = available.find(f => f.fontName.family === family && f.fontName.style === styles[weight]);
    fonts[weight] = match ? match.fontName : { family, style: 'Regular' };
    await figma.loadFontAsync(fonts[weight]);
  }
  const scripts = {};
  for (const [key, pattern] of [['si', /Sinhala|Nirmala UI/], ['ta', /Tamil|Nirmala UI/]]) {
    const match = available.find(f => pattern.test(f.fontName.family) && f.fontName.style === 'Regular');
    if (match) { scripts[key] = match.fontName; await figma.loadFontAsync(match.fontName); }
  }
  // Every run creates a separate page so existing design work stays recoverable.
  const page = figma.createPage();
  page.name = 'Technician · Current app · ' + new Date().toISOString().slice(0, 10);
  await figma.setCurrentPageAsync(page);
  const frames = new Map();
  const links = [];
  const perTheme = DATA.screens.length / 2;
  for (let index = 0; index < DATA.screens.length; index++) {
    const screen = DATA.screens[index];
    const frame = figma.createFrame();
    frame.name = screen.theme.toUpperCase() + ' / ' + screen.name;
    frame.resize(screen.w, screen.h);
    frame.x = (index % perTheme % 7) * 450;
    frame.y = Math.floor(index % perTheme / 7) * 1450 + (screen.theme === 'dark' ? 6200 : 0);
    frame.fills = paint(DATA.palettes[screen.theme].bg);
    frame.clipsContent = true;
    page.appendChild(frame);
    frame.setPluginData('sourceScreen', screen.id);
    frame.setPluginData('scope', 'Source-derived design snapshot; illustrative data; not a backend simulation.');
    frames.set(screen.theme + ':' + screen.id, frame);
    for (const op of screen.ops) {
      let node;
      if (op.kind === 'icon') {
        node = figma.createNodeFromSvg(op.svg);
        node.resize(op.w, op.h);
      } else if (op.kind === 'text') {
        node = figma.createText();
        node.fontName = scripts[op.script] || fonts[op.weight] || fonts[400];
        node.fontSize = op.size;
        node.lineHeight = { unit: 'PIXELS', value: op.size * 1.45 };
        node.fills = paint(op.color);
        node.characters = op.value;
        node.textAlignHorizontal = op.align || 'LEFT';
        node.textAutoResize = 'HEIGHT';
        node.resize(op.w, op.h);
      } else {
        node = op.kind === 'ellipse' ? figma.createEllipse() : figma.createRectangle();
        node.resize(op.w, op.h);
        if (op.r && op.kind !== 'ellipse') node.cornerRadius = op.r;
        node.fills = op.kind === 'hotspot' || !op.fill ? [] : paint(op.fill);
        if (op.gradient) node.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { ...rgb(op.fill), a: 1 } }, { position: 1, color: { ...rgb(op.gradient), a: 1 } }] }];
        if (op.stroke) { node.strokes = paint(op.stroke); node.strokeWeight = 1; }
        if (op.kind === 'hotspot') { node.fills = [{ type: 'SOLID', color: rgb('#FFFFFF'), opacity: 0 }]; links.push({ node, theme: op.targetTheme || screen.theme, target: op.target }); }
      }
      frame.appendChild(node);
      node.x = op.x;
      node.y = op.y;
      node.name = op.name || op.kind;
      if (op.opacity != null) node.opacity = op.opacity;
    }
  }
  // Same-theme navigation, with explicit light/dark jumps from the appearance sheet.
  for (const link of links) {
    const destination = frames.get(link.theme + ':' + link.target);
    if (!destination) throw new Error('Missing destination: ' + link.target);
    await link.node.setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: destination.id, navigation: 'NAVIGATE', transition: null, preserveScrollPosition: false }] }]);
  }
  const start = frames.get('light:board-active');
  page.selection = [start];
  figma.viewport.scrollAndZoomIntoView([start]);
  figma.closePlugin('Created ' + DATA.screens.length + ' editable technician frames with navigation.');
}
main().catch(error => { console.error(error); figma.closePlugin('Import stopped: ' + error.message); });
