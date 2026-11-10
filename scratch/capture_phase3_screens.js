// =============================================================================
// scratch/capture_phase3_screens.js
// Automated Headless Screenshot Capture for Phase 3 Verification
// =============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Mock data
const mockHotels = [
  {
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
      touristPlaces: [
        {
          id: 'p1',
          name: 'Lalbagh Botanical Garden',
          title: 'Lalbagh Botanical Garden',
          subtitle: 'Historic 240-acre garden with iconic Glass House & royal bonsai collection',
          desc: 'Commissioned by Hyder Ali and completed by Tipu Sultan.',
          rating: 4.8,
          timings: '6:00 AM - 7:00 PM',
          price: '₹30 per visitor',
          imageLink: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80',
          image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80',
          address: 'Mavalli, Bengaluru, Karnataka 560004',
        },
        {
          id: 'p2',
          name: 'Bangalore Palace',
          title: 'Bangalore Palace',
          subtitle: 'Tudor-style royal estate inspired by Windsor Castle',
          desc: '19th-century royal palace surrounded by lavish gardens and wood carvings.',
          rating: 4.85,
          timings: '10:00 AM - 5:30 PM',
          price: '₹250 per visitor',
          imageLink: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80',
          image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80',
          address: 'Vasanth Nagar, Bengaluru, Karnataka 560052',
        }
      ],
      shopping: [],
      transportation: [],
      gyms: [],
      cafes: []
    }
  }
];

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
    images: [],
    rating: 4.95,
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
    images: [],
    rating: 4.9,
    isActive: true,
  },
  {
    destinationId: 'dest_taj_mahal',
    name: 'Taj Mahal',
    state: 'Uttar Pradesh',
    city: 'Agra',
    description: 'World Wonder ivory-white marble mausoleum on the south bank of the Yamuna River.',
    category: 'Monuments & Forts',
    address: 'Dharmapuri, Forest Colony, Tajganj, Agra',
    latitude: 27.1751,
    longitude: 78.0421,
    timings: 'Sunrise to Sunset (Closed Fridays)',
    entryFee: '₹50 for Indian Nationals',
    imageLink: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80',
    images: [],
    rating: 4.98,
    isActive: true,
  },
  {
    destinationId: 'dest_gateway_india',
    name: 'Gateway of India',
    state: 'Maharashtra',
    city: 'Mumbai',
    description: 'Iconic 20th-century arch monument overlooking the Arabian Sea at Apollo Bunder.',
    category: 'Monuments & Forts',
    address: 'Apollo Bandar, Colaba, Mumbai',
    latitude: 18.9220,
    longitude: 72.8347,
    timings: 'Open 24 Hours',
    entryFee: 'Free Entry',
    imageLink: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
    images: [],
    rating: 4.8,
    isActive: true,
  },
  {
    destinationId: 'dest_qutub_minar',
    name: 'Qutub Minar Complex',
    state: 'Delhi',
    city: 'New Delhi',
    description: 'Tallest brick minaret in the world surrounded by ancient medieval monuments and iron pillar.',
    category: 'Heritage & Palaces',
    address: 'Seth Sarai, Mehrauli, New Delhi',
    latitude: 28.5244,
    longitude: 77.1855,
    timings: '7:00 AM - 5:00 PM Daily',
    entryFee: '₹35 for Indian Nationals',
    imageLink: 'https://images.unsplash.com/photo-1545129139-1beb780cf337?w=800&q=80',
    images: [],
    rating: 4.75,
    isActive: true,
  },
  {
    destinationId: 'dest_staged_reserve',
    name: 'Ranthambore National Park (Zone 1-5)',
    state: 'Rajasthan',
    city: 'Sawai Madhopur',
    description: 'Premier royal Bengal tiger reserve and ancient fortress.',
    category: 'Nature & Wildlife',
    address: 'Sawai Madhopur District, Rajasthan',
    latitude: 26.0173,
    longitude: 76.5026,
    timings: '6:30 AM - 10:00 AM, 2:30 PM - 6:00 PM',
    entryFee: 'Safari Permit Required',
    imageLink: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&q=80',
    images: [],
    rating: 4.88,
    isActive: false, // Inactive / Staged
  }
];

function startApiServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, 'http://localhost:3000');
    const pathname = parsedUrl.pathname;

    // 1. Auth routes
    if (pathname === '/api/hotel-admins/login') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const creds = JSON.parse(body || '{}');
        const isSuper = (creds.username || '').toLowerCase().includes('super') || (creds.username || '') === 'admin';
        const role = isSuper ? 'superadmin' : 'clientadmin';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          token: 'mock_jwt_superadmin_token',
          user: {
            hotelAdminId: isSuper ? 'super_root' : 'owner_alpha',
            username: creds.username || 'superadmin',
            role: role
          }
        }));
      });
      return;
    }

    // 2. Hotel Properties
    if (pathname === '/api/hotel-properties/public' || pathname === '/api/hotel-properties') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: mockHotels }));
      return;
    }

    // 3. Tourist Destinations
    if (pathname === '/api/tourist-destinations/public') {
      const activeOnly = mockDestinations.filter(d => d.isActive);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: activeOnly }));
      return;
    }

    if (pathname === '/api/tourist-destinations/admin' || pathname === '/api/tourist-destinations') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: mockDestinations }));
      return;
    }

    // 4. Hotel Admins
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

    // 5. Display components
    if (pathname.includes('/api/display-components')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: [] }));
      return;
    }

    // Health
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // Default 200
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
      console.log('Static Expo web server listening on http://localhost:5050');
      resolve(server);
    });
  });
}

// CDP Client
class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }
  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      };
    });
  }
  async send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() {
    if (this.ws) this.ws.close();
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

  const profileDir = path.join(__dirname, 'edge_user_data_phase3');
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
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 920, deviceScaleFactor: 1, mobile: false });

    // -------------------------------------------------------------------------
    // CAPTURE 1: SUPER ADMIN GLOBAL DESTINATIONS MANAGEMENT
    // -------------------------------------------------------------------------
    console.log('Navigating to http://localhost:5050/#/superadmin...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/superadmin' });
    await new Promise(r => setTimeout(r, 3000));

    // Sign in as Super Admin
    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('@hotel_portal_admin_token', 'mock_jwt_superadmin_token');
        localStorage.setItem('@hotel_portal_admin_user', JSON.stringify({ hotelAdminId: 'super_root', username: 'superadmin', role: 'superadmin' }));
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3500));

    // Click on "Global Destinations" tab in Super Admin Sidebar
    await cdp.send('Runtime.evaluate', {
      expression: `
        const items = Array.from(document.querySelectorAll('*'));
        const tab = items.find(el => el.innerText && el.innerText.trim() === 'Global Destinations');
        if (tab) tab.click();
      `
    });
    await new Promise(r => setTimeout(r, 2500));

    const fileSuperAdminDest = path.join(ARTIFACTS_DIR, 'super_admin_phase3_destinations.png');
    await captureScreenshot(cdp, fileSuperAdminDest, 'Super Admin Global Destinations Console');

    // -------------------------------------------------------------------------
    // CAPTURE 2: ADD GLOBAL DESTINATION MODAL
    // -------------------------------------------------------------------------
    await cdp.send('Runtime.evaluate', {
      expression: `
        const items = Array.from(document.querySelectorAll('*'));
        const addBtn = items.find(el => el.innerText && el.innerText.trim() === 'Add Destination');
        if (addBtn) addBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 1800));

    const fileSuperAdminModal = path.join(ARTIFACTS_DIR, 'super_admin_phase3_add_modal.png');
    await captureScreenshot(cdp, fileSuperAdminModal, 'Super Admin Add Destination Modal');

    // -------------------------------------------------------------------------
    // CAPTURE 3: GUEST PORTAL INDIA TOURIST DIRECTORY MODAL
    // -------------------------------------------------------------------------
    console.log('Navigating to Guest Portal http://localhost:5050/#/...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5050/#/' });
    await new Promise(r => setTimeout(r, 3000));

    // Click "All India Directory ↗" pill in Top Attractions
    await cdp.send('Runtime.evaluate', {
      expression: `
        const items = Array.from(document.querySelectorAll('*'));
        const dirBtn = items.find(el => el.innerText && el.innerText.includes('All India Directory'));
        if (dirBtn) dirBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    const fileGuestDirectory = path.join(ARTIFACTS_DIR, 'guest_portal_phase3_india_directory.png');
    await captureScreenshot(cdp, fileGuestDirectory, 'Guest Portal India Tourist Directory Modal');

    console.log('\n--- ALL PHASE 3 SCREENSHOTS CAPTURED SUCCESSFULLY ---');
  } catch (err) {
    console.error('CDP capture error:', err);
  } finally {
    try { edgeProc.kill(); } catch (e) {}
    try { apiServer.close(); } catch (e) {}
    try { staticServer.close(); } catch (e) {}
    process.exit(0);
  }
}

main().catch(console.error);
