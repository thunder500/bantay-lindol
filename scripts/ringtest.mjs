import { chromium } from 'playwright-core';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 850 } });
const page = await ctx.newPage();

function bannerText() {
  return page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find((d) => /EARTHQUAKE (ALERT|DETECTED)|STRONG EARTHQUAKE|MAJOR EARTHQUAKE/.test(d.textContent || ''));
    return el ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) : '(no banner)';
  });
}

await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(7000); // baseline set + persisted
console.log('1) after first load   :', await bannerText());

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(7000);
console.log('2) after REFRESH      :', await bannerText(), '  <-- must be (no banner)');

// genuinely new event via the live channel
await page.evaluate(() => fetch('/api/stream-test?mag=5.6'));
await page.waitForTimeout(2500);
console.log('3) after NEW event    :', await bannerText(), '  <-- must show the alert');

await browser.close();
