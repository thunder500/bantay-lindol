import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, permissions: [] });
const page = await ctx.newPage();
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);

const alertLabel = await page.evaluate(() =>
  [...document.querySelectorAll('span')].find((s) => /New EQ Event Alert/.test(s.textContent))?.textContent || '(none)');
const alertOn = await page.evaluate(() =>
  document.querySelector('[role="switch"]')?.getAttribute('aria-checked'));
const hasMagSelect = await page.evaluate(() => {
  const lbl = [...document.querySelectorAll('label')].find((l) => /Magnitude Range/.test(l.textContent));
  const sel = lbl?.parentElement?.querySelector('select');
  return sel ? [...sel.options].map((o) => o.textContent).join(', ') : '(no select)';
});
console.log('Alert label:', alertLabel);
console.log('First switch aria-checked:', alertOn);
console.log('Magnitude Range options:', hasMagSelect);

// change to Magnitude 5+ and confirm label updates + count drops
await page.evaluate(() => {
  const lbl = [...document.querySelectorAll('label')].find((l) => /Magnitude Range/.test(l.textContent));
  const sel = lbl.parentElement.querySelector('select');
  sel.value = '5';
  sel.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(1500);
const labelAfter = await page.evaluate(() =>
  [...document.querySelectorAll('span')].find((s) => /New EQ Event Alert/.test(s.textContent))?.textContent || '(none)');
console.log('Alert label after M5+:', labelAfter);

await browser.close();
