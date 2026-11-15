// scratch/inspect_sidebars.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c';
const DIST_DIR = path.join(__dirname, '..', 'dist');

const mockHotel = {
  id: 'h1',
  hotelPropertyId: 'h1',
  hotelName: 'The Grand Horizon Palace & Resort',
  name: 'The Grand Horizon Palace & Resort',
  city: 'Bengaluru',
  state: 'Karnataka',
  hotelAddress: '42 MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
  address: '42 MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
  hotelAdminId: 'owner_alpha',
  status: 'approved',
  rating: 4.9,
  pricePerNight: '₹14,500 / night',
  latitude: 12.9753,
  longitude: 77.6062,
  images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'],
  imageLink: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
  nearby: {
    touristPlaces: [],
    shopping: [],
    transportation: [],
    gyms: [],
    cafes: []
  }
};

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

    if (pathname === '/api/hotel-properties' || pathname === '/api/hotels') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: [mockHotel] }));
      return;
    }

    if (pathname === '/api/hotel-properties/active' || pathname === '/api/hotels/active') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: mockHotel }));
      return;
    }

    if (pathname.startsWith('/api/tourist-destinations')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }

    if (pathname === '/api/hotel-admins') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: [
          { _id: 'a1', username: 'superadmin', role: 'superadmin', adminEmail: 'super@hotelportal.com' },
          { _id: 'a2', username: 'owner_alpha', role: 'clientadmin', adminEmail: 'owner.alpha@hotel.com' },
        ]
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: [] }));
  });

  return new Promise((resolve) => {
    server.listen(3000, () => {
      console.log('Mock API server listening on http://localhost:3000');
      resolve(server);
    });
  });
}

function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallback);
          }
        });
      } else {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(5050, () => {
      console.log('Static server listening on http://localhost:5050');
      resolve(server);
    });
  });
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

async function captureScreenshot(cdp, outputPath, label) {
  console.log(`Capturing ${label} -> ${path.basename(outputPath)}...`);
  const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(snap.data, 'base64');
  fs.writeFileSync(outputPath, buf);
  console.log(`Successfully saved ${path.basename(outputPath)} (${buf.length} bytes)`);
}

async function main() {
  const apiServer = await startApiServer();
  const staticServer = await startStaticServer();

  const profileDir = path.join(__dirname, 'edge_user_data_inspect');
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

  console.log('Starting Edge headless browser on port 9222...');
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

    // 1. Check Super Admin at 1440
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/superadmin' });
    await new Promise(r => setTimeout(r, 2000));
    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('@hotel_portal_admin_token', 'mock_jwt_superadmin_token');
        localStorage.setItem('@hotel_portal_admin_user', JSON.stringify({ hotelAdminId: 'super_root', username: 'superadmin', role: 'superadmin' }));
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));
    await captureScreenshot(cdp, path.join(ARTIFACTS_DIR, 'inspect_superadmin_1440.png'), 'Super Admin 1440px');

    // Check DOM elements for Super Admin sidebar
    const superAdminCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        ({
          tabs: Array.from(document.querySelectorAll('*')).filter(el => ['Platform Overview', 'Hotel Approval Queue', 'All Hotel Properties', 'Global Destinations'].includes(el.innerText && el.innerText.trim())).map(el => ({ text: el.innerText.trim(), visible: el.offsetParent !== null, bounds: el.getBoundingClientRect() }))
        })
      `,
      returnByValue: true
    });
    console.log('Super Admin sidebar items:', JSON.stringify(superAdminCheck.result.value, null, 2));

    // 2. Check Hotel Admin at 1440
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/admin' });
    await new Promise(r => setTimeout(r, 2000));
    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('@hotel_portal_admin_token', 'mock_jwt_clientadmin_token');
        localStorage.setItem('@hotel_portal_admin_user', JSON.stringify({ hotelAdminId: 'owner_alpha', username: 'owner_alpha', role: 'clientadmin' }));
        localStorage.setItem('@hotel_portal_active_hotel_id', 'h1');
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));
    await captureScreenshot(cdp, path.join(ARTIFACTS_DIR, 'inspect_admin_1440.png'), 'Hotel Admin 1440px');

    const adminCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        ({
          tabs: Array.from(document.querySelectorAll('*')).filter(el => ['Dashboard Overview', 'Hotel & Location Config', 'Hotels Directory', 'Nearby Places & Categories', 'Global Tourist Directory (India)'].includes(el.innerText && el.innerText.trim())).map(el => ({ text: el.innerText.trim(), visible: el.offsetParent !== null, bounds: el.getBoundingClientRect() }))
        })
      `,
      returnByValue: true
    });
    console.log('Hotel Admin sidebar items:', JSON.stringify(adminCheck.result.value, null, 2));

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    try { apiServer.close(); } catch (e) {}
    try { staticServer.close(); } catch (e) {}
    process.exit(0);
  }
}

main().catch(console.error);

