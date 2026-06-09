import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

await page.getByRole('button', { name: /Test the alert sound/i }).click();
await page.waitForTimeout(800);
const banner = await page.evaluate(() => {
  const b = document.querySelector('.animate-\\[eqDrop_0\\.25s_ease-out\\]') ||
    [...document.querySelectorAll('div')].find((d) => /New earthquake/.test(d.textContent));
  return b ? b.textContent.replace(/\s+/g, ' ').trim().slice(0, 120) : '(no banner)';
});
console.log('Banner after Test:', banner);
console.log('Page errors:', errors.length ? errors.join(' | ') : 'none');

await page.screenshot({ path: 'shot-alert.png', clip: { x: 1070, y: 0, width: 330, height: 900 } });
await page.screenshot({ path: 'shot-alert-full.png' });
await browser.close();
