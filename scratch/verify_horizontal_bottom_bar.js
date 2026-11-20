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

async function run() {
  const profileDir = path.join(os.tmpdir(), 'edge_horiz_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9241',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9241/json/new?about:blank', { method: 'PUT' });
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
        expression: 'document.body.innerText.includes("GUEST AMENITIES") && document.querySelectorAll(\'[data-testid="category-explore-btn"]\').length >= 10',
        returnByValue: true,
      });
      if (check.result.value) break;
      await new Promise(r => setTimeout(r, 500));
    }

    // Measure horizontal cards row layout
    const initialMetrics = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const exploreBtns = Array.from(document.querySelectorAll('[data-testid="category-explore-btn"]'));
          const cards = exploreBtns.map(b => {
            let p = b.parentElement;
            while (p && !p.innerText.includes('Places') && !p.innerText.includes('Place')) {
              p = p.parentElement;
            }
            return p;
          });

          // Check if all cards share the SAME top position (single horizontal row!)
          const cardTops = cards.map(c => Math.round(c.getBoundingClientRect().top));
          const uniqueTops = [...new Set(cardTops)];

          const cardLefts = cards.map(c => Math.round(c.getBoundingClientRect().left));
          const cardDimensions = cards.slice(0, 3).map(c => ({
            width: Math.round(c.getBoundingClientRect().width),
            height: Math.round(c.getBoundingClientRect().height),
          }));

          const maxBottom = Math.max(...cards.map(c => Math.round(c.getBoundingClientRect().bottom)));

          // Check middle row clearance
          const mapIframe = document.querySelector('iframe');
          let middleRow = mapIframe;
          while (middleRow && middleRow.parentElement && !middleRow.parentElement.innerText.includes('GUEST AMENITIES')) {
            middleRow = middleRow.parentElement;
          }
          const mRect = middleRow ? middleRow.getBoundingClientRect() : null;

          return {
            totalCardsFound: cards.length,
            isSingleHorizontalRow: uniqueTops.length === 1,
            distinctRowsCount: uniqueTops.length,
            sharedTopPosition: uniqueTops[0],
            lowestCardBottom: maxBottom,
            windowHeight: window.innerHeight,
            fitsInOneScreen: maxBottom <= window.innerHeight,
            marginFromScreenBottom: window.innerHeight - maxBottom,
            middleRowBottom: mRect ? Math.round(mRect.bottom) : null,
            clearanceBetweenMiddleAndBottom: (uniqueTops[0] && mRect) ? Math.round(uniqueTops[0] - mRect.bottom) : null,
            cardLeftPositions: cardLefts.slice(0, 6),
            cardDimensionsSample: cardDimensions,
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Horizontal Row Metrics (1366x768):');
    console.log(JSON.stringify(initialMetrics.result.value, null, 2));

    // Capture initial screenshot
    const snap1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_horizontal_bottom_bar_1366x768.png'), Buffer.from(snap1.data, 'base64'));

    // Test clicking right scroll button
    const scrollRes = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const rightBtn = document.querySelector('[aria-label="Scroll categories right"]');
          if (rightBtn) {
            rightBtn.click();
            return { clicked: true };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Scroll Right Click Result:', scrollRes.result.value);
    await new Promise(r => setTimeout(r, 600));

    // Check card lefts after scroll
    const afterScroll = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const exploreBtns = Array.from(document.querySelectorAll('[data-testid="category-explore-btn"]'));
          const cards = exploreBtns.map(b => {
            let p = b.parentElement;
            while (p && !p.innerText.includes('Places') && !p.innerText.includes('Place')) {
              p = p.parentElement;
            }
            return p;
          });
          return cards.slice(0, 5).map(c => Math.round(c.getBoundingClientRect().left));
        })()
      `,
      returnByValue: true
    });
    console.log('Card Left positions after horizontal scroll:', afterScroll.result.value);

    // Also test 1920x1080
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 1000));
    const snap2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_horizontal_bottom_bar_1920x1080.png'), Buffer.from(snap2.data, 'base64'));
    console.log('Captured 1920x1080 screenshot');

  } finally {
    edgeProc.kill();
  }
}

run().catch(console.error);
