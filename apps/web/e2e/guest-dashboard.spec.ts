import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Guest Dashboard - List View', () => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 1280, height: 800 },
  ];

  for (const viewport of viewports) {
    test(`screenshot at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://127.0.0.1:3000/h/taj-west-end');
      
      // Wait for layout to settle
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
      
      const dir = path.join(__dirname, '..', '..', '..', 'docs', 'screenshots', 'step2');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await page.screenshot({ 
        path: path.join(dir, `guest-dashboard-list-${viewport.width}.png`), 
        fullPage: true 
      });
    });
  }

  test('accessibility at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('http://127.0.0.1:3000/h/taj-west-end');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Guest Dashboard - Map View', () => {
  test('screenshot at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('http://127.0.0.1:3000/h/taj-west-end');
    
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);

    // Switch to Map view
    await page.getByRole('radio', { name: 'Map' }).click();
    await page.waitForTimeout(500);
    
    const dir = path.join(__dirname, '..', '..', '..', 'docs', 'screenshots', 'step2');
    await page.screenshot({ 
      path: path.join(dir, `guest-dashboard-map-360.png`), 
      fullPage: true 
    });
  });
});
