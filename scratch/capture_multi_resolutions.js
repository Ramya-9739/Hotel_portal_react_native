const path = require('path');
const os = require('os');
const fs = require('fs');
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

async function captureMultiResolutions() {
  const profileDir = path.join(os.tmpdir(), 'edge_multi_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9228',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));

  try {
    const tabRes = await fetch('http://localhost:9228/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    const viewports = [
      { name: '1920x1080', width: 1920, height: 1080 },
      { name: '1440x900', width: 1440, height: 900 },
      { name: '1366x768', width: 1366, height: 768 },
      { name: '1280x720', width: 1280, height: 720 },
      { name: '390x844_mobile', width: 390, height: 844, mobile: true },
    ];

    for (const vp of viewports) {
      console.log(`Testing viewport ${vp.name}...`);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: !!vp.mobile,
      });

      await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
      await new Promise(r => setTimeout(r, 3000));

      const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const snapPath = path.join(ARTIFACTS_DIR, `guest_portal_${vp.name}_inspection.png`);
      fs.writeFileSync(snapPath, Buffer.from(snap.data, 'base64'));
      console.log(`Saved ${snapPath}`);
    }

    // Now inspect DOM details specifically at 1366x768 and 1280x720
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 1000));

    const domDetails = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));

          // Find Central Display
          const hotelTitle = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('MANGO HOTELS'));
          let centralContainer = hotelTitle;
          while (centralContainer && centralContainer.parentElement && !centralContainer.getAttribute('style')?.includes('border-radius: 12')) {
            centralContainer = centralContainer.parentElement;
          }
          if (centralContainer) centralContainer = centralContainer.parentElement; // container with border-radius: 12

          // Find Map
          const mapIframe = document.querySelector('iframe');
          const mapContainer = mapIframe ? mapIframe.closest('div') : null;

          // Find Amenities
          const amenitiesHeading = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('GUEST AMENITIES'));
          const amenitiesBadge = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('10 CATEGORIES'));
          const amenitiesWrapper = amenitiesHeading ? amenitiesHeading.closest('div[style*="width: 100%"]') || amenitiesHeading.parentElement.parentElement.parentElement : null;

          return {
            centralContainer: centralContainer ? {
              rect: centralContainer.getBoundingClientRect(),
              style: centralContainer.getAttribute('style'),
              scrollHeight: centralContainer.scrollHeight,
              offsetHeight: centralContainer.offsetHeight,
              clientHeight: centralContainer.clientHeight,
            } : null,
            mapContainer: mapContainer ? {
              rect: mapContainer.getBoundingClientRect(),
              scrollHeight: mapContainer.scrollHeight,
            } : null,
            amenitiesWrapper: amenitiesWrapper ? {
              rect: amenitiesWrapper.getBoundingClientRect(),
            } : null,
            amenitiesHeadingRect: amenitiesHeading ? amenitiesHeading.getBoundingClientRect() : null,
            amenitiesBadgeRect: amenitiesBadge ? amenitiesBadge.getBoundingClientRect() : null,
            hotelTitleRect: hotelTitle ? hotelTitle.getBoundingClientRect() : null,
          };
        })()
      `,
      returnByValue: true
    });

    console.log('DOM Details at 1366x768:\n', JSON.stringify(domDetails.result.value, null, 2));

  } finally {
    edgeProc.kill();
  }
}

captureMultiResolutions().catch(console.error);
