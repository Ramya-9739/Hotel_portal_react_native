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

async function verifyDesign() {
  console.log('=== VERIFYING REFINED EXPLORE TABLE BUTTON DESIGN ===');
  const profileDir = path.join(os.tmpdir(), 'edge_btn_design_' + Date.now());
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9226',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 2500));

  try {
    const tabRes = await fetch('http://localhost:9226/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 950, deviceScaleFactor: 1, mobile: false });

    // Step 1: Navigate to Guest Portal
    console.log('[Step 1] Loading Guest Portal at http://localhost:8081/#/guest ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:8081/#/guest' });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll to the categories section
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const sec = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('GUEST AMENITIES & NEARBY DIRECTORIES'));
          if (sec) sec.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    // Step 2: Inspect computed styles of all 10 Explore Table buttons
    console.log('[Step 2] Auditing button computed styles across all 10 category cards...');
    const styleAudit = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allButtons = Array.from(document.querySelectorAll('[role="button"]')).filter(
            b => b.innerText && b.innerText.includes('Explore Table')
          );

          return allButtons.map(btn => {
            const cs = window.getComputedStyle(btn);
            const textEl = Array.from(btn.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.includes('Explore Table')) || btn;
            const textCs = window.getComputedStyle(textEl);
            const parentCard = btn.closest('div[style*="border-left"]') || btn.parentElement.parentElement;
            const titleEl = parentCard ? Array.from(parentCard.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.length > 2) : null;

            return {
              categoryTitle: titleEl ? titleEl.innerText : 'Unknown',
              ariaLabel: btn.getAttribute('aria-label'),
              backgroundColor: cs.backgroundColor,
              borderColor: cs.borderColor,
              borderWidth: cs.borderWidth,
              borderRadius: cs.borderRadius,
              color: textCs.color,
              fontWeight: textCs.fontWeight,
              fontSize: textCs.fontSize,
              cursor: cs.cursor,
            };
          });
        })()
      `,
      returnByValue: true
    });

    console.log('Explore Buttons Found:', styleAudit.result.value.length);
    styleAudit.result.value.forEach((b, i) => {
      console.log(` Button ${i + 1} [${b.ariaLabel || b.categoryTitle}]: bg=${b.backgroundColor}, border=${b.borderColor}, radius=${b.borderRadius}, color=${b.color}, weight=${b.fontWeight}`);
    });

    // Capture screenshot of the Guest Amenities section with refined buttons
    const snapSection = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_refined_champagne_gold_explore_buttons.png'), Buffer.from(snapSection.data, 'base64'));
    console.log('✓ Captured verified_refined_champagne_gold_explore_buttons.png');

    // Step 3: Test Hover State using CDP Input.dispatchMouseEvent
    console.log('[Step 3] Simulating native cursor hover on first Explore Table button...');
    const btnPos = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const firstBtn = document.querySelector('[data-testid="category-explore-btn"]');
          if (!firstBtn) return null;
          const r = firstBtn.getBoundingClientRect();
          return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
        })()
      `,
      returnByValue: true
    });
    console.log('Button position for hover:', btnPos.result.value);

    if (btnPos.result.value) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: btnPos.result.value.x,
        y: btnPos.result.value.y,
      });
      await new Promise(r => setTimeout(r, 600));
    }

    // Capture screenshot during hover
    const snapHover = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verified_explore_button_hover_state.png'), Buffer.from(snapHover.data, 'base64'));
    console.log('✓ Captured verified_explore_button_hover_state.png');

    // Check style during hover
    const hoverStyleCheck = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const firstBtn = document.querySelector('[data-testid="category-explore-btn"]');
          if (!firstBtn) return null;
          const cs = window.getComputedStyle(firstBtn);
          const textEl = Array.from(firstBtn.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.includes('Explore Table')) || firstBtn;
          const textCs = window.getComputedStyle(textEl);
          return {
            backgroundColor: cs.backgroundColor,
            borderColor: cs.borderColor,
            color: textCs.color
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Button Computed Style during Hover:', hoverStyleCheck.result.value);

    // Step 4: Click button to verify navigation remains functional
    console.log('[Step 4] Clicking Explore Table button to verify navigation...');
    await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const firstBtn = document.querySelector('[role="button"][aria-label*="Explore"]');
          if (firstBtn) firstBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const navCheck = await cdp.send('Runtime.evaluate', { expression: 'window.location.hash', returnByValue: true });
    console.log('URL Hash after clicking button:', navCheck.result.value);

    console.log('\n=== REFINED EXPLORE TABLE BUTTON DESIGN VERIFICATION COMPLETE ===');
  } finally {
    edgeProc.kill();
  }
}

verifyDesign().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
