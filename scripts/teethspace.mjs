import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await page.getByRole('button', { name: 'Streets' }).click();
await page.waitForTimeout(2500);
// wide view (like the user's zoomed-out screenshot)
await page.evaluate(() => { window.__map.setView([13.0, 123.5], 6); });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'teethspace-wide.png' });
// closer trench view (Philippine Trench east of Mindanao)
await page.evaluate(() => { window.__map.setView([8.5, 126.9], 8); });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'teethspace-close.png', clip: { x: 360, y: 200, width: 460, height: 500 } });
console.log('saved');
await browser.close();
