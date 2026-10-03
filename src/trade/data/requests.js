import { colors } from '../theme';

export const REQUEST_FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];

export const REQUEST_FILTER_LABEL_KEY = {
  All: 'common.status.all',
  Pending: 'common.status.pending',
  Approved: 'common.status.approved',
  Rejected: 'common.status.rejected',
  Completed: 'common.status.completed',
};

export const STATUS_STYLE = {
  Pending: { color: colors.amberLight, pillBg: colors.amberTint },
  Approved: { color: colors.tealLight, pillBg: colors.tealTintSoft },
  Completed: { color: colors.tealLight, pillBg: colors.tealTintSoft },
  Rejected: { color: colors.danger, pillBg: 'rgba(239,68,68,0.15)' },
};

export const STATUS_LABEL_KEY = {
  Pending: 'common.status.pending',
  Approved: 'common.status.approved',
  Completed: 'common.status.completed',
  Rejected: 'common.status.rejected',
  Unknown: 'trade.status.unknown',
};
