const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 9226;
const USER_DATA_DIR = path.join('C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c', 'edge_profile_audit');
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
  console.log('Starting Edge process for layout & button audit...');
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

    // Wait for initial render
    console.log('Waiting for guest portal to render...');
    for (let i = 0; i < 20; i++) {
      const text = await cdp.evaluate('document.body.innerText || ""');
      if (text.includes('MANGO HOTELS') || text.includes('TOP TOURIST PLACES')) {
        console.log(`Page rendered in ${i + 1} iterations!`);
        break;
      }
      await sleep(1000);
    }
    await sleep(2000);

    // =========================================================================
    // TEST 1: MULTI-RESOLUTION LAYOUT AUDIT
    // =========================================================================
    const resolutions = [
      { width: 1920, height: 1080, name: '1920x1080' },
      { width: 1440, height: 900, name: '1440x900' },
      { width: 1366, height: 768, name: '1366x768' },
      { width: 1280, height: 720, name: '1280x720' },
    ];

    const layoutResults = {};

    for (const res of resolutions) {
      console.log(`\nTesting resolution ${res.name}...`);
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: res.width,
        height: res.height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await sleep(1500);

      const audit = await cdp.evaluate(`
        (() => {
          const body = document.body;
          const all = Array.from(document.querySelectorAll('*'));

          // 1. Horizontal overflow check
          const scrollWidth = document.documentElement.scrollWidth;
          const clientWidth = document.documentElement.clientWidth;
          const hasHorizontalOverflow = scrollWidth > clientWidth + 2;

          // 2. Overlap checks
          // Central Hotel card vs Guest Amenities section
          const mangoHeader = all.find(el => el.textContent && el.textContent.includes('MANGO HOTELS · BENGALURU'));
          const centralCard = mangoHeader ? mangoHeader.closest('div') : null;
          
          const amenitiesTitle = all.find(el => el.textContent && el.textContent.includes('GUEST AMENITIES & NEARBY DIRECTORIES'));
          
          let centralRect = null;
          let amenitiesRect = null;
          let isSectionOverlapping = false;

          if (centralCard && amenitiesTitle) {
            // Traverse up to find main row and bottom section wrapper
            const centralContainer = centralCard.parentElement?.parentElement || centralCard;
            centralRect = centralContainer.getBoundingClientRect();
            amenitiesRect = amenitiesTitle.getBoundingClientRect();
            isSectionOverlapping = centralRect.bottom > amenitiesRect.top;
          }

          // 3. Header Collision check inside Central Hotel card
          // (Title vs Directions button vs Price/Rating)
          const directionsBtn = all.find(el => el.textContent && el.textContent.trim().startsWith('🧭 Directions') || el.textContent.trim().startsWith('Directions'));
          const pricePill = all.find(el => el.textContent && el.textContent.includes('From ₹'));
          let isHeaderColliding = false;
          if (directionsBtn && pricePill) {
            const dRect = directionsBtn.getBoundingClientRect();
            const pRect = pricePill.getBoundingClientRect();
            // Check horizontal collision on same vertical line
            if (Math.abs(dRect.top - pRect.top) < 15) {
              isHeaderColliding = (dRect.right > pRect.left && dRect.left < pRect.right);
            }
          }

          // 4. Explore Table buttons inside Category cards
          const categoryCards = all.filter(el => {
            const t = el.innerText || '';
            return (t.includes('Places') || t.includes('Place')) && t.includes('Explore Table') && el.getBoundingClientRect && el.getBoundingClientRect().height > 80 && el.getBoundingClientRect().height < 200;
          });

          let buttonsFit = true;
          let clippedButtons = 0;
          categoryCards.forEach(card => {
            const btn = card.querySelector('[data-testid="category-explore-btn"]') || Array.from(card.querySelectorAll('*')).find(c => c.textContent && c.textContent.includes('Explore Table'));
            if (btn) {
              const cRect = card.getBoundingClientRect();
              const bRect = btn.getBoundingClientRect();
              if (bRect.bottom > cRect.bottom + 1 || bRect.top < cRect.top) {
                buttonsFit = false;
                clippedButtons++;
              }
            }
          });

          // 5. Tourist cards count and bounding dimensions
          const touristCards = all.filter(el => {
            const t = el.innerText || '';
            return (t.includes('Palace') || t.includes('Lalbagh') || t.includes('Cubbon') || t.includes('Sultan') || t.includes('ISKCON')) && el.getBoundingClientRect && el.getBoundingClientRect().height > 80 && el.getBoundingClientRect().height < 200 && el.getBoundingClientRect().width > 150;
          });

          return {
            hasHorizontalOverflow,
            scrollWidth,
            clientWidth,
            isSectionOverlapping,
            centralBottom: centralRect ? Math.round(centralRect.bottom) : null,
            amenitiesTop: amenitiesRect ? Math.round(amenitiesRect.top) : null,
            isHeaderColliding,
            categoryCardsCount: categoryCards.length,
            buttonsFit,
            clippedButtons,
            touristCardsCount: touristCards.length,
          };
        })()
      `);

      layoutResults[res.name] = audit;
      console.log(`Result for ${res.name}:`, JSON.stringify(audit, null, 2));

      // Save screenshot
      const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const shotPath = path.join('C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c', `audit_layout_${res.name}.png`);
      fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));
      console.log(`Saved screenshot to: ${shotPath}`);
    }

    // =========================================================================
    // TEST 2: CATEGORY BUTTON-ONLY NAVIGATION & CARD ISOLATION TEST
    // =========================================================================
    console.log('\nTesting Category Button-Only Interaction & Isolation...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(1000);

    const buttonTestResult = await cdp.evaluate(`
      (async () => {
        const all = Array.from(document.querySelectorAll('*'));
        
        // Find first category card (Cafes & Bistros)
        const cafeTitle = all.find(el => el.textContent && el.textContent.trim() === 'Cafes & Bistros');
        if (!cafeTitle) return { success: false, error: 'Cafes & Bistros not found' };

        const card = cafeTitle.closest('div[style*="border"], div[class]') || cafeTitle.parentElement.parentElement;
        const icon = card.querySelector('div[style*="background"] text, span, div') || card.firstElementChild;
        const desc = all.find(el => el.textContent && el.textContent.includes('Specialty roasts, patisseries & breakfast'));
        const exploreBtn = card.querySelector('[data-testid="category-explore-btn"]') || Array.from(card.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('Explore Table'));

        const initialHash = window.location.hash;

        // 1. Click card background
        card.click();
        const hashAfterCardClick = window.location.hash;
        const cardBgSafe = (hashAfterCardClick === initialHash);

        // 2. Click icon
        if (icon) icon.click();
        const hashAfterIconClick = window.location.hash;
        const iconSafe = (hashAfterIconClick === initialHash);

        // 3. Click title
        cafeTitle.click();
        const hashAfterTitleClick = window.location.hash;
        const titleSafe = (hashAfterTitleClick === initialHash);

        // 4. Click description
        if (desc) desc.click();
        const hashAfterDescClick = window.location.hash;
        const descSafe = (hashAfterDescClick === initialHash);

        // 5. Test Explore Table button navigation
        let buttonNavWorked = false;
        if (exploreBtn) {
          exploreBtn.click();
          await new Promise(r => setTimeout(r, 600));
          buttonNavWorked = window.location.hash.includes('cafe');
        }

        // Return back to guest portal
        window.location.hash = '#/guest';
        await new Promise(r => setTimeout(r, 600));

        return {
          cardBgSafe,
          iconSafe,
          titleSafe,
          descSafe,
          buttonNavWorked,
          hashAfterCardClick,
          hashAfterBtnClick: window.location.hash
        };
      })()
    `);

    console.log('Button Isolation Test Result:', JSON.stringify(buttonTestResult, null, 2));

    // Save final audit log
    const auditSummary = {
      timestamp: new Date().toISOString(),
      layoutResults,
      buttonTestResult,
    };
    fs.writeFileSync(
      path.join(__dirname, 'audit_summary.json'),
      JSON.stringify(auditSummary, null, 2)
    );

  } catch (err) {
    console.error('Audit script error:', err);
  } finally {
    edge.kill();
  }
}

main();
