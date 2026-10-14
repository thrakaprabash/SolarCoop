import React from 'react';
import { View } from 'react-native';

import { colors } from '../../theme';
import { useLegacyTheme } from '../../../theme/useLegacyTheme';

export default function Divider({ vertical = false, style }) {
  const { colors } = useLegacyTheme();

  const base = vertical
    ? { width: 1, height: 24, backgroundColor: colors.hairline }
    : { height: 1, backgroundColor: colors.hairline };
  return <View style={[base, style]} />;
}
