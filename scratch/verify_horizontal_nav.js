const path = require('path');
const os = require('os');
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

async function verifyNav() {
  const profileDir = path.join(os.tmpdir(), 'edge_nav2_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9242',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9242/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    await new Promise(r => setTimeout(r, 2500));

    // Click on Cafes explore button
    const click = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('[data-testid="category-explore-btn"]'));
          if (btns.length > 0) {
            btns[0].click();
            return { clicked: true, label: btns[0].getAttribute('aria-label') };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Explore button click result:', click.result.value);
    await new Promise(r => setTimeout(r, 1200));

    const check = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            tableVisible: document.body.innerText.includes('INFORMATION TABLE') || document.body.innerText.includes('OPERATING HOURS'),
            hasBackButton: !!document.querySelector('[aria-label="Back to Hotel Portal"]'),
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Themed table screen status:', check.result.value);

  } finally {
    edgeProc.kill();
  }
}

verifyNav().catch(console.error);
