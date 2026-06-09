import { chromium } from 'playwright-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);

async function clickLatLng(lat, lon) {
  const pt = await page.evaluate(([la, lo]) => {
    const m = window.__map;
    const p = m.latLngToContainerPoint([la, lo]);
    const r = m.getContainer().getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, [lat, lon]);
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(700);
  const out = await page.evaluate(() => {
    const t = document.querySelector('.eq-info-title')?.textContent || '';
    const rows = [...document.querySelectorAll('.eq-info tr')].map((tr) =>
      [...tr.children].map((c) => c.textContent.trim()).join(': ')).join(' | ');
    return `${t} => ${rows}`;
  });
  await page.evaluate(() => { if (window.__map) window.__map.closePopup(); });
  await page.waitForTimeout(150);
  return out;
}

// pull a mid vertex from a named feature in each layer
async function midVertex(url, pred) {
  return page.evaluate(async ([u, p]) => {
    const fc = await fetch(u).then((r) => r.json());
    const f = fc.features.find(new Function('f', `return (${p})(f)`));
    const c = f.geometry.type === 'LineString' ? f.geometry.coordinates : f.geometry.coordinates[0];
    const mid = c[Math.floor(c.length / 2)];
    return { name: f.properties.name, lon: mid[0], lat: mid[1] };
  }, [url, pred.toString()]);
}

const phl = await midVertex('/geo/trenches.geojson', (f) => f.properties.name === 'Philippine Trench');
console.log('PHL TRENCH click:', await clickLatLng(phl.lat, phl.lon));
const mnl = await midVertex('/geo/trenches.geojson', (f) => f.properties.name === 'Manila Trench');
console.log('MNL TRENCH click:', await clickLatLng(mnl.lat, mnl.lon));
const fault = await midVertex('/geo/faults.geojson', (f) => f.properties.name && f.properties.name.length > 3);
console.log('FAULT target:', fault.name);
console.log('FAULT click:', await clickLatLng(fault.lat, fault.lon));

// event log first-row time text
const logTime = await page.evaluate(() =>
  document.querySelector('.absolute.top-4.left-4 ul li button span:nth-child(3)')?.textContent || '(none)');
console.log('LOG first time text:', logTime);

await browser.close();
