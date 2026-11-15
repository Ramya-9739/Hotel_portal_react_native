// scratch/capture_mobile_drawer.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c';
const DIST_DIR = path.join(__dirname, '..', 'dist');

const mockHotel = {
  id: 'h1',
  name: 'The Grand Horizon Palace & Resort',
  city: 'Bengaluru',
  hotelAdminId: 'owner_alpha',
  status: 'approved',
  images: [],
  nearby: {}
};

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    fs.readFile(filePath, (err, content) => {
      res.writeHead(200);
      res.end(content);
    });
  });
  return new Promise((resolve) => server.listen(5050, () => resolve(server)));
}

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

async function main() {
  const staticServer = await startStaticServer();

  const profileDir = path.join(__dirname, 'edge_user_data_mobile');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const args = [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
  ];

  const edgeProc = spawn(edgeExe, args, { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));

  try {
    const tabRes = await fetch('http://localhost:9222/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/admin' });
    await new Promise(r => setTimeout(r, 2000));

    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('@hotel_portal_admin_token', 'mock_jwt_superadmin_token');
        localStorage.setItem('@hotel_portal_admin_user', JSON.stringify({ hotelAdminId: 'owner_alpha', username: 'superadmin', role: 'superadmin' }));
        localStorage.setItem('@hotel_portal_active_hotel_id', 'h1');
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));

    // Find the mobile pill row and click it
    const clickResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const els = Array.from(document.querySelectorAll('*'));
          const leaf = els.find(e => e.children.length === 0 && e.innerText && e.innerText.trim().includes('Open Sidebar'));
          if (leaf) {
            const btn = leaf.closest('[role="button"]') || leaf.closest('div[tabindex]') || leaf.parentElement;
            const r = btn.getBoundingClientRect();
            return { found: true, x: r.x + r.width / 2, y: r.y + r.height / 2, text: leaf.innerText.trim() };
          }
          return { found: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Pill click result:', clickResult.result.value);

    if (clickResult.result.value && clickResult.result.value.found) {
      const cx = Math.round(clickResult.result.value.x);
      const cy = Math.round(clickResult.result.value.y);
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: cx,
        y: cy
      });
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: cx,
        y: cy,
        button: 'left',
        clickCount: 1
      });
      await new Promise(r => setTimeout(r, 100));
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: cx,
        y: cy,
        button: 'left',
        clickCount: 1
      });
      await new Promise(r => setTimeout(r, 1500));
    }

    const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(snap.data, 'base64');
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'restored_sidebar_mobile_390.png'), buf);
    console.log('Successfully captured mobile drawer open:', buf.length, 'bytes');

    // Also verify what tabs are visible in the mobile drawer
    const tabs = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const expected = [
            'Dashboard Overview',
            'Hotel & Location Config',
            'Hotels Directory',
            'Nearby Places & Categories',
            'Global Tourist Directory (India)',
            'Restaurants & Dining'
          ];
          const found = [];
          for (const name of expected) {
            const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === name && e.children.length === 0);
            if (el) {
              const r = el.getBoundingClientRect();
              found.push({ name, x: Math.round(r.x), y: Math.round(r.y) });
            }
          }
          return found;
        })()
      `,
      returnByValue: true
    });
    console.log('Mobile drawer tabs found:', JSON.stringify(tabs.result.value, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    try { staticServer.close(); } catch (e) {}
    process.exit(0);
  }
}

main().catch(console.error);
