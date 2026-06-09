import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await page.getByRole('button', { name: 'Streets' }).click();
await page.waitForTimeout(2500);
// Frame like the original Image #20: Cotabato Trench west of General Santos
await page.evaluate(() => { window.__map.setView([6.0, 124.2], 8); });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'toothdir-cot.png' });
console.log('saved toothdir-cot.png');
await browser.close();
