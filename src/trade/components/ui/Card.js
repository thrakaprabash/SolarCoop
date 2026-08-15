import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, shadow } from '../../theme';

export default function Card({ style, children, padding = 16 }) {
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    ...shadow.card,
  },
});
