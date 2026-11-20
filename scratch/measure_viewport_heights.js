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

async function measure() {
  const profileDir = path.join(os.tmpdir(), 'edge_measure_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9234',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9234/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (const [w, h] of [[1366, 768], [1920, 1080]]) {
      console.log(`\n================ Viewport ${w}x${h} ================`);
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
      await new Promise(r => setTimeout(r, 2500));

      const data = await cdp.send('Runtime.evaluate', {
        expression: `
          (() => {
            const allEls = Array.from(document.querySelectorAll('*'));
            const header = allEls.find(e => e.innerText && e.innerText.includes('SELECT HOTEL') && e.getBoundingClientRect().height < 50);
            const tourist = allEls.find(e => e.innerText && e.innerText.includes('TOP TOURIST PLACES') && e.classList.toString().includes('r-'));
            let touristContainer = tourist;
            while (touristContainer && touristContainer.parentElement && !touristContainer.parentElement.innerText.includes('MANGO HOTELS')) {
              touristContainer = touristContainer.parentElement;
            }

            // Find middleRow
            const hotelTitle = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('MANGO HOTELS'));
            let centralContainer = hotelTitle;
            while (centralContainer && centralContainer.parentElement && !centralContainer.parentElement.innerText.includes('GUEST AMENITIES')) {
              centralContainer = centralContainer.parentElement;
            }

            // Find bottomSectionWrapper
            const amenitiesHeading = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('GUEST AMENITIES'));
            let amenitiesSection = amenitiesHeading;
            while (amenitiesSection && amenitiesSection.parentElement && !amenitiesSection.parentElement.innerText.includes('MANGO HOTELS')) {
              amenitiesSection = amenitiesSection.parentElement;
            }

            const scrollYMax = document.documentElement.scrollHeight - window.innerHeight;

            return {
              viewportHeight: window.innerHeight,
              documentScrollHeight: document.documentElement.scrollHeight,
              isScrollable: document.documentElement.scrollHeight > window.innerHeight,
              overflowPx: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
              headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
              touristHeight: touristContainer ? Math.round(touristContainer.getBoundingClientRect().height) : null,
              middleRowHeight: centralContainer ? Math.round(centralContainer.getBoundingClientRect().height) : null,
              amenitiesSectionHeight: amenitiesSection ? Math.round(amenitiesSection.getBoundingClientRect().height) : null,
              amenitiesBottom: amenitiesSection ? Math.round(amenitiesSection.getBoundingClientRect().bottom) : null,
            };
          })()
        `,
        returnByValue: true,
      });

      console.log(JSON.stringify(data.result.value, null, 2));
    }
  } finally {
    edgeProc.kill();
  }
}

measure().catch(console.error);
