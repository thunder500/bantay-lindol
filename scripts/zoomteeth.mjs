import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
await page.getByRole('button', { name: 'Streets' }).click();
await page.waitForTimeout(2500);
async function shot(lat, lon, zoom, name) {
  await page.evaluate(([la, lo, z]) => { window.__map.setView([la, lo], z); }, [lat, lon, zoom]);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: name });
  console.log('saved', name);
}
await shot(5.6, 123.9, 8, 'teeth-cotabato.png');   // Cotabato Trench (user's view)
await shot(15.0, 119.4, 7, 'teeth-manila.png');     // Manila Trench
await shot(8.5, 126.6, 7, 'teeth-philippine.png');  // Philippine Trench
await browser.close();
