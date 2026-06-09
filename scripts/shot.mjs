import { chromium } from 'playwright-core';

const url = process.argv[2] || 'http://localhost:3000';
const out = process.argv[3] || 'shot.png';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE.ERROR:', m.text()); });
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(7000);

const diag = await page.evaluate(() => ({
  leafletContainer: !!document.querySelector('.leaflet-container'),
  tiles: document.querySelectorAll('img.leaflet-tile').length,
  paths: document.querySelectorAll('.leaflet-overlay-pane path').length,
  volcanoes: document.querySelectorAll('.eq-volcano-icon').length,
  sonar: document.querySelectorAll('.eq-sonar-icon').length,
  circles: document.querySelectorAll('path.leaflet-interactive').length,
}));
console.log('DIAG:', JSON.stringify(diag));

await page.screenshot({ path: out });
await browser.close();
console.log('saved', out);
