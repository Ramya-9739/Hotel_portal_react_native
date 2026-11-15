// scratch/visual_verification_all.js
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
  },
  {
    destinationId: 'dest_hampi_monuments',
    name: 'Group of Monuments at Hampi',
    state: 'Karnataka',
    city: 'Hampi',
    description: 'UNESCO World Heritage Site located in east-central Karnataka, ruins of Vijayanagara Empire.',
    category: 'Monuments & Forts',
    address: 'Hampi, Vijayanagara District, Karnataka',
    latitude: 15.3350,
    longitude: 76.4600,
    timings: '6:00 AM - 6:00 PM',
    entryFee: '₹40 for Indians',
    imageLink: 'https://images.unsplash.com/photo-1600100397608-f010e42f61b0?w=800&q=80',
    isActive: true,
  }
];

const mockHotels = [
  {
    id: 'h1',
    hotelPropertyId: 'h1',
    name: 'The Grand Horizon Palace & Resort',
    title: 'The Grand Horizon Palace & Resort',
    city: 'Bengaluru',
    location: 'Bengaluru',
    address: '42 MG Road, Ashok Nagar, Bengaluru, Karnataka 560001',
    hotelAdminId: 'owner_alpha',
    status: 'approved',
    latitude: 12.9753,
    longitude: 77.6062,
    pricePerNight: '₹18,500 / night',
    rating: '4.9',
    images: [],
    nearby: {}
  },
  {
    id: 'h2',
    hotelPropertyId: 'h2',
    name: 'Royal Heritage Mysuru Palace Hotel',
    title: 'Royal Heritage Mysuru Palace Hotel',
    city: 'Mysuru',
    location: 'Mysuru',
    address: '15 Palace South Road, Mysuru, Karnataka 570004',
    hotelAdminId: 'owner_alpha',
    status: 'approved',
    latitude: 12.3050,
    longitude: 76.6550,
    pricePerNight: '₹14,200 / night',
    rating: '4.8',
    images: [],
    nearby: {}
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

    if (pathname === '/api/hotels' || pathname === '/api/hotel-properties' || pathname === '/api/hotel-properties/search') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: mockHotels }));
      return;
    }

    if (pathname === '/api/hotel-admins') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }

    if (pathname.startsWith('/api/display-components')) {
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
  console.log('--- STARTING COMPREHENSIVE VISUAL & FUNCTIONAL VERIFICATION ---');
  const apiServer = await startApiServer();
  const staticServer = await startStaticServer();

  const profileDir = path.join(__dirname, 'edge_user_data_visual_verify');
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

  const results = {};

  try {
    const tabRes = await fetch('http://localhost:9222/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // =========================================================================
    // VIEW 1: HOTEL ADMIN DASHBOARD - DESKTOP (1440 x 900)
    // =========================================================================
    console.log('\n[1/5] Verifying Hotel Admin on Desktop (1440x900)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/admin' });
    await new Promise(r => setTimeout(r, 1500));

    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('@hotel_portal_admin_token', 'mock_jwt_owner_token');
        localStorage.setItem('@hotel_portal_admin_user', JSON.stringify({ hotelAdminId: 'owner_alpha', username: 'owner_alpha', role: 'clientadmin' }));
        localStorage.setItem('@hotel_portal_active_hotel_id', 'h1');
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 2500));

    const desktopCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          // Find the exact tabs container
          const headerNode = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'PROPERTY & DISCOVERY');
          const sidebar = headerNode ? headerNode.closest('div[style*="width: 240"], div[style*="width: 210"]') || headerNode.parentElement.parentElement : null;
          
          // Find the content container
          const titleNode = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'HOTEL & LOCATION CONFIGURATOR');
          const content = titleNode ? titleNode.closest('div[style*="flex: 1"]') || titleNode.parentElement.parentElement.parentElement : null;

          const sbRect = sidebar ? sidebar.getBoundingClientRect() : null;
          const ctRect = content ? content.getBoundingClientRect() : null;

          const expectedTabs = [
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
          const tabsFound = expectedTabs.filter(name => allEls.some(e => e.children.length === 0 && e.innerText && e.innerText.trim() === name));

          return {
            sidebarX: sbRect ? Math.round(sbRect.left) : null,
            sidebarWidth: sbRect ? Math.round(sbRect.width) : null,
            sidebarRight: sbRect ? Math.round(sbRect.right) : null,
            contentLeft: ctRect ? Math.round(ctRect.left) : null,
            hasOverlap: (sbRect && ctRect) ? (sbRect.right > ctRect.left + 2) : false,
            totalExpectedTabs: expectedTabs.length,
            visibleTabsCount: tabsFound.length,
            allTabsVisible: tabsFound.length === expectedTabs.length,
            tabsFound
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Desktop 1440px Verification:', desktopCheck.result.value);
    results.desktop1440 = desktopCheck.result.value;

    const snapDesktop = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_desktop_hotel_admin_1440.png'), Buffer.from(snapDesktop.data, 'base64'));
    console.log('Saved verified_desktop_hotel_admin_1440.png');

    // =========================================================================
    // MULTI-HOTEL SWITCHER VERIFICATION
    // =========================================================================
    console.log('\n[2/5] Verifying Multi-Hotel Switcher Click & Modal...');
    const switcherOpenResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const trigger = document.querySelector('[aria-label="Switch active hotel property"]') ||
                          Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === '2 Hotels');
          if (trigger) {
            const btn = trigger.closest('[role="button"]') || trigger.parentElement || trigger;
            btn.click();
            return { found: true, tag: btn.tagName };
          }
          return { found: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Switcher trigger clicked:', switcherOpenResult.result.value);
    await new Promise(r => setTimeout(r, 1500));

    // Verify modal is open and shows both hotels
    const switcherModalCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const modalHeader = allEls.find(e => e.innerText && e.innerText.includes('SWITCH PROPERTY CONTEXT'));
          const h1Found = allEls.some(e => e.innerText && e.innerText.includes('The Grand Horizon Palace & Resort'));
          const h2Found = allEls.some(e => e.innerText && e.innerText.includes('Royal Heritage Mysuru Palace Hotel'));
          return {
            modalOpen: !!modalHeader,
            h1Visible: h1Found,
            h2Visible: h2Found,
            switcherOperational: !!modalHeader && h1Found && h2Found
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Switcher Modal Check:', switcherModalCheck.result.value);
    results.hotelSwitcher = switcherModalCheck.result.value;

    const snapSwitcher = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_hotel_switcher_modal.png'), Buffer.from(snapSwitcher.data, 'base64'));
    console.log('Saved verified_hotel_switcher_modal.png');

    // Close switcher modal
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = document.querySelector('[aria-label="Close"]') ||
                           Array.from(document.querySelectorAll('*')).find(e => e.innerText && (e.innerText.trim() === 'Cancel' || e.innerText.trim() === 'Close Property Selector'));
          if (closeBtn) closeBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // =========================================================================
    // VIEW 2: TABLET VIEWPORT (768 x 1024)
    // =========================================================================
    console.log('\n[3/5] Verifying Hotel Admin on Tablet (768x1024)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 1500));

    const tabletCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const headerNode = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'PROPERTY & DISCOVERY');
          const sidebar = headerNode ? headerNode.closest('div[style*="width: 210"], div[style*="width: 240"]') || headerNode.parentElement.parentElement : null;
          
          const titleNode = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'HOTEL & LOCATION CONFIGURATOR');
          const content = titleNode ? titleNode.closest('div[style*="flex: 1"]') || titleNode.parentElement.parentElement.parentElement : null;

          const sbRect = sidebar ? sidebar.getBoundingClientRect() : null;
          const ctRect = content ? content.getBoundingClientRect() : null;

          return {
            sidebarRendered: !!sidebar,
            sidebarWidth: sbRect ? Math.round(sbRect.width) : null,
            sidebarRight: sbRect ? Math.round(sbRect.right) : null,
            contentLeft: ctRect ? Math.round(ctRect.left) : null,
            hasOverlap: (sbRect && ctRect) ? (sbRect.right > ctRect.left + 2) : false
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Tablet 768px Verification:', tabletCheck.result.value);
    results.tablet768 = tabletCheck.result.value;

    const snapTablet = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_tablet_hotel_admin_768.png'), Buffer.from(snapTablet.data, 'base64'));
    console.log('Saved verified_tablet_hotel_admin_768.png');

    // =========================================================================
    // VIEW 3: MOBILE VIEWPORT (390 x 844)
    // =========================================================================
    console.log('\n[4/5] Verifying Hotel Admin on Mobile (390x844)...');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 1500));

    // Open mobile sidebar drawer
    const openMobileDrawer = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const els = Array.from(document.querySelectorAll('*'));
          const leaf = els.find(e => e.children.length === 0 && e.innerText && e.innerText.trim().includes('Open Sidebar'));
          if (leaf) {
            const btn = leaf.closest('[role="button"]') || leaf.closest('div[tabindex]') || leaf.parentElement;
            const r = btn.getBoundingClientRect();
            return { found: true, x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }
          return { found: false };
        })()
      `,
      returnByValue: true
    });

    if (openMobileDrawer.result.value && openMobileDrawer.result.value.found) {
      const cx = Math.round(openMobileDrawer.result.value.x);
      const cy = Math.round(openMobileDrawer.result.value.y);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx, y: cy });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
      await new Promise(r => setTimeout(r, 100));
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'left', clickCount: 1 });
      await new Promise(r => setTimeout(r, 1500));
    }

    const mobileCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const closePill = allEls.some(e => e.innerText && e.innerText.includes('Close Menu ▲'));
          const hasDashboardSec = allEls.some(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'DASHBOARD');
          const hasDiscoverySec = allEls.some(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'PROPERTY & DISCOVERY');
          const hasAmenitiesSec = allEls.some(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'GUEST AMENITIES');
          return {
            drawerOpen: closePill,
            sectionsVisible: hasDashboardSec && hasDiscoverySec && hasAmenitiesSec
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Mobile 390px Drawer Check:', mobileCheck.result.value);
    results.mobile390 = mobileCheck.result.value;

    const snapMobile = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_mobile_hotel_admin_390.png'), Buffer.from(snapMobile.data, 'base64'));
    console.log('Saved verified_mobile_hotel_admin_390.png');

    // =========================================================================
    // VIEW 4 & 5: SUPER ADMIN ROUTE MATCHING & GLOBAL DESTINATIONS TAB
    // =========================================================================
    console.log('\n[5/5] Verifying Super Admin Route Matching & Global Tourist Destinations...');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    // Step 5A: Route #/superadmin (no hyphen)
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/superadmin' });
    await new Promise(r => setTimeout(r, 1500));
    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('@hotel_portal_admin_token', 'mock_jwt_superadmin_token');
        localStorage.setItem('@hotel_portal_admin_user', JSON.stringify({ hotelAdminId: 'platform_owner', username: 'superadmin', role: 'superadmin' }));
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 2500));

    const checkNoHyphen = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const body = document.body.innerText;
          return {
            renderedSuperAdmin: body.includes('SUPER ADMIN CONSOLE') && body.includes('GOVERNANCE & PLATFORM'),
            renderedHotelAdmin: body.includes('HOTEL & LOCATION CONFIGURATOR')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Route #/superadmin (without hyphen) test:', checkNoHyphen.result.value);
    results.routeSuperadminNoHyphen = checkNoHyphen.result.value;

    // Step 5B: Route #/super-admin (with hyphen)
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/super-admin' });
    await new Promise(r => setTimeout(r, 2000));

    const checkWithHyphen = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const body = document.body.innerText;
          return {
            renderedSuperAdmin: body.includes('SUPER ADMIN CONSOLE') && body.includes('GOVERNANCE & PLATFORM'),
            renderedHotelAdmin: body.includes('HOTEL & LOCATION CONFIGURATOR')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Route #/super-admin (with hyphen) test:', checkWithHyphen.result.value);
    results.routeSuperadminWithHyphen = checkWithHyphen.result.value;

    // Step 5C: Click Global Destinations tab in Super Admin Console
    const clickDestTab = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const destTab = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'Global Destinations');
          if (destTab) {
            const btn = destTab.closest('[role="button"]') || destTab.parentElement;
            btn.click();
            return { clicked: true, text: destTab.innerText.trim() };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Clicked "Global Destinations" tab:', clickDestTab.result.value);
    await new Promise(r => setTimeout(r, 2000));

    // Verify Destinations Content in Super Admin
    const superAdminContentCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyText = document.body.innerText;
          const allEls = Array.from(document.querySelectorAll('*'));
          
          const headerNode = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'GOVERNANCE & PLATFORM');
          const sidebar = headerNode ? headerNode.closest('div[style*="width: 240"], div[style*="width: 210"]') || headerNode.parentElement.parentElement : null;
          
          const titleNode = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'INDIA TOURIST DESTINATIONS DIRECTORY');
          const content = titleNode ? titleNode.closest('div[style*="flex: 1"]') || titleNode.parentElement.parentElement.parentElement : null;

          const sbRect = sidebar ? sidebar.getBoundingClientRect() : null;
          const ctRect = content ? content.getBoundingClientRect() : null;

          return {
            sidebarWidth: sbRect ? Math.round(sbRect.width) : null,
            contentLeft: ctRect ? Math.round(ctRect.left) : null,
            hasOverlap: (sbRect && ctRect) ? (sbRect.right > ctRect.left + 2) : false,
            hasDestinationsTitle: bodyText.includes('INDIA TOURIST DESTINATIONS DIRECTORY'),
            hasMysorePalace: bodyText.includes('Mysore Palace (Amba Vilas)'),
            hasHampi: bodyText.includes('Group of Monuments at Hampi'),
            hasSearchBox: bodyText.includes('Search destination, state, city') || allEls.some(e => e.placeholder && e.placeholder.includes('Search destination')),
            hasAddButton: bodyText.includes('Add New Destination')
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Super Admin Global Destinations Content Check:', superAdminContentCheck.result.value);
    results.superAdminDestinations = superAdminContentCheck.result.value;

    const snapSuperAdmin = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_super_admin_destinations_1440.png'), Buffer.from(snapSuperAdmin.data, 'base64'));
    console.log('Saved verified_super_admin_destinations_1440.png');

    console.log('\n===============================================================');
    console.log('FINAL VERIFICATION RESULTS SUMMARY:');
    console.log(JSON.stringify(results, null, 2));
    console.log('===============================================================');

  } catch (err) {
    console.error('Error during visual verification:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    try { staticServer.close(); } catch (e) {}
    try { apiServer.close(); } catch (e) {}
    process.exit(0);
  }
}

main().catch(console.error);
