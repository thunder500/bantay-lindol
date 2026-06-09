import { chromium } from 'playwright-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 850 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text()); });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000); // let EventSource connect + initial snapshot

// simulate a new posted quake hitting the live channel
const resp = await page.evaluate(async () => {
  const r = await fetch('/api/stream-test?mag=5.6');
  return r.json();
});
console.log('pushed:', JSON.stringify(resp.pushed?.location), 'M' + resp.pushed?.magnitude);

await page.waitForTimeout(1500);
const banner = await page.evaluate(() => {
  const el = [...document.querySelectorAll('div')].find((d) => /EARTHQUAKE/.test(d.textContent) && /M\s?5/.test(d.textContent) && /TEST EVENT|simulated/.test(d.textContent));
  return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 140) : '(no banner)';
});
console.log('ALARM BANNER:', banner);
console.log('errors:', errors.length ? errors.join(' | ') : 'none');
await browser.close();
