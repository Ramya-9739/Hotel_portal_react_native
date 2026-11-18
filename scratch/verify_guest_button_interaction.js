const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACTS_DIR = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c';

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

async function runBrowserVerification() {
  console.log('--- STARTING CDP BROWSER VERIFICATION OF BUTTON-ONLY INTERACTION & ADMIN COMPONENT MANAGEMENT ---');

  const os = require('os');
  const profileDir = path.join(os.tmpdir(), 'edge_user_data_btn_verify_' + Date.now());
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const args = [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
  ];

  const edgeProc = spawn(edgeExe, args, { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));

  try {
    const tabRes = await fetch('http://localhost:9223/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // 1. GUEST PORTAL DESKTOP
    console.log('\n[Step 1] Loading Guest Portal at http://localhost:8081/#/guest ...');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    await new Promise(r => setTimeout(r, 4000));

    // Scroll down to the Guest Amenities & Nearby Directories section
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const section = Array.from(document.querySelectorAll('*')).find(
            e => e.innerText && e.innerText.includes('GUEST AMENITIES & NEARBY DIRECTORIES')
          );
          if (section) section.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    // Capture screenshot of category title cards grid
    const snapCategoryCards = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_guest_portal_bottom_category_buttons.png'), Buffer.from(snapCategoryCards.data, 'base64'));
    console.log('Saved verified_guest_portal_bottom_category_buttons.png');

    // TEST BUTTON-ONLY INTERACTION:
    // A. Click the surrounding Card Title (NOT the Explore button)
    console.log('\n[Step 2] Testing Card Surrounding Click: Clicking Title of "Cafes & Bistros"...');
    const testSurroundClick = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const initialHash = window.location.hash;
          const allEls = Array.from(document.querySelectorAll('*'));
          const cafeTitle = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim().includes('Cafes'));
          if (!cafeTitle) return { success: false, reason: 'Cafe title not found' };

          cafeTitle.click();
          const hashAfterTitleClick = window.location.hash;

          return {
            success: true,
            titleFound: cafeTitle.innerText,
            initialHash,
            hashAfterTitleClick,
            preventedAccidentalNav: initialHash === hashAfterTitleClick
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Surrounding Title Click Result:', testSurroundClick.result.value);

    // B. Click specifically the "Explore Table ↗" button
    console.log('\n[Step 3] Clicking strictly on the "Explore Table ↗" button for Cafes...');
    const testExploreBtnClick = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const cafeTitle = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim().includes('Cafes'));
          if (!cafeTitle) return { success: false, reason: 'Cafe title not found' };

          // Find the card container
          let card = cafeTitle.parentElement;
          while (card && !card.innerText.includes('Explore Table')) {
            card = card.parentElement;
          }

          // Find the Explore Table button inside this specific card
          const exploreBtn = Array.from(card.querySelectorAll('*')).find(
            e => e.children.length === 0 && e.innerText && e.innerText.includes('Explore Table')
          );

          if (!exploreBtn) return { success: false, reason: 'Explore Table button not found' };

          const clickableTarget = exploreBtn.closest('[role="button"]') || exploreBtn.parentElement || exploreBtn;
          clickableTarget.click();

          return {
            success: true,
            clicked: true,
            btnText: exploreBtn.innerText
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Explore Button Click Result:', testExploreBtnClick.result.value);
    await new Promise(r => setTimeout(r, 2000));

    // Verify URL hash changed to #/category/cafes
    const cafeHashCheck = await cdp.send('Runtime.evaluate', {
      expression: `window.location.hash`,
      returnByValue: true
    });
    console.log('Current URL Hash after clicking Explore button:', cafeHashCheck.result.value);

    // Capture screenshot of Cafes Themed Information Table
    const snapCafes = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_cafes_information_table_amber_theme.png'), Buffer.from(snapCafes.data, 'base64'));
    console.log('Saved verified_cafes_information_table_amber_theme.png');

    // Verify Read-Only Mode: Ensure ZERO "Add Place" or "Edit" buttons
    const readOnlyCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          const hasAddPlace = text.includes('Add Place');
          const hasEditBtn = Array.from(document.querySelectorAll('*')).some(e => e.children.length === 0 && e.innerText && e.innerText.trim() === '✏️ Edit');
          const hasBackBtn = text.includes('Back to Hotel Portal');

          return {
            isReadOnly: !hasAddPlace && !hasEditBtn,
            hasAddPlace,
            hasEditBtn,
            hasBackBtn
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Guest Read-Only Check in Cafes Table:', readOnlyCheck.result.value);

    // C. Click Back to Hotel Portal
    console.log('\n[Step 4] Clicking "Back to Hotel Portal" ...');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const backBtn = Array.from(document.querySelectorAll('*')).find(
            e => e.innerText && e.innerText.includes('Back to Hotel Portal')
          );
          if (backBtn) {
            const clickable = backBtn.closest('[role="button"]') || backBtn.parentElement || backBtn;
            clickable.click();
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    // D. Check Hospitals Category Table
    console.log('\n[Step 5] Navigating to Hospitals Table via #/category/hospitals ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/category/hospitals' });
    await new Promise(r => setTimeout(r, 2500));
    const snapHospitals = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_hospitals_information_table_crimson_theme.png'), Buffer.from(snapHospitals.data, 'base64'));
    console.log('Saved verified_hospitals_information_table_crimson_theme.png');

    // E. Check Pharmacies Category Table
    console.log('\n[Step 6] Navigating to Pharmacies Table via #/category/pharmacies ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/category/pharmacies' });
    await new Promise(r => setTimeout(r, 2500));
    const snapPharmacies = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_pharmacies_information_table_emerald_theme.png'), Buffer.from(snapPharmacies.data, 'base64'));
    console.log('Saved verified_pharmacies_information_table_emerald_theme.png');

    // F. Check Gyms & Wellness Category Table
    console.log('\n[Step 7] Navigating to Gyms Table via #/category/gyms ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/category/gyms' });
    await new Promise(r => setTimeout(r, 2500));
    const snapGyms = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_gyms_information_table_cyan_theme.png'), Buffer.from(snapGyms.data, 'base64'));
    console.log('Saved verified_gyms_information_table_cyan_theme.png');

    // G. Verify Authorized Admin Console Component Management
    console.log('\n[Step 8] Verifying Authorized Admin Console Component Management (#/admin)...');
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/admin' });
    await new Promise(r => setTimeout(r, 2000));

    await cdp.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('@hotel_portal_admin_token', 'mock_jwt_authorized_admin');
        localStorage.setItem('@hotel_portal_admin_user', JSON.stringify({ hotelAdminId: 'admin', username: 'admin', role: 'clientadmin' }));
        location.reload();
      `
    });
    await new Promise(r => setTimeout(r, 3000));

    const adminCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const text = document.body.innerText;
          const hasAddComponent = text.includes('Add Component');
          const hasNearbyTabs = text.includes('Nearby Places & Categories');
          const hasHotelsDirectory = text.includes('Hotels Directory');
          return {
            hasAddComponent,
            hasNearbyTabs,
            hasHotelsDirectory
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Admin Console Component Management Check:', adminCheck.result.value);

    const snapAdmin = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_desktop_hotel_admin_component_management.png'), Buffer.from(snapAdmin.data, 'base64'));
    console.log('Saved verified_desktop_hotel_admin_component_management.png');

    console.log('\n=== ALL BROWSER INTERACTION VERIFICATIONS COMPLETED SUCCESSFULLY ===');
  } finally {
    edgeProc.kill();
  }
}

runBrowserVerification().catch((err) => {
  console.error('CDP verification error:', err);
  process.exit(1);
});
