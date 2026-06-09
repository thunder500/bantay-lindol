import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
const pt = await page.evaluate(() => {
  const m = window.__map;
  const p = m.latLngToContainerPoint([9.0, 126.6]); // Philippine Trench
  const r = m.getContainer().getBoundingClientRect();
  return { x: r.left + p.x, y: r.top + p.y };
});
await page.mouse.click(pt.x, pt.y);
await page.waitForTimeout(1000);
await page.screenshot({ path: 'shot-popup.png' });
await browser.close();
console.log('saved shot-popup.png');
