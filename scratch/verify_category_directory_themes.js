// scratch/verify_category_directory_themes.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c';
const DIST_DIR = path.join(__dirname, '..', 'dist');

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

  return new Promise((resolve) => server.listen(5052, () => {
    console.log('Static server running on port 5052');
    resolve(server);
  }));
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
  console.log('=== STARTING VISUAL & FUNCTIONAL VERIFICATION OF CATEGORY TABLES & THEMES ===');
  const staticServer = await startStaticServer();

  const profileDir = path.join(__dirname, 'edge_user_data_themes');
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

    // -------------------------------------------------------------------------
    // TEST 1: GUEST PORTAL HOME (Bottom Category Title Buttons Grid)
    // -------------------------------------------------------------------------
    console.log('\n[1/5] Verifying Guest Portal Home Bottom Category Title Buttons...');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:5052/#/guest' });
    await new Promise(r => setTimeout(r, 3000));

    const homeButtonsCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const sectionHeader = allEls.find(e => e.innerText && e.innerText.includes('GUEST AMENITIES & NEARBY DIRECTORIES'));
          
          const expectedButtons = [
            'Cafes & Bistros',
            'Emergency Hospitals',
            '24/7 Pharmacies',
            'Wellness & Gyms',
            'Fine Dining & Cuisine',
            'Swimming Pools',
            'Parlour & Spa',
            'Express Takeaway',
            'Suite Delivery',
            '24/7 ATMs & Cash'
          ];

          const foundButtons = expectedButtons.map(name => {
            const el = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === name);
            return { name, found: !!el };
          });

          const tableRedirectTriggers = allEls.filter(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'Explore Table ↗');

          return {
            hasSectionHeader: !!sectionHeader,
            totalButtonsFound: foundButtons.filter(b => b.found).length,
            expectedCount: expectedButtons.length,
            foundButtons,
            tableRedirectTriggersCount: tableRedirectTriggers.length
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Home Category Buttons Check:', JSON.stringify(homeButtonsCheck.result.value, null, 2));
    results.homeButtons = homeButtonsCheck.result.value;

    const snapHome = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_guest_portal_bottom_category_buttons.png'), Buffer.from(snapHome.data, 'base64'));
    console.log('Saved verified_guest_portal_bottom_category_buttons.png');

    // -------------------------------------------------------------------------
    // TEST 2: CAFES INFORMATION TABLE (Warm Roasted Amber Theme)
    // -------------------------------------------------------------------------
    console.log('\n[2/5] Verifying Cafes Information Table (Warm Caramel Amber Theme)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5052/#/category/cafes' });
    await new Promise(r => setTimeout(r, 2000));

    const cafesTableCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          const hasTitle = text.includes('Artisanal Cafes, Roasteries & Bakeries');
          const hasTag = text.includes('SPECIALTY ROASTS, PATISSERIES & BISTROS');
          const hasTimingCol = text.includes('TIMINGS / HOURS') || text.includes('HOURS') || text.includes('TIMINGS');
          const hasEmergencyCol = text.includes('EMERGENCY / TABLE AVAILABILITY') || text.includes('Table');
          const hasDirections = text.includes('Directions');
          const hasWebsite = text.includes('Website');
          const hasBackBtn = text.includes('Back to Hotel Portal');

          return {
            hasTitle,
            hasTag,
            hasTimingCol,
            hasEmergencyCol,
            hasDirections,
            hasWebsite,
            hasBackBtn
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Cafes Table Verification:', JSON.stringify(cafesTableCheck.result.value, null, 2));
    results.cafesTable = cafesTableCheck.result.value;

    const snapCafes = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_cafes_information_table_amber_theme.png'), Buffer.from(snapCafes.data, 'base64'));
    console.log('Saved verified_cafes_information_table_amber_theme.png');

    // -------------------------------------------------------------------------
    // TEST 3: EMERGENCY HOSPITALS INFORMATION TABLE (Crimson Theme)
    // -------------------------------------------------------------------------
    console.log('\n[3/5] Verifying Emergency Hospitals Information Table (Crimson Theme)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5052/#/category/hospitals' });
    await new Promise(r => setTimeout(r, 2000));

    const hospitalsTableCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          const hasTitle = text.includes('Emergency Hospitals & Medical Care');
          const hasNotice = text.includes('CRITICAL EMERGENCY DIRECTORY') || text.includes('dial 112');
          const has24x7Emergency = text.includes('24/7 EMERGENCY') || text.includes('Trauma Desk');
          const hasEmergencyAction = text.includes('Call 24/7 Emergency Desk');
          const hasTimingCol = text.includes('TIMINGS / HOURS') || text.includes('TIMINGS');
          const hasEmergencyCol = text.includes('EMERGENCY AVAILABILITY');
          const hasDirections = text.includes('Directions');

          return {
            hasTitle,
            hasNotice,
            has24x7Emergency,
            hasEmergencyAction,
            hasTimingCol,
            hasEmergencyCol,
            hasDirections
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Hospitals Table Verification:', JSON.stringify(hospitalsTableCheck.result.value, null, 2));
    results.hospitalsTable = hospitalsTableCheck.result.value;

    const snapHospitals = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_hospitals_information_table_crimson_theme.png'), Buffer.from(snapHospitals.data, 'base64'));
    console.log('Saved verified_hospitals_information_table_crimson_theme.png');

    // -------------------------------------------------------------------------
    // TEST 4: 24/7 PHARMACIES INFORMATION TABLE (Emerald Green Theme)
    // -------------------------------------------------------------------------
    console.log('\n[4/5] Verifying 24/7 Pharmacies Information Table (Emerald Green Theme)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5052/#/category/pharmacies' });
    await new Promise(r => setTimeout(r, 2000));

    const pharmaciesTableCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          const hasTitle = text.includes('24-Hour Pharmacies & Healthcare Stores');
          const hasTag = text.includes('24/7 PHARMACY & ESSENTIAL MEDICAL DISPENSARY');
          const hasDeliveryCol = text.includes('EMERGENCY / DELIVERY AVAILABILITY') || text.includes('Delivery');
          const hasDirections = text.includes('Directions');

          return {
            hasTitle,
            hasTag,
            hasDeliveryCol,
            hasDirections
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Pharmacies Table Verification:', JSON.stringify(pharmaciesTableCheck.result.value, null, 2));
    results.pharmaciesTable = pharmaciesTableCheck.result.value;

    const snapPharmacies = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_pharmacies_information_table_emerald_theme.png'), Buffer.from(snapPharmacies.data, 'base64'));
    console.log('Saved verified_pharmacies_information_table_emerald_theme.png');

    // -------------------------------------------------------------------------
    // TEST 5: WELLNESS & GYMS INFORMATION TABLE (Electric Cyan Theme) & BACK NAVIGATION
    // -------------------------------------------------------------------------
    console.log('\n[5/5] Verifying Wellness & Gyms Table (Cyan Theme) and Navigation Back to Portal...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5052/#/category/gyms' });
    await new Promise(r => setTimeout(r, 2000));

    const gymsTableCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          const hasTitle = text.includes('Elite Fitness Clubs, CrossFit & Yoga');
          const hasTag = text.includes('STRENGTH, YOGA & ATHLETIC WELLNESS CLUBS');
          const hasFirstAid = text.includes('FIRST AID') || text.includes('Trainer');
          const hasDirections = text.includes('Directions');

          return {
            hasTitle,
            hasTag,
            hasFirstAid,
            hasDirections
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Gyms Table Verification:', JSON.stringify(gymsTableCheck.result.value, null, 2));
    results.gymsTable = gymsTableCheck.result.value;

    const snapGyms = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_gyms_information_table_cyan_theme.png'), Buffer.from(snapGyms.data, 'base64'));
    console.log('Saved verified_gyms_information_table_cyan_theme.png');

    // Test Back Button click
    console.log('\nTesting click on "← Back to Hotel Portal"...');
    const backClick = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const backBtn = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'Back to Hotel Portal');
          if (backBtn) {
            const clickTarget = backBtn.closest('[role="button"]') || backBtn.parentElement || backBtn;
            clickTarget.click();
            return { clicked: true };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 1500));

    const hashAfterBack = await cdp.send('Runtime.evaluate', {
      expression: `window.location.hash`,
      returnByValue: true
    });
    console.log('Back Button Clicked:', backClick.result.value, '| Current Hash:', hashAfterBack.result.value);
    results.backNavigation = {
      clicked: backClick.result.value.clicked,
      hash: hashAfterBack.result.value
    };

    cdp.ws.close();
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    staticServer.close();
    edgeProc.kill();
  }

  console.log('\n=== FINAL VERIFICATION SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
}

main();
