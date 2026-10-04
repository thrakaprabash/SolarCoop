import { monthLabel } from './format';

export const matchesFilter = (txn, filter) =>
  filter === 'All' || (filter === 'Sent' ? txn.dir === 'sent' : txn.dir === 'received');

export const byNewest = (a, b) => new Date(b.ts) - new Date(a.ts);

/** Groups transactions into { label, items } blocks by calendar month. */
export function groupByMonth(list) {
  const groups = [];
  list.forEach((txn) => {
    const label = monthLabel(new Date(txn.ts));
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push(txn);
  });
  return groups;
}

/** kWh sent and received within the calendar month of the given date. */
export function monthTotals(list, now = new Date()) {
  const inMonth = list.filter((t) => {
    const d = new Date(t.ts);
    return t.status === 'COMPLETED' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const by = (dir) => inMonth.filter((t) => t.dir === dir).reduce((s, t) => s + t.kwh, 0);
  return { sent: by('sent'), received: by('received') };
}

export const emptyCopy = (filter) =>
  filter === 'Sent'
    ? { titleKey: 'trade.history.emptySent.title', bodyKey: 'trade.history.emptySent.body' }
    : filter === 'Received'
    ? { titleKey: 'trade.history.emptyReceived.title', bodyKey: 'trade.history.emptyReceived.body' }
    : { titleKey: 'trade.history.emptyAll.title', bodyKey: 'trade.history.emptyAll.body' };
