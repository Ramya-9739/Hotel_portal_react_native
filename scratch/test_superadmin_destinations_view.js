// scratch/test_superadmin_destinations_view.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c';
const DIST_DIR = path.join(__dirname, '..', 'dist');

const mockDestinations = [
  {
    destinationId: 'dest_mysore_palace',
    name: 'Mysore Palace (Amba Vilas)',
    state: 'Karnataka',
    city: 'Mysuru',
    description: 'Historical royal palace and official residence of the Wadiyar dynasty. Famous for its Indo-Saracenic grandeur.',
    category: 'Heritage & Palaces',
    address: 'Sayyaji Rao Road, Agrahara, Chamrajpura, Mysuru',
    latitude: 12.3052,
    longitude: 76.6552,
    timings: '10:00 AM - 5:30 PM Daily',
    entryFee: '₹100 for Indian Nationals',
    imageLink: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80',
    isActive: true,
  }
];

function startApiServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost:3000');
    const pathname = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-hotel-id');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (pathname.startsWith('/api/tourist-destinations')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: mockDestinations }));
      return;
    }

    if (pathname === '/api/hotels' || pathname === '/api/hotel-properties') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }

    if (pathname === '/api/hotel-admins') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: [] }));
  });

  return new Promise((resolve) => server.listen(3000, () => resolve(server)));
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    fs.readFile(filePath, (err, content) => {
      if (err) {
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, fallback) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallback);
        });
      } else {
        res.writeHead(200);
        res.end(content);
      }
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
  const apiServer = await startApiServer();
  const staticServer = await startStaticServer();

  const profileDir = path.join(__dirname, 'edge_user_data_superadmin_dest');
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

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/super-admin' });
    await new Promise(r => setTimeout(r, 2000));

    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('@hotel_portal_admin_token', 'mock_jwt_superadmin_token');
        localStorage.setItem('@hotel_portal_admin_user', JSON.stringify({ hotelAdminId: 'super_root', username: 'superadmin', role: 'superadmin' }));
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));

    // Click "Global Destinations" tab in Super Admin Sidebar
    const clickRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const items = Array.from(document.querySelectorAll('*'));
          const tab = items.find(el => el.innerText && el.innerText.trim() === 'Global Destinations' && el.children.length === 0);
          if (tab) {
            tab.closest('div[role="button"], div[tabindex]')?.click() || tab.parentElement?.click() || tab.click();
            return { clicked: true, text: tab.innerText };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Click result:', clickRes.result.value);
    await new Promise(r => setTimeout(r, 2500));

    const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'super_admin_real_destinations_tab.png'), Buffer.from(snap.data, 'base64'));
    console.log('Saved super_admin_real_destinations_tab.png');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    try { apiServer.close(); } catch (e) {}
    try { staticServer.close(); } catch (e) {}
    process.exit(0);
  }
}

main().catch(console.error);

