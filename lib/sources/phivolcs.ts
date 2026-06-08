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
    const href = dateCell.find('a').attr('href');
    out.push({
      id: makeId('phivolcs', time, lat, lon),
      time, lat, lon, depthKm, magnitude, location,
      source: 'phivolcs',
      url: href ? new URL(href, BASE).toString() : PHIVOLCS_URL,
    });
  });
  return out;
}

export async function fetchPhivolcs(): Promise<Quake[]> {
  const res = await fetch(PHIVOLCS_URL, { headers: { 'User-Agent': 'BantayLindol/1.0' } });
  if (!res.ok) throw new Error(`PHIVOLCS ${res.status}`);
  return parsePhivolcs(await res.text());
}
