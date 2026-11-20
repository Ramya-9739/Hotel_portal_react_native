const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 9228;
const USER_DATA_DIR = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c\\edge_profile_render_test';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
    });
    this.ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  close() {
    try { this.ws.close(); } catch(e) {}
  }
}

async function main() {
  console.log('Spawning Edge...');
  const edgeProc = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--no-first-run',
    '--window-size=1920,1080',
    'http://localhost:8081/#/guest',
  ]);
  edgeProc.on('error', err => console.error('Edge spawn error:', err));

  await sleep(4000);
  console.log('Connecting to Edge on port', PORT);
  const list = await getJson(`http://127.0.0.1:${PORT}/json/list`);
  const page = list.find((p) => p.type === 'page' && p.url.includes('8081')) || list.find(p => p.type === 'page');
  console.log('Selected target:', page?.url);
  const cdp = new CdpSession(page.webSocketDebuggerUrl);
  await cdp.connect();
  console.log('CDP connected.');

  console.log('Waiting for guest portal to render...');
  for (let i = 0; i < 20; i++) {
    const text = await cdp.evaluate('document.body.innerText || ""');
    if (text.includes('MANGO HOTELS') || text.includes('TOP TOURIST PLACES')) {
      console.log(`Page rendered in ${i + 1} iterations!`);
      break;
    }
    await sleep(1000);
  }
  await sleep(2000);

  const data = await cdp.evaluate(`(() => {
    const text = document.body.innerText;
    return {
      title: document.title,
      hasEmptyTourist: text.includes('No items currently available'),
      hasEmptyShopping: text.includes('No shopping destinations found'),
      hasEmptyTransit: text.includes('No transportation hubs found'),
      hasBangalorePalace: text.includes('Bengaluru Palace'),
      hasUBCity: text.includes('UB City'),
      hasKempegowdaAirport: text.includes('Kempegowda') || text.includes('Airport'),
      textSnippet: text.slice(0, 1000)
    };
  })()`);

  console.log('RENDER RESULTS:', JSON.stringify(data, null, 2));

  // Capture screenshot
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c\\live_portal_view.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to live_portal_view.png');

  cdp.close();
  edgeProc.kill();
}

main().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
