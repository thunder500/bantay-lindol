import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);
await page.getByRole('button', { name: 'Satellite' }).click();
await page.waitForTimeout(3000);
async function shot(lat, lon, zoom, name) {
  await page.evaluate(([la, lo, z]) => { window.__map.setView([la, lo], z); }, [lat, lon, zoom]);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: name });
  console.log('saved', name);
}
await shot(10.7, 124.85, 9, 'verify-leyte.png');        // Philippine Fault through Leyte
await shot(15.5, 119.2, 7, 'verify-manila-trench.png');  // Manila Trench offshore west Luzon
await browser.close();
