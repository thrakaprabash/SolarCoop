export const TRANSACTIONS = [
  { id: 'x1', ref: 'TXN-20260819-013', dir: 'sent', party: 'Maple Court', kwh: 1.8, ts: '2026-08-19T18:52', before: 5.0, after: 3.2 },
  { id: 'x2', ref: 'TXN-20260818-012', dir: 'received', party: 'Solar Home', kwh: 1.8, ts: '2026-08-18T11:15' },
  { id: 'x3', ref: 'TXN-20260816-011', dir: 'sent', party: 'Hilltop Villa', kwh: 3.4, ts: '2026-08-16T10:05', before: 8.4, after: 5.0 },
  { id: 'x4', ref: 'TXN-20260812-010', dir: 'received', party: 'Riverside Cottage', kwh: 2.6, ts: '2026-08-12T08:20' },
  { id: 'x5', ref: 'TXN-20260728-009', dir: 'sent', party: 'Green House', kwh: 4.2, ts: '2026-07-28T17:30', before: 7.4, after: 3.2 },
  { id: 'x6', ref: 'TXN-20260721-008', dir: 'received', party: 'Solar Home', kwh: 3.4, ts: '2026-07-21T09:10' },
];

/** Next ledger sequence number after the seeded records above. */
export const TXN_SEQ_START = 14;

export const HISTORY_FILTERS = ['All', 'Sent', 'Received'];

export const SELF_LABEL = 'You (House #21)';

export default TRANSACTIONS;
