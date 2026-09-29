import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Design System Primitives', () => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 }
  ];

  for (const viewport of viewports) {
    test(`screenshot at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://127.0.0.1:3000/design');
      
      // Wait for layout to settle
      await page.waitForLoadState('load');
      await page.waitForTimeout(500);
      
      const dir = path.join(__dirname, '..', 'docs', 'screenshots', 'step1');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await page.screenshot({ 
        path: path.join(dir, `design-${viewport.width}.png`), 
        fullPage: true 
      });
    });
  }

  test('accessibility at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('http://127.0.0.1:3000/design');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('accessibility at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/design');
    await page.waitForLoadState('load');
    await page.waitForTimeout(500);
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
