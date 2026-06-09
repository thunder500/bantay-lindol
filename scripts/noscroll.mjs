import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(5000);
const res = await page.evaluate(() => {
  const panel = document.querySelector('.absolute.top-4.right-4');
  const selects = document.querySelectorAll('select');
  const magSelects = [...selects].filter((s) => /Magnitude/.test(s.textContent));
  return {
    panelScrolls: panel ? panel.scrollHeight > panel.clientHeight + 1 : 'no panel',
    panelBottom: panel ? Math.round(panel.getBoundingClientRect().bottom) : -1,
    viewport: window.innerHeight,
    magSelectCount: magSelects.length,
  };
});
console.log(JSON.stringify(res, null, 2));
await page.screenshot({ path: 'shot-noscroll.png' });
await browser.close();
const ok = res.panelScrolls === false && res.panelBottom <= res.viewport && res.magSelectCount === 1;
console.log(ok ? 'PASS' : 'FAIL');
if (!ok) process.exit(1);
