import { colors } from '../theme';

export const INITIAL_REQUESTS = [
  { id: 'r1', name: 'Green House', kwh: 2.5, rate: 0.22, date: '14 Aug 2026', status: 'Pending' },
  { id: 'r2', name: 'Solar Home', kwh: 1.8, rate: 0.2, date: '12 Aug 2026', status: 'Approved' },
  { id: 'r3', name: 'Eco House', kwh: 3.0, rate: 0.24, date: '10 Aug 2026', status: 'Rejected' },
];

export const REQUEST_FILTERS = ['All', 'Pending', 'Approved', 'Rejected'];

export const STATUS_STYLE = {
  Pending: { color: colors.amberLight, pillBg: colors.amberTint },
  Approved: { color: colors.tealLight, pillBg: colors.tealTintSoft },
  Rejected: { color: colors.danger, pillBg: 'rgba(239,68,68,0.15)' },
};

export default INITIAL_REQUESTS;
