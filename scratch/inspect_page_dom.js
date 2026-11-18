const http = require('http');
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

async function inspect() {
  const profileDir = path.join(os.tmpdir(), 'edge_inspect_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));

  try {
    const tabRes = await fetch('http://localhost:9224/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    await new Promise(r => setTimeout(r, 3000));

    const domInfo = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          const allButtons = Array.from(document.querySelectorAll('[role="button"], button')).map(b => b.innerText.replace(/\\n/g, ' '));
          const allCards = Array.from(document.querySelectorAll('*')).filter(e => e.children.length === 0 && e.innerText && e.innerText.includes('Explore Table')).map(e => e.parentElement.innerText.replace(/\\n/g, ' '));

          return {
            title: document.title,
            bodySnippet: text.substring(0, 500),
            hasGuestAmenities: text.includes('GUEST AMENITIES'),
            allButtons: allButtons.slice(0, 20),
            allCards: allCards.slice(0, 10)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('DOM Info:', JSON.stringify(domInfo.result.value, null, 2));
  } finally {
    edgeProc.kill();
  }
}

inspect().catch(console.error);
