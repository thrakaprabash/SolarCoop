export const kwh = (n) => Number(n).toFixed(1);

export const money = (n) => '$' + Number(n).toFixed(2);

export const rate = (n) => Number(n).toFixed(2);

export const sum = (list) => list.reduce((a, b) => a + b, 0);

export const distanceInMeters = (dist) =>
  dist.indexOf('km') > -1 ? parseFloat(dist) * 1000 : parseFloat(dist);

export const greeting = (name, now = new Date()) => {
  const hr = now.getHours();
  const part = hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening';
  return 'Good ' + part + ', ' + name;
};

export const today = () =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/* --- transaction ledger formatting --- */

export const clock = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export const longDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export const shortDate = (d) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

export const monthLabel = (d) => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export const stamp = (d) => longDate(d) + ' • ' + clock(d);

const pad = (n, len) => String(n).padStart(len, '0');

/** TXN-YYYYMMDD-NNN */
export const txnRef = (d, seq) =>
  'TXN-' + d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2) + '-' + pad(seq, 3);
