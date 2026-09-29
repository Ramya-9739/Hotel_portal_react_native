import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const dir = path.join(__dirname, '..', '..', '..', 'docs', 'screenshots', 'review');

test.beforeEach(async () => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

test('guest portal – top of page (390px)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/h/taj-west-end');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, '01-portal-top-390.png') });
});

test('guest portal – scrolled down (390px)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/h/taj-west-end');
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dir, '02-portal-scrolled-390.png') });
});

test('guest portal – map view (390px)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/h/taj-west-end');
  await page.waitForLoadState('load');
  await page.waitForTimeout(500);
  await page.getByRole('radio', { name: 'Map' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dir, '03-portal-map-390.png') });
});

test('guest portal – desktop (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3000/h/taj-west-end');
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, '04-portal-desktop-1440.png') });
});

test('design system page (390px)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/design');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(dir, '05-design-system-390.png'), fullPage: true });
});
