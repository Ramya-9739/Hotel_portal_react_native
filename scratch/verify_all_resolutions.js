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

async function verifySingleScreen() {
  const profileDir = path.join(os.tmpdir(), 'edge_single_screen_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9240',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9240/json/new?about:blank', { method: 'PUT' });
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

    const results = [];

    // Navigate once and wait for bundle
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    for (let i = 0; i < 20; i++) {
      const check = await cdp.send('Runtime.evaluate', {
        expression: 'document.body.innerText.includes("GUEST AMENITIES") && document.body.innerText.includes("MANGO HOTELS")',
        returnByValue: true,
      });
      if (check.result.value) break;
      await new Promise(r => setTimeout(r, 500));
    }

    for (const vp of viewports) {
      console.log(`Testing viewport ${vp.name}...`);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: !!vp.mobile,
      });
      await new Promise(r => setTimeout(r, 1200));

      const evaluation = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const allEls = Array.from(document.querySelectorAll('*'));
            const mapIframe = document.querySelector('iframe');
            let middleRow = mapIframe;
            while (middleRow && middleRow.parentElement && !middleRow.parentElement.innerText.includes('GUEST AMENITIES')) {
              middleRow = middleRow.parentElement;
            }

            const amenitiesHeading = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('GUEST AMENITIES'));
            let amenitiesSection = amenitiesHeading;
            while (amenitiesSection && amenitiesSection.parentElement && !amenitiesSection.parentElement.innerText.includes('TOP TOURIST PLACES')) {
              amenitiesSection = amenitiesSection.parentElement;
            }

            const exploreBtns = Array.from(document.querySelectorAll('[data-testid="category-explore-btn"]'));
            const btnBottoms = exploreBtns.map(b => Math.round(b.getBoundingClientRect().bottom));
            const maxBtnBottom = btnBottoms.length > 0 ? Math.max(...btnBottoms) : null;

            const mRect = middleRow ? middleRow.getBoundingClientRect() : null;
            const aRect = amenitiesSection ? amenitiesSection.getBoundingClientRect() : null;
            const clearance = (mRect && aRect) ? Math.round(aRect.top - mRect.bottom) : null;

            const hasScrollbar = document.documentElement.scrollHeight > window.innerHeight;
            const fitsWithoutScroll = maxBtnBottom !== null ? (maxBtnBottom <= window.innerHeight) : false;

            return {
              viewport: "${vp.name}",
              windowHeight: window.innerHeight,
              lowestElementBottom: maxBtnBottom,
              fitsWithoutScroll,
              hasScrollbar,
              clearanceBetweenMiddleAndBottomPx: clearance,
              categoryExploreBtnCount: exploreBtns.length,
            };
          })()
        `,
        returnByValue: true
      });

      const metrics = evaluation.result.value;
      console.log('Metrics:', JSON.stringify(metrics, null, 2));
      results.push(metrics);

      // Screenshot
      const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const snapPath = path.join(ARTIFACTS_DIR, `single_screen_${vp.name}.png`);
      fs.writeFileSync(snapPath, Buffer.from(snap.data, 'base64'));
      console.log(`Saved screenshot: single_screen_${vp.name}.png`);
    }

    console.log('\n========================================');
    console.log('SINGLE SCREEN FIT SUMMARY:');
    console.log('========================================');
    console.table(results);

  } finally {
    edgeProc.kill();
  }
}

verifySingleScreen().catch(console.error);
