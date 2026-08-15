import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircleCheck, TriangleAlert } from 'lucide-react-native';

import { colors, radius, weight } from '../../theme';

/** tone: 'error' | 'success' */
export default function Notice({ message, tone = 'error' }) {
  if (!message) return null;
  const error = tone === 'error';
  const color = error ? colors.danger : colors.tealLight;
  const Icon = error ? TriangleAlert : CircleCheck;

  return (
    <View style={[styles.notice, { backgroundColor: error ? colors.dangerTint : 'rgba(45,212,191,0.12)' }]}>
      <Icon size={error ? 16 : 18} color={color} strokeWidth={2} />
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: radius.lg,
  },
  text: { flex: 1, fontSize: 12, fontWeight: weight.bold },
});
