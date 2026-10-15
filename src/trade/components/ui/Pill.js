import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, weight } from '../../theme';
import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

export default function Pill({ label, color, background, dotColor, style }) {
  const styles = useThemedStyles(baseStyles);
  const { colors, themeColor } = useLegacyTheme();

  // Colours passed in as props bypass the style adapter, so run them through the
  // light-theme mapping here; defaults come from the active theme.
  const textColor = themeColor(color, 'color') || colors.tealLight;
  const fill = themeColor(background, 'backgroundColor') || colors.tealTintSoft;
  return (
    <View style={[styles.pill, { backgroundColor: fill }, style]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: themeColor(dotColor, 'backgroundColor') }]} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const baseStyles = StyleSheet.create({
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
