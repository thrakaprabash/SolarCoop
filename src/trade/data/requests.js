import { colors } from '../theme';

export const REQUEST_FILTERS = ['All', 'Pending', 'Approved', 'Rejected', 'Completed'];

export const STATUS_STYLE = {
  Pending: { color: colors.amberLight, pillBg: colors.amberTint },
  Approved: { color: colors.tealLight, pillBg: colors.tealTintSoft },
  Completed: { color: colors.tealLight, pillBg: colors.tealTintSoft },
  Rejected: { color: colors.danger, pillBg: 'rgba(239,68,68,0.15)' },
};
