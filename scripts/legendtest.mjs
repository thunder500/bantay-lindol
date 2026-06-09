import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

// find the magnitude range legend rows and their circle diameters
const info = await page.evaluate(() => {
  const heads = [...document.querySelectorAll('div')].filter((d) => d.textContent.trim() === 'MAGNITUDE RANGE');
  if (!heads.length) return { found: false };
  const ul = heads[0].nextElementSibling;
  const rows = [...ul.querySelectorAll('li')].map((li) => {
    const circle = li.querySelector('span span');
    const w = circle ? circle.style.width : '';
    return `${li.textContent.trim()} (${w})`;
  });
  return { found: true, rows };
});
console.log(JSON.stringify(info, null, 2));

// scroll the legend into view and screenshot the panel area
const legend = page.locator('text=MAGNITUDE RANGE').first();
await legend.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: 'shot-legend.png', clip: { x: 1080, y: 0, width: 320, height: 900 } });
await browser.close();
