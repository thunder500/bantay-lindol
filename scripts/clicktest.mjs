import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);

async function clickLatLng(lat, lon) {
  const pt = await page.evaluate(([la, lo]) => {
    const m = window.__map;
    if (!m) return null;
    const p = m.latLngToContainerPoint([la, lo]);
    const r = m.getContainer().getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, [lat, lon]);
  if (!pt) return '(no map)';
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(700);
  const title = await page.evaluate(() => document.querySelector('.eq-info-title')?.textContent || '');
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll('.eq-info tr')].map((tr) => tr.textContent.trim()).join(' | '));
  // close popup before next click
  await page.evaluate(() => { if (window.__map) window.__map.closePopup(); });
  await page.waitForTimeout(200);
  return `${title} -> ${rows}`;
}

// Philippine Trench vertex [126.6, 9.0]; Manila Trench vertex [119.0, 18.8]
console.log('TRENCH(PHL):', await clickLatLng(9.0, 126.6));
console.log('TRENCH(MNL):', await clickLatLng(18.8, 119.0));

// a fault vertex pulled from the data
const faultPt = await page.evaluate(async () => {
  const fc = await fetch('/geo/faults.geojson').then((r) => r.json());
  const f = fc.features.find((x) => x.properties.name);
  const c = f.geometry.type === 'LineString' ? f.geometry.coordinates : f.geometry.coordinates[0];
  const mid = c[Math.floor(c.length / 2)];
  return { name: f.properties.name, lon: mid[0], lat: mid[1] };
});
console.log('fault target:', faultPt.name, faultPt.lat, faultPt.lon);
console.log('FAULT:', await clickLatLng(faultPt.lat, faultPt.lon));

await browser.close();
