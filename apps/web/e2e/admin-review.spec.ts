import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const dir = path.join(__dirname, '..', '..', '..', 'docs', 'screenshots', 'admin');

test.beforeEach(async () => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

test('admin – desktop Places tab (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3000/admin');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  // Click Nearby Places tab
  await page.getByRole('tab', { name: 'Nearby Places' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dir, '01-admin-places-1440.png') });
});

test('admin – desktop Details tab (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3000/admin');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await page.getByRole('tab', { name: 'Details' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, '02-admin-details-1440.png') });
});

test('admin – desktop QR tab (1440px)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3000/admin');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await page.getByRole('tab', { name: 'QR Code' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, '03-admin-qr-1440.png') });
});

test('admin – mobile (390px)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:3000/admin');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(dir, '04-admin-mobile-390.png') });
});

test('admin – tablet (768px)', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('http://127.0.0.1:3000/admin');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  await page.getByRole('tab', { name: 'Nearby Places' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dir, '05-admin-tablet-768.png') });
});
