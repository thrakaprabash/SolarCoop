// Display-only number formatting for live readings. The data layer keeps full
// precision (a reading can arrive as 0.42391074433922765), screens show a fixed
// number of decimals so values never run past their card.

/** "0.42", "2.50", "—" when there is no usable number. Never prints "-0.00". */
export function fixed(value, digits = 2) {
  const number = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(number)) return '—';
  const text = number.toFixed(digits);
  return /^-0(?:\.0+)?$/.test(text) ? text.slice(1) : text;
}

/** Power in kW, two decimals. */
export const power = (value) => fixed(value, 2);
/** Energy in kWh, two decimals. */
export const energy = (value) => fixed(value, 2);
/** Whole-number percentage without the % sign. */
export const percent = (value) => fixed(value, 0);

/** "1,147.9", "8,035.5", "-13.5": fixed decimals plus thousands separators, "—" when there is no usable number. */
export function grouped(value, digits = 1) {
  const text = fixed(value, digits);
  if (!/^-?\d+(?:\.\d+)?$/.test(text)) return text;
  const negative = text.startsWith('-');
  const [whole, fraction] = (negative ? text.slice(1) : text).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${negative ? '-' : ''}${withCommas}${fraction === undefined ? '' : `.${fraction}`}`;
}
