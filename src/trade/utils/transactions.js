import { monthLabel, addTradeAmounts } from './format';

export const matchesFilter = (txn, filter) =>
  filter === 'All' || (filter === 'Sent' ? txn.dir === 'sent' : txn.dir === 'received');

export const byNewest = (a, b) => new Date(b.ts) - new Date(a.ts);

/** Groups transactions into { label, items } blocks by calendar month. */
const reportingMonth = (value) => new Date(new Date(value).getTime() + 330 * 60000).toISOString().slice(0, 7);

export function groupByMonth(list, language) {
  const groups = [];
  list.forEach((txn) => {
    const key = reportingMonth(txn.ts);
    const label = monthLabel(new Date(txn.ts), language);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(txn);
  });
  return groups;
}

/** kWh sent and received within the calendar month of the given date. */
export function monthTotals(list, now = new Date()) {
  const inMonth = list.filter((t) => {
    return t.status === 'COMPLETED' && reportingMonth(t.ts) === reportingMonth(now);
  });
  const by = (dir) => inMonth.filter((t) => t.dir === dir).reduce((s, t) => addTradeAmounts(s, t.kwh), 0);
  return { sent: by('sent'), received: by('received') };
}

export const emptyCopy = (filter) =>
  filter === 'Sent'
    ? { titleKey: 'trade.history.emptySent.title', bodyKey: 'trade.history.emptySent.body' }
    : filter === 'Received'
    ? { titleKey: 'trade.history.emptyReceived.title', bodyKey: 'trade.history.emptyReceived.body' }
    : { titleKey: 'trade.history.emptyAll.title', bodyKey: 'trade.history.emptyAll.body' };
