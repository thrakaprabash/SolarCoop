import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadow } from '../../theme';
import { useThemedStyles } from '../../../theme/useLegacyTheme';

export default function Card({ style, children, padding = 16 }) {
  const styles = useThemedStyles(baseStyles);

  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const baseStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    ...shadow.card,
  },
});
