const path = require('path');
const os = require('os');
const fs = require('fs');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c';

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
  const profileDir = path.join(os.tmpdir(), 'edge_test_fix_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9244',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9244/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Test at 1366x768 (standard laptop) and 1024x600 (compact window)
    for (const [w, h, name] of [[1366, 768, '1366x768_laptop'], [1024, 600, '1024x600_compact'], [1920, 1080, '1920x1080_desktop']]) {
      console.log(`Testing ${name}...`);
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
      await new Promise(r => setTimeout(r, 2500));

      const res = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const btns = Array.from(document.querySelectorAll('[data-testid="category-explore-btn"]'));
            const cards = btns.map(b => {
              let p = b.parentElement;
              while (p && !p.innerText.includes('Places') && !p.innerText.includes('Place')) {
                p = p.parentElement;
              }
              return p;
            });

            const cardStats = cards.slice(0, 3).map((c, i) => {
              const cRect = c.getBoundingClientRect();
              const bRect = btns[i].getBoundingClientRect();
              return {
                cardHeight: Math.round(cRect.height),
                cardTop: Math.round(cRect.top),
                cardBottom: Math.round(cRect.bottom),
                btnVisible: bRect.height > 0 && bRect.width > 0,
                btnBottom: Math.round(bRect.bottom),
                btnInsideCard: bRect.bottom <= cRect.bottom,
                marginInsideCard: Math.round(cRect.bottom - bRect.bottom),
              };
            });

            const maxCardBottom = Math.max(...cards.map(c => Math.round(c.getBoundingClientRect().bottom)));
            const maxBtnBottom = Math.max(...btns.map(b => Math.round(b.getBoundingClientRect().bottom)));

            return {
              windowHeight: window.innerHeight,
              cardsFound: cards.length,
              sampleCards: cardStats,
              maxCardBottom,
              maxBtnBottom,
              isCardCutOff: maxBtnBottom > window.innerHeight,
              bodyScrollable: document.documentElement.scrollHeight > window.innerHeight,
            };
          })()
        `,
        returnByValue: true
      });

      console.log(`Results for ${name}:`, JSON.stringify(res.result.value, null, 2));

      const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(ARTIFACTS_DIR, `verified_fixed_bottom_${name}.png`), Buffer.from(snap.data, 'base64'));
    }

  } finally {
    edgeProc.kill();
  }
}

run().catch(console.error);
