import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
// focus the map and zoom in with keyboard into the central archipelago (Philippine Fault Zone)
const box = await page.locator('.leaflet-container').boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, -500); await page.waitForTimeout(600); }
await page.waitForTimeout(3500);
await page.screenshot({ path: 'shot-zoom.png' });
await browser.close();
console.log('saved shot-zoom.png');
