import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await page.getByRole('button', { name: 'Streets' }).click();
await page.waitForTimeout(2500);
await page.evaluate(() => { window.__map.setView([14.5, 119.6], 7); }); // Manila Trench west Luzon
await page.waitForTimeout(3500);
await page.screenshot({ path: 'teeth-zoom.png' });
console.log('saved teeth-zoom.png');
await browser.close();
