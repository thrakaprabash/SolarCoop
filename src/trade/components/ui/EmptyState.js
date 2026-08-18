import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, weight } from '../../theme';

export default function EmptyState({ title, body, style }) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 16, paddingHorizontal: 4, alignItems: 'center' },
  title: { fontSize: 14, fontWeight: weight.bold, color: colors.textStrong },
  body: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
});
