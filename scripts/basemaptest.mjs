import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

async function tileHost() {
  return page.evaluate(() => {
    const img = document.querySelector('img.leaflet-tile');
    if (!img) return '(no tiles)';
    try { return new URL(img.src).host; } catch { return img.src.slice(0, 40); }
  });
}

console.log('DARK host:', await tileHost());

await page.getByRole('button', { name: 'satellite' }).click();
await page.waitForTimeout(4000);
console.log('SATELLITE host:', await tileHost());
await page.screenshot({ path: 'shot-satellite.png' });

await page.getByRole('button', { name: 'streets' }).click();
await page.waitForTimeout(4000);
console.log('STREETS host:', await tileHost());

await browser.close();
