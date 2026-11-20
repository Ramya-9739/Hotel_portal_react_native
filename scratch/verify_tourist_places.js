const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 9225;
const USER_DATA_DIR = path.join('C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c', 'edge_profile_tourist');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.pending = new Map();
  }

  async connect() {
    const WebSocket = require('ws');
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.on('open', resolve);
      this.ws.on('error', reject);
    });
    this.ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }
}

async function main() {
  console.log('Launching headless Edge...');
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--window-size=1920,1080',
    'http://localhost:8081/#/guest',
  ]);

  await sleep(4000);

  try {
    const list = await getJson(`http://127.0.0.1:${PORT}/json/list`);
    const page = list.find((p) => p.type === 'page' && p.url.includes('8081')) || list[0];
    if (!page) throw new Error('No page found');

    const cdp = new CdpSession(page.webSocketDebuggerUrl);
    await cdp.connect();
    console.log('Connected to CDP.');

    await cdp.send('Page.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('Waiting for Expo web to bundle and render...');
    for (let i = 0; i < 25; i++) {
      const text = await cdp.evaluate('document.body.innerText || ""');
      if (text.includes('MANGO HOTELS') || text.includes('TOURIST PLACES')) {
        console.log(`Page rendered in ${i + 1} iterations!`);
        break;
      }
      await sleep(1000);
    }

    // Additional pause for data hydration
    await sleep(2000);

    // Evaluate tourist places and layout
    const checkResult = await cdp.evaluate(`
      (() => {
        // 1. Check Tourist cards
        const allElements = Array.from(document.querySelectorAll('*'));
        
        // Find tourist section
        const touristHeader = allElements.find(el => el.textContent && el.textContent.includes('TOP TOURIST PLACES & ATTRACTIONS'));
        
        // Check text content inside body
        const bodyText = document.body.innerText;
        const hasNoItemsAvailable = bodyText.includes('No items currently available');
        const hasNoShopping = bodyText.includes('No shopping destinations found near this hotel');
        const hasNoTransit = bodyText.includes('No transportation hubs found near this hotel');
        
        // Look for cards with Bengaluru Palace or other landmarks
        const bengaluruPalaceCard = allElements.find(el => el.innerText && el.innerText.includes('Bengaluru Palace') && el.innerText.includes('km'));
        const lalbaghCard = allElements.find(el => el.innerText && el.innerText.includes('Lalbagh') && el.innerText.includes('km'));
        
        // Collect all tourist card items
        const touristCards = allElements.filter(el => {
          const t = el.innerText || '';
          return (t.includes('Bengaluru Palace') || t.includes('Lalbagh') || t.includes('Cubbon Park') || t.includes('Tipu Sultan') || t.includes('ISKCON')) && el.getBoundingClientRect && el.getBoundingClientRect().height > 80 && el.getBoundingClientRect().height < 200 && el.getBoundingClientRect().width > 150 && el.getBoundingClientRect().width < 400;
        });

        // Get card sizes
        const cardDimensions = touristCards.map(c => {
          const r = c.getBoundingClientRect();
          return {
            text: c.innerText.split('\\n')[0],
            width: Math.round(r.width),
            height: Math.round(r.height),
            top: Math.round(r.top),
            bottom: Math.round(r.bottom)
          };
        });

        // Check Shopping items
        const shoppingUB = bodyText.includes('UB City Luxury Collection');
        const shoppingComm = bodyText.includes('Commercial Street');

        // Check Transportation items
        const transitAirport = bodyText.includes('Kempegowda International Airport');
        const transitRailway = bodyText.includes('KSR Bengaluru City');

        // Check category Explore Table buttons
        const exploreButtons = allElements.filter(el => el.textContent && el.textContent.trim() === 'Explore Table ↗');

        return {
          hasNoItemsAvailable,
          hasNoShopping,
          hasNoTransit,
          touristCardsCount: touristCards.length,
          cardDimensions,
          shoppingUB,
          shoppingComm,
          transitAirport,
          transitRailway,
          exploreButtonsCount: exploreButtons.length,
          bodySnippet: bodyText.substring(0, 500)
        };
      })()
    `);

    console.log('Layout Verification Result:', JSON.stringify(checkResult, null, 2));

    // Capture screenshot at 1920x1080
    const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPath1 = path.join('C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c', 'verified_tourist_places_1920x1080.png');
    fs.writeFileSync(shotPath1, Buffer.from(shot1.data, 'base64'));
    console.log('Saved 1920x1080 screenshot to:', shotPath1);

    // Capture screenshot at 1366x768
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(1500);
    const shot2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const shotPath2 = path.join('C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c', 'verified_tourist_places_1366x768.png');
    fs.writeFileSync(shotPath2, Buffer.from(shot2.data, 'base64'));
    console.log('Saved 1366x768 screenshot to:', shotPath2);

  } catch (err) {
    console.error('Error during CDP test:', err);
  } finally {
    edge.kill();
  }
}

main();
