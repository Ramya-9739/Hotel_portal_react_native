// scratch/inspect_console_errors.js
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

  return new Promise((resolve) => server.listen(5054, () => resolve(server)));
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
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
        }
        if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
        }
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
  const profileDir = path.join(__dirname, 'edge_user_data_inspect_err');
  if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgeExe, [
    '--headless=new',
    '--remote-debugging-port=9224',
    `--user-data-dir=${profileDir}`,
    '--disable-gpu',
    '--no-first-run',
  ], { stdio: 'ignore' });

  await new Promise(r => setTimeout(r, 2000));

  try {
    const tabRes = await fetch('http://localhost:9224/json/new?about:blank', { method: 'PUT' });
    const tabData = await tabRes.json();
    const cdp = new CDPClient(tabData.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('Navigating to http://localhost:5054/#/category/cafes ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5054/#/category/cafes' });
    await new Promise(r => setTimeout(r, 4000));

    cdp.ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    staticServer.close();
    edgeProc.kill();
  }
}

run();
