import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1300, height: 850 } });
const errors = [];
const streamReqs = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('request', (r) => { if (/\/api\/stream/.test(r.url())) streamReqs.push(r.url()); });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
const live = await page.evaluate(() =>
  [...document.querySelectorAll('span')].some((s) => s.textContent.trim() === 'LIVE'));
const updated = await page.evaluate(() =>
  ([...document.querySelectorAll('span')].find((s) => /updated \d+s ago/.test(s.textContent)) || {}).textContent || '(none)');
console.log('EventSource opened to /api/stream:', streamReqs.length > 0);
console.log('LIVE indicator present:', live);
console.log('updated text:', updated);
console.log('page errors:', errors.length ? errors.join(' | ') : 'none');
await page.screenshot({ path: 'shot-live.png', clip: { x: 12, y: 100, width: 280, height: 90 } });
await browser.close();
