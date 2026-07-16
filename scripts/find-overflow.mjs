// Connect to a running headless Chrome (--remote-debugging-port=9222) and list
// every element whose box extends past the viewport width.
const PORT = 9222;
const url = process.argv[2] || 'localhost:3000';

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const page = targets.find((t) => t.type === 'page' && t.url.includes(url)) || targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const send = (method, params) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => ws.addEventListener('open', r));
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1400, deviceScaleFactor: 1, mobile: true });
await new Promise((r) => setTimeout(r, 500));

const expr = `(()=>{const W=window.innerWidth;const out=[];document.querySelectorAll('body *').forEach(el=>{const r=el.getBoundingClientRect();if(r.right>W+1){if(el.closest('.noscroll'))return;const cls=(typeof el.className==='string'&&el.className)?'.'+el.className.trim().split(/\\s+/).slice(0,2).join('.'):'';const p=el.parentElement;const pc=(p&&typeof p.className==='string'&&p.className)?'.'+p.className.trim().split(/\\s+/)[0]:p?p.tagName.toLowerCase():'';const txt=(el.textContent||'').trim().slice(0,26).replace(/\\n/g,' ');out.push(el.tagName.toLowerCase()+cls+' <in '+pc+'> w='+Math.round(r.width)+' L='+Math.round(r.left)+' R='+Math.round(r.right)+' :: '+txt);}});return 'innerWidth='+W+' scrollWidth='+document.documentElement.scrollWidth+'\\n'+out.slice(0,30).join('\\n');})()`;
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(res.result.value);
ws.close();
