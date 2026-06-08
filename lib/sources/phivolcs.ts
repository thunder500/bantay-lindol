import * as cheerio from 'cheerio';
import { Quake } from '../types';
import { makeId } from '../id';

const PHIVOLCS_URL = 'https://earthquake.phivolcs.dost.gov.ph/';
const BASE = 'https://earthquake.phivolcs.dost.gov.ph/';

// "08 June 2026 - 11:56 PM" (Philippine Standard Time, UTC+8) -> epoch ms UTC.
export function parsePhtDate(raw: string): number | null {
  const m = raw.trim().match(
    /(\d{1,2})\s+(\w+)\s+(\d{4})\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
  );
  if (!m) return null;
  const months: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };
  const month = months[m[2].toLowerCase()];
  if (month === undefined) return null;
  let hour = parseInt(m[4], 10) % 12;
  if (m[6].toUpperCase() === 'PM') hour += 12;
  const utcMs = Date.UTC(
    parseInt(m[3], 10), month, parseInt(m[1], 10), hour, parseInt(m[5], 10),
  );
  return utcMs - 8 * 3600 * 1000;
}

function num(raw: string): number {
  return parseFloat(raw.replace(/[^\d.\-]/g, ''));
}

export function parsePhivolcs(html: string): Quake[] {
  const $ = cheerio.load(html);
  const out: Quake[] = [];
  $('tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 6) return;
    const dateCell = $(cells[0]);
    const time = parsePhtDate(dateCell.text());
    if (time == null) return;
    const lat = num($(cells[1]).text());
    const lon = num($(cells[2]).text());
    const depthKm = num($(cells[3]).text());
    const magnitude = num($(cells[4]).text());
    const location = $(cells[5]).text().trim().replace(/\s+/g, ' ');
    if ([lat, lon, depthKm, magnitude].some((n) => Number.isNaN(n))) return;
    if (depthKm < 0 || depthKm > 800) return;
    const href = dateCell.find('a').attr('href');
    out.push({
      id: makeId('phivolcs', time, lat, lon),
      time, lat, lon, depthKm, magnitude, location,
      source: 'phivolcs',
      url: href ? new URL(href, BASE).toString() : undefined,
    });
  });
  return out;
}

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchHtml(url: string, timeoutMs = 15000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: controller.signal });
    if (!res.ok) throw new Error(`PHIVOLCS ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchPhivolcs(): Promise<Quake[]> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const quakes = parsePhivolcs(await fetchHtml(PHIVOLCS_URL));
      if (quakes.length) return quakes;
      lastErr = new Error('PHIVOLCS returned no parseable rows');
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('PHIVOLCS fetch failed');
}
