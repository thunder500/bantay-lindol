export interface MonthOption { value: string; label: string; } // value: 'YYYY-MM'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Months descending from `today`'s month, `count` of them.
export function monthOptions(today: string, count: number): MonthOption[] {
  const [y, m] = today.split('-').map(Number);
  const out: MonthOption[] = [];
  let year = y, month = m; // month is 1-based
  for (let i = 0; i < count; i++) {
    const value = `${year}-${String(month).padStart(2, '0')}`;
    out.push({ value, label: `${MONTH_NAMES[month - 1]} ${year}` });
    month--;
    if (month === 0) { month = 12; year--; }
  }
  return out;
}

// First..last day of the given 'YYYY-MM', with the end capped at `today`.
export function monthBounds(value: string, today: string): { start: string; end: string } {
  const [y, m] = value.split('-').map(Number);
  const start = `${value}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let end = `${value}-${String(lastDay).padStart(2, '0')}`;
  if (end > today) end = today;
  return { start, end };
}
