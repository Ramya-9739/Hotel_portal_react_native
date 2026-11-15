// scratch/inspect_dom_category.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
    if (filePath.endsWith(path.sep) || !path.extname(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    fs.readFile(filePath, (err, content) => {
      if (err) {
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, fallback) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallback);
        });
      } else {
        res.writeHead(200);
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => server.listen(5053, () => resolve(server)));
}

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
  const staticServer = await startStaticServer();
  const profileDir = path.join(__dirname, 'edge_user_data_inspect_cat');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9223',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9223/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Navigating to http://localhost:5053/#/category/cafes ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5053/#/category/cafes' });
    await new Promise(r => setTimeout(r, 3000));

    const evalResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            hash: window.location.hash,
            textSnippet: document.body.innerText.slice(0, 1000),
            title: document.title,
            allDivsCount: document.querySelectorAll('div').length,
            htmlPreview: document.getElementById('root')?.innerHTML?.slice(0, 500)
          };
        })()
      `,
      returnByValue: true
    });

    console.log('DOM Evaluation Result:', evalResult.result.value);

    // Also let's test clicking the "Explore Table ↗" button on the home page!
    await cdp.send('Page.navigate', { url: 'http://localhost:5053/#/guest' });
    await new Promise(r => setTimeout(r, 2000));

    const clickResult = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const allEls = Array.from(document.querySelectorAll('*'));
          const cafeCard = allEls.find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'Cafes & Bistros');
          if (cafeCard) {
            const card = cafeCard.closest('[role="button"]') || cafeCard.parentElement.parentElement || cafeCard.parentElement;
            card.click();
            return { clicked: true, tag: card.tagName };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Click on Cafes card result:', clickResult.result.value);

    await new Promise(r => setTimeout(r, 2000));

    const afterClickEval = await cdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            hash: window.location.hash,
            textSnippet: document.body.innerText.slice(0, 1000)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('After Click Evaluation Result:', afterClickEval.result.value);

    cdp.ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    staticServer.close();
    edgeProc.kill();
  }
}

run();
