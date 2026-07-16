// Reliable mobile screenshot via CDP emulation (avoids window-size min-width clamp).
// usage: node scripts/cdp-shot.mjs <outfile> <width> <height>
const out = process.argv[2], w = +(process.argv[3] || 390), h = +(process.argv[4] || 1400);
const t = await (await fetch('http://127.0.0.1:9222/json')).json();
const p = t.find((x) => x.type === 'page');
const ws = new WebSocket(p.webSocketDebuggerUrl);
let id = 0; const pend = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } });
const s = (me, pa) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: me, params: pa })); });
await new Promise((r) => ws.addEventListener('open', r));
await s('Page.enable');
await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await new Promise((r) => setTimeout(r, 900));
const r = await s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
if (!r || !r.data) { console.error('capture failed:', JSON.stringify(r)); process.exit(1); }
const fs = await import('node:fs');
fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
console.log('saved', out);
ws.close();
