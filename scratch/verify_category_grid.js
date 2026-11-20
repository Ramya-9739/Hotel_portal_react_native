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

async function verifyCards() {
  const profileDir = path.join(os.tmpdir(), 'edge_cards_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9232',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9232/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    
    // Wait for elements
    for (let i = 0; i < 15; i++) {
      const check = await cdp.send('Runtime.evaluate', {
        expression: 'document.querySelectorAll(\'[data-testid="category-explore-btn"]\').length >= 10',
        returnByValue: true,
      });
      if (check.result.value) break;
      await new Promise(r => setTimeout(r, 500));
    }

    const cardDetails = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('[data-testid="category-explore-btn"]'));
          const cards = btns.map(b => {
            let cur = b.parentElement;
            while (cur && (!cur.innerText.includes('Places') && !cur.innerText.includes('Place'))) {
              cur = cur.parentElement;
            }
            const rect = cur ? cur.getBoundingClientRect() : null;
            const bRect = b.getBoundingClientRect();
            return {
              title: cur ? cur.querySelector('[class*="r-fontSize-12"]')?.innerText || cur.innerText.split('\\n')[1] : null,
              top: rect ? Math.round(rect.top) : null,
              left: Math.round(rect.left),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              btnBottomGap: Math.round(rect.bottom - bRect.bottom),
              overflows: cur ? (cur.scrollHeight > cur.clientHeight || cur.scrollWidth > cur.clientWidth) : false,
            };
          });

          return cards;
        })()
      `,
      returnByValue: true
    });

    console.log('Detected Category Buttons:', cardDetails.result.value.length);
    console.table(cardDetails.result.value);

  } finally {
    edgeProc.kill();
  }
}

verifyCards().catch(console.error);
