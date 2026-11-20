const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

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

async function run() {
  const profileDir = path.join(os.tmpdir(), 'edge_debug2_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9239',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9239/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    
    // Wait for app ready
    for (let i = 0; i < 20; i++) {
      const check = await cdp.send('Runtime.evaluate', {
        expression: 'document.body.innerText.includes("GUEST AMENITIES") && document.body.innerText.includes("MANGO HOTELS")',
        returnByValue: true,
      });
      if (check.result.value) break;
      await new Promise(r => setTimeout(r, 500));
    }

    const res = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const mapIframe = document.querySelector('iframe');
          let middleRow = mapIframe;
          while (middleRow && middleRow.parentElement && !middleRow.parentElement.innerText.includes('GUEST AMENITIES')) {
            middleRow = middleRow.parentElement;
          }

          const touristHeading = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.includes('TOP TOURIST PLACES'));
          let touristSection = touristHeading;
          while (touristSection && touristSection.parentElement && !touristSection.parentElement.innerText.includes('MANGO HOTELS')) {
            touristSection = touristSection.parentElement;
          }

          const amenitiesHeading = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.includes('GUEST AMENITIES'));
          let amenitiesSection = amenitiesHeading;
          while (amenitiesSection && amenitiesSection.parentElement && !amenitiesSection.parentElement.innerText.includes('TOP TOURIST PLACES')) {
            amenitiesSection = amenitiesSection.parentElement;
          }

          const exploreBtns = Array.from(document.querySelectorAll('[data-testid="category-explore-btn"]'));
          const btnBottoms = exploreBtns.map(b => Math.round(b.getBoundingClientRect().bottom));
          const maxBtnBottom = Math.max(...btnBottoms);

          return {
            windowHeight: window.innerHeight,
            bodyScrollHeight: document.documentElement.scrollHeight,
            hasVerticalScroll: document.documentElement.scrollHeight > window.innerHeight,
            touristSection: touristSection ? {
              top: Math.round(touristSection.getBoundingClientRect().top),
              height: Math.round(touristSection.getBoundingClientRect().height),
              bottom: Math.round(touristSection.getBoundingClientRect().bottom),
            } : null,
            middleRow: middleRow ? {
              top: Math.round(middleRow.getBoundingClientRect().top),
              height: Math.round(middleRow.getBoundingClientRect().height),
              bottom: Math.round(middleRow.getBoundingClientRect().bottom),
            } : null,
            amenitiesSection: amenitiesSection ? {
              top: Math.round(amenitiesSection.getBoundingClientRect().top),
              height: Math.round(amenitiesSection.getBoundingClientRect().height),
              bottom: Math.round(amenitiesSection.getBoundingClientRect().bottom),
            } : null,
            lowestExploreBtnBottom: maxBtnBottom,
            pixelsFromScreenBottom: window.innerHeight - maxBtnBottom,
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Result:', JSON.stringify(res.result.value, null, 2));

  } finally {
    edgeProc.kill();
  }
}

run().catch(console.error);
