export const kwh = (n) => Number(n).toFixed(1);

/** Keep the actual trade quantity, including fractional provider maxima. */
export function decimalAmount(value) {
  const text = String(Number(value));
  if (!/[eE]/.test(text)) return text;
  const sign = text.startsWith('-') ? '-' : '';
  const [coefficient, exponent] = text.replace(/^-/, '').toLowerCase().split('e');
  const [whole, fraction = ''] = coefficient.split('.');
  const digits = whole + fraction;
  const point = whole.length + Number(exponent);
  return sign + (point <= 0 ? '0.' + '0'.repeat(-point) + digits
    : point >= digits.length ? digits + '0'.repeat(point - digits.length)
    : digits.slice(0, point) + '.' + digits.slice(point));
}

/** Add decimal trade quantities without binary floating-point display noise. */
export function addTradeAmounts(a, b) {
  const parts = [decimalAmount(a), decimalAmount(b)];
  const scale = Math.max(...parts.map(text => (text.split('.')[1] || '').length));
  const integers = parts.map(text => {
    const [whole, fraction = ''] = text.split('.');
    return BigInt(whole + fraction.padEnd(scale, '0'));
  });
  const total = integers[0] + integers[1];
  const digits = (total < 0n ? -total : total).toString().padStart(scale + 1, '0');
  return Number((total < 0n ? '-' : '') + (scale ? digits.slice(0, -scale) + '.' + digits.slice(-scale) : digits));
}
export const tradeKwh = (value) => {
  const amount = Number(value);
  if (amount > 0 && amount < 0.01) return '<0.01';
  return amount.toFixed(2);
};

export const money = (n) => '$' + Number(n).toFixed(2);

export const rate = (n) => Number(n).toFixed(2);

export const sum = (list) => list.reduce((a, b) => addTradeAmounts(a, b), 0);

export const distanceInMeters = (dist) =>
  dist.indexOf('km') > -1 ? parseFloat(dist) * 1000 : parseFloat(dist);

export const dayPart = (now = new Date()) => {
  const hr = now.getHours();
  return hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
};

export const today = () =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/* --- transaction ledger formatting --- */

const locale = (language = 'en') => ({ si: 'si-LK', ta: 'ta-LK', en: 'en-GB' }[language.split('-')[0]] || 'en-GB');
const timeZone = 'Asia/Colombo';
export const clock = (d, language) => d.toLocaleTimeString(locale(language), { timeZone, hour: 'numeric', minute: '2-digit' });

export const longDate = (d, language) => d.toLocaleDateString(locale(language), { timeZone, day: '2-digit', month: 'short', year: 'numeric' });

export const shortDate = (d, language) => d.toLocaleDateString(locale(language), { timeZone, day: '2-digit', month: 'short' });

export const monthLabel = (d, language) => d.toLocaleDateString(locale(language), { timeZone, month: 'long', year: 'numeric' });

export const stamp = (d, language) => longDate(d, language) + ' • ' + clock(d, language);

const pad = (n, len) => String(n).padStart(len, '0');

/** TXN-YYYYMMDD-NNN */
export const txnRef = (d, seq) =>
  'TXN-' + d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2) + '-' + pad(seq, 3);
