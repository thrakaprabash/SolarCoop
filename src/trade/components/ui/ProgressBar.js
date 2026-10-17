import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

export default function ProgressBar({ value = 0, color }) {
  const styles = useThemedStyles(baseStyles);
  const { colors, themeColor } = useLegacyTheme();

  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={[styles.fill, { width: pct + '%', backgroundColor: color ? themeColor(color, 'backgroundColor') : colors.teal }]} />
    </View>
  );
}

const baseStyles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 5 },
});
