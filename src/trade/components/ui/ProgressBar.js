import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

export default function ProgressBar({ value = 0, color = colors.teal }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: pct + '%', backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 5 },
});
