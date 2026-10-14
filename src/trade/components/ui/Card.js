import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { colors, radius, shadow } from '../../theme';
import { useThemedStyles } from '../../../theme/useLegacyTheme';
import { useTheme } from '../../../theme/useTheme';

export default function Card({ style, children, padding = 16 }) {
  const styles = useThemedStyles(baseStyles);
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        !isDark && styles.lightCard,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const baseStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    ...shadow.card,
  },
  lightCard: {
    shadowColor: '#09243B',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0px 5px 16px rgba(9, 36, 59, 0.08)' },
      default: {},
    }),
  },
});
