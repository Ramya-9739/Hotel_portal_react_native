const http = require('http');
const CDP = require('chrome-remote-interface');
const { spawn } = require('child_process');
const fs = require('fs');

async function test() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = 'C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c\\edge_debug_live';
  const edgeProc = spawn(edgePath, [
    '--remote-debugging-port=9223',
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const client = await CDP({ port: 9223 });
  const { Page, Runtime } = client;
  await Page.enable();
  await Runtime.enable();
  await Page.navigate({ url: 'http://localhost:8081/#/guest' });
  await Page.loadEventFired();
  await new Promise(r => setTimeout(r, 4000));

  const result = await Runtime.evaluate({
    expression: `(() => {
      const text = document.body.innerText;
      return {
        hasNoItemsAvailable: text.includes('No items currently available'),
        hasNoShopping: text.includes('No shopping destinations found'),
        hasNoTransit: text.includes('No transportation hubs found'),
        title: document.title,
        bodySnippet: text.slice(0, 500)
      };
    })()`
  });
  console.log('DOM CHECK:', JSON.stringify(result.result.value, null, 2));

  const shot = await Page.captureScreenshot({ format: 'png' });
  fs.writeFileSync('C:\\Users\\ramya\\.gemini\\antigravity\\brain\\f204b27a-daa4-43da-a7cc-b5acbb9fe60c\\current_live_check.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved screenshot to current_live_check.png');

  await client.close();
  edgeProc.kill();
}
test().catch(console.error);
