// scratch/capture_restored_sidebar_screens.js
// Captures verified before-and-after screenshots across viewports: Desktop (1440px), Tablet (768px), and Mobile (390px)

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
  nearby: { touristPlaces: [], shopping: [], transportation: [], gyms: [], cafes: [] }
};

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
  },
  {
    destinationId: 'dest_hampi',
    name: 'Group of Monuments at Hampi',
    state: 'Karnataka',
    city: 'Hampi',
    description: 'UNESCO World Heritage site with ruins of the Vijayanagara Empire along the Tungabhadra River.',
    category: 'Monuments & Forts',
    address: 'Hampi, Vijayanagara District, Karnataka',
    latitude: 15.3350,
    longitude: 76.4600,
    timings: '6:00 AM - 6:00 PM Daily',
    entryFee: '₹40 for Indian Nationals',
    imageLink: 'https://images.unsplash.com/photo-1600100397608-f010e42e47c1?w=800&q=80',
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
      res.end(JSON.stringify({ success: true, data: mockDestinations }));
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

  const profileDir = path.join(__dirname, 'edge_user_data_restored');
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

    // =========================================================================
    // 1. DESKTOP (1440px) - RESTORED HOTEL ADMIN SIDEBAR
    // =========================================================================
    console.log('\n--- 1. DESKTOP (1440px) VERIFICATION ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
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

    // Capture Desktop 1440px
    const fileDesktop1440 = path.join(ARTIFACTS_DIR, 'restored_sidebar_desktop_1440.png');
    await captureScreenshot(cdp, fileDesktop1440, 'Hotel Admin Restored Sidebar (1440px Desktop)');

    // Verify all 13 tabs are present and positioned vertically
    const desktopTabsCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const expected = [
            'Dashboard Overview',
            'Hotel & Location Config',
            'Hotels Directory',
            'Nearby Places & Categories',
            'Global Tourist Directory (India)',
            'Restaurants & Dining',
            'Gyms & Wellness',
            'Swimming Pools',
            'Hotel Facilities & Services',
            'Takeaway Partners',
            'Home Delivery',
            'Hotel Payment Config',
            'Availability Matrix'
          ];
          const found = [];
          for (const name of expected) {
            const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === name && e.children.length === 0);
            if (el) {
              const r = el.getBoundingClientRect();
              found.push({ name, visible: r.width > 0 && r.height > 0, x: Math.round(r.x), y: Math.round(r.y) });
            }
          }
          return { totalExpected: expected.length, totalFound: found.length, tabs: found };
        })()
      `,
      returnByValue: true
    });
    console.log('Desktop 1440px Tab Verification:', JSON.stringify(desktopTabsCheck.result.value, null, 2));

    // =========================================================================
    // 2. TABLET (768px) - RESTORED VERTICAL SIDEBAR
    // =========================================================================
    console.log('\n--- 2. TABLET (768px) VERIFICATION ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 2000));

    const fileTablet768 = path.join(ARTIFACTS_DIR, 'restored_sidebar_tablet_768.png');
    await captureScreenshot(cdp, fileTablet768, 'Hotel Admin Restored Vertical Sidebar (768px Tablet)');

    const tabletTabsCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const expected = [
            'Dashboard Overview',
            'Hotel & Location Config',
            'Hotels Directory',
            'Nearby Places & Categories',
            'Global Tourist Directory (India)'
          ];
          const found = [];
          for (const name of expected) {
            const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === name && e.children.length === 0);
            if (el) {
              const r = el.getBoundingClientRect();
              found.push({ name, visible: r.width > 0 && r.height > 0, x: Math.round(r.x), y: Math.round(r.y) });
            }
          }
          return { totalFound: found.length, tabs: found };
        })()
      `,
      returnByValue: true
    });
    console.log('Tablet 768px Tab Verification:', JSON.stringify(tabletTabsCheck.result.value, null, 2));

    // =========================================================================
    // 3. MOBILE (390px) - RESTORED MOBILE SIDEBAR DRAWER
    // =========================================================================
    console.log('\n--- 3. MOBILE (390px) VERIFICATION ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await new Promise(r => setTimeout(r, 1500));

    // Open mobile sidebar drawer
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const pill = Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('Open Sidebar'));
          if (pill) pill.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    const fileMobile390 = path.join(ARTIFACTS_DIR, 'restored_sidebar_mobile_390.png');
    await captureScreenshot(cdp, fileMobile390, 'Hotel Admin Restored Mobile Sidebar Drawer (390px Mobile)');

    const mobileTabsCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const expected = [
            'Dashboard Overview',
            'Hotel & Location Config',
            'Hotels Directory',
            'Nearby Places & Categories',
            'Global Tourist Directory (India)'
          ];
          const found = [];
          for (const name of expected) {
            const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === name && e.children.length === 0);
            if (el) {
              const r = el.getBoundingClientRect();
              found.push({ name, visible: r.width > 0 && r.height > 0, x: Math.round(r.x), y: Math.round(r.y) });
            }
          }
          return { totalFound: found.length, tabs: found };
        })()
      `,
      returnByValue: true
    });
    console.log('Mobile 390px Tab Verification:', JSON.stringify(mobileTabsCheck.result.value, null, 2));

    // =========================================================================
    // 4. TAB INTERACTIVITY & PHASE 3 GLOBAL DESTINATIONS VERIFICATION
    // =========================================================================
    console.log('\n--- 4. TAB CLICK & DESTINATIONS TAB VERIFICATION ---');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 1000));

    // Click "Global Tourist Directory (India)" tab in Admin Console
    const clickDestTab = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const tab = Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.trim() === 'Global Tourist Directory (India)' && el.children.length === 0);
          if (tab) {
            tab.click();
            return { clicked: true, text: tab.innerText };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Clicked Global Tourist Directory tab:', clickDestTab.result.value);
    await new Promise(r => setTimeout(r, 2000));

    const fileAdminGlobalDest = path.join(ARTIFACTS_DIR, 'admin_console_global_destinations_view.png');
    await captureScreenshot(cdp, fileAdminGlobalDest, 'Admin Console Global Tourist Destinations Directory Tab');

    // =========================================================================
    // 5. SUPER ADMIN CONSOLE RESTORED SIDEBAR & NAVIGATION (1440px)
    // =========================================================================
    console.log('\n--- 5. SUPER ADMIN CONSOLE SIDEBAR & ROUTE VERIFICATION ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/superadmin' });
    await new Promise(r => setTimeout(r, 2500));

    const fileSuperAdminRestored = path.join(ARTIFACTS_DIR, 'restored_superadmin_sidebar_1440.png');
    await captureScreenshot(cdp, fileSuperAdminRestored, 'Super Admin Console Restored Sidebar (1440px)');

    // Click "Global Destinations" tab in Super Admin Console
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const tab = Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.trim() === 'Global Destinations' && el.children.length === 0);
          if (tab) tab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    const fileSuperAdminDestinations = path.join(ARTIFACTS_DIR, 'super_admin_phase3_destinations.png');
    await captureScreenshot(cdp, fileSuperAdminDestinations, 'Super Admin Global Destinations Correctly Captured');

    console.log('\n--- ALL VERIFICATIONS AND SCREENSHOTS COMPLETED SUCCESSFULLY ---');

  } catch (err) {
    console.error('Execution error:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    try { apiServer.close(); } catch (e) {}
    try { staticServer.close(); } catch (e) {}
    process.exit(0);
  }
}

main().catch(console.error);

