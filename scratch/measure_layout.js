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
    '--remote-debugging-port=9227',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));

  try {
    const tabRes = await fetch('http://localhost:9227/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    await new Promise(r => setTimeout(r, 3500));

    const metrics = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));

          // 1. Central hotel container
          const hotelTitle = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('MANGO HOTELS'));
          const hotelHeaderRow = hotelTitle ? hotelTitle.closest('div[style*="flex-direction: row"]') || hotelTitle.parentElement.parentElement : null;
          const centralCard = hotelTitle ? hotelTitle.closest('div[style*="border-radius: 12"], div[style*="border-radius: 12px"]') || hotelTitle.parentElement.parentElement.parentElement : null;
          const centralCardRect = centralCard ? centralCard.getBoundingClientRect() : null;

          // 2. Middle Row
          const shoppingTitle = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'SHOPPING MALLS & SILK BAZAARS');
          const shoppingCard = shoppingTitle ? shoppingTitle.closest('div[style*="border-radius"]') || shoppingTitle.parentElement.parentElement : null;
          const middleRow = centralCard ? centralCard.parentElement.parentElement : null;
          const middleRowRect = middleRow ? middleRow.getBoundingClientRect() : null;

          // 3. Guest Amenities wrapper
          const amenitiesHeading = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('GUEST AMENITIES'));
          const amenitiesBadge = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.includes('10 CATEGORIES'));
          const amenitiesWrapper = amenitiesHeading ? amenitiesHeading.closest('div[style*="width: 100%"]') || amenitiesHeading.parentElement.parentElement.parentElement : null;
          const amenitiesRect = amenitiesWrapper ? amenitiesWrapper.getBoundingClientRect() : null;
          const headingRect = amenitiesHeading ? amenitiesHeading.getBoundingClientRect() : null;
          const badgeRect = amenitiesBadge ? amenitiesBadge.getBoundingClientRect() : null;

          // Check overlap
          const hotelBottom = centralCardRect ? centralCardRect.bottom : 0;
          const amenitiesTop = amenitiesRect ? amenitiesRect.top : 0;
          const overlapHotelAmenities = hotelBottom > amenitiesTop;

          // Header collisions
          const headerChildren = hotelHeaderRow ? Array.from(hotelHeaderRow.querySelectorAll('*')).filter(e => e.children.length === 0 && e.innerText.trim()) : [];
          const headerInfo = headerChildren.map(c => {
            const r = c.getBoundingClientRect();
            return { text: c.innerText.trim(), x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) };
          });

          // Category Cards
          const categoryCards = allEls.filter(e => e.children.length > 0 && e.getAttribute('style') && e.getAttribute('style').includes('border-left-width'));
          const cardsInfo = categoryCards.map(c => {
            const r = c.getBoundingClientRect();
            const textEls = Array.from(c.querySelectorAll('*')).filter(e => e.children.length === 0 && e.innerText.trim());
            return {
              x: Math.round(r.left),
              y: Math.round(r.top),
              width: Math.round(r.width),
              height: Math.round(r.height),
              texts: textEls.map(t => ({ text: t.innerText.trim(), h: Math.round(t.getBoundingClientRect().height) }))
            };
          });

          return {
            window: { width: window.innerWidth, height: window.innerHeight, scrollY: window.scrollY },
            middleRowRect: middleRowRect ? { top: Math.round(middleRowRect.top), bottom: Math.round(middleRowRect.bottom), height: Math.round(middleRowRect.height) } : null,
            centralCardRect: centralCardRect ? { top: Math.round(centralCardRect.top), bottom: Math.round(centralCardRect.bottom), height: Math.round(centralCardRect.height) } : null,
            amenitiesRect: amenitiesRect ? { top: Math.round(amenitiesRect.top), bottom: Math.round(amenitiesRect.bottom), height: Math.round(amenitiesRect.height) } : null,
            overlapHotelAmenities,
            hotelBottom,
            amenitiesTop,
            distance: amenitiesTop - hotelBottom,
            headingRect: headingRect ? { left: Math.round(headingRect.left), right: Math.round(headingRect.right), top: Math.round(headingRect.top), bottom: Math.round(headingRect.bottom) } : null,
            badgeRect: badgeRect ? { left: Math.round(badgeRect.left), right: Math.round(badgeRect.right), top: Math.round(badgeRect.top), bottom: Math.round(badgeRect.bottom) } : null,
            headingBadgeOverlap: (headingRect && badgeRect) ? (headingRect.right > badgeRect.left) : false,
            headerInfo,
            cardsCount: categoryCards.length,
            cardsInfo: cardsInfo.slice(0, 3)
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Layout Metrics:\n', JSON.stringify(metrics.result.value, null, 2));
  } finally {
    edgeProc.kill();
  }
}

measure().catch(console.error);
