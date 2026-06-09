import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const audioReqs = [];
const errors = [];
page.on('request', (r) => { if (/\/audio\//.test(r.url())) audioReqs.push(r.url()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

await page.getByRole('button', { name: /Test the alarm/i }).click();
await page.waitForTimeout(1500);

const banner = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((d) => /EARTHQUAKE/.test(d.textContent) && /M\d/.test(d.textContent));
  return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) : '(no banner)';
});
console.log('Emergency banner:', banner);
console.log('Audio requests:', audioReqs.length ? [...new Set(audioReqs)].join(', ') : '(none)');
console.log('Page errors:', errors.length ? errors.join(' | ') : 'none');

await page.screenshot({ path: 'shot-emergency.png' });
await browser.close();
