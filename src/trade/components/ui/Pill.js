import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, weight } from '../../theme';

export default function Pill({ label, color = colors.tealLight, background = colors.tealTintSoft, dotColor, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: background }, style]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: weight.bold },
});
