const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 9227;
const USER_DATA_DIR = path.join('C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c', 'edge_profile_btn_test');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(JSON.parse(data)));
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
    return res.result ? res.result.value : undefined;
  }
}

async function main() {
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
    const cdp = new CdpSession(page.webSocketDebuggerUrl);
    await cdp.connect();

    for (let i = 0; i < 15; i++) {
      const text = await cdp.evaluate('document.body.innerText || ""');
      if (text.includes('MANGO HOTELS')) break;
      await sleep(1000);
    }
    await sleep(2000);

    const testDetails = await cdp.evaluate(`
      (() => {
        const all = Array.from(document.querySelectorAll('*'));
        const buttons = all.filter(el => el.textContent && el.textContent.trim() === 'Explore Table ↗');
        
        // Find each button and its parent card
        const btnInfo = buttons.map((b, idx) => {
          const card = b.closest('div[style*="border"], div[class]') || b.parentElement.parentElement;
          return {
            index: idx,
            tag: b.tagName,
            testId: b.getAttribute('data-testid'),
            role: b.getAttribute('role'),
            text: b.textContent.trim(),
            parentCardText: card ? card.innerText.split('\\n')[0] : 'unknown',
          };
        });

        // Test clicking the first button using real click event
        const firstBtn = buttons[0];
        let navResult = 'not clicked';
        if (firstBtn) {
          firstBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          navResult = window.location.hash;
        }

        return {
          buttonsCount: buttons.length,
          btnInfo: btnInfo.slice(0, 5),
          navResult
        };
      })()
    `);

    console.log('Button details:', JSON.stringify(testDetails, null, 2));

    // Wait 1 second to see if hash updated
    await sleep(1000);
    const finalHash = await cdp.evaluate('window.location.hash');
    console.log('Final Hash after dispatchEvent:', finalHash);

    // If still #/guest, let's see why: click with CDP Input.dispatchMouseEvent at button coordinate
    const btnBox = await cdp.evaluate(`
      (() => {
        const b = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.trim() === 'Explore Table ↗');
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()
    `);
    console.log('Button coordinates:', btnBox);

    if (btnBox) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: btnBox.x,
        y: btnBox.y,
        button: 'left',
        clickCount: 1,
      });
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: btnBox.x,
        y: btnBox.y,
        button: 'left',
        clickCount: 1,
      });
      await sleep(1000);
      const hashAfterHardwareClick = await cdp.evaluate('window.location.hash');
      console.log('Hash after CDP hardware mouse click:', hashAfterHardwareClick);
      const pageTitle = await cdp.evaluate('document.body.innerText.substring(0, 300)');
      console.log('Page content after hardware click:', pageTitle);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    edge.kill();
  }
}
main();
