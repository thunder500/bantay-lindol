import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
// event log clip (top-left)
await page.screenshot({ path: 'v3-log.png', clip: { x: 12, y: 60, width: 300, height: 360 } });
// circles + teeth on streets, Mindanao cluster
await page.getByRole('button', { name: 'Streets' }).click();
await page.waitForTimeout(2500);
await page.evaluate(() => { window.__map.setView([6.0, 124.6], 8); });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'v3-map.png', clip: { x: 350, y: 200, width: 480, height: 480 } });
console.log('saved v3-log.png and v3-map.png');
await browser.close();
