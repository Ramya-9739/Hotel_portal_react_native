const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }
  async connect() {
    const WebSocket = require('ws');
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
      this.ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      });
    });
  }
  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

async function run() {
  const profileDir = path.join(os.tmpdir(), 'edge_repro_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9243',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9243/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 505, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    await new Promise(r => setTimeout(r, 3000));

    const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('scratch/repro_1024x505.png', Buffer.from(snap.data, 'base64'));

    const metrics = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const exploreBtns = Array.from(document.querySelectorAll('[data-testid="category-explore-btn"]'));
          const cards = exploreBtns.map(b => {
            let p = b.parentElement;
            while (p && !p.innerText.includes('Places') && !p.innerText.includes('Place')) {
              p = p.parentElement;
            }
            return p;
          });

          return {
            windowHeight: window.innerHeight,
            exploreBtnTops: exploreBtns.map(b => Math.round(b.getBoundingClientRect().top)),
            exploreBtnBottoms: exploreBtns.map(b => Math.round(b.getBoundingClientRect().bottom)),
            cardTops: cards.map(c => Math.round(c.getBoundingClientRect().top)),
            cardBottoms: cards.map(c => Math.round(c.getBoundingClientRect().bottom)),
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Metrics at 1024x505:', JSON.stringify(metrics.result.value, null, 2));

  } finally {
    edgeProc.kill();
  }
}

run().catch(console.error);
