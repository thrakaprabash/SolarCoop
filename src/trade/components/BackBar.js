import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';

export default function BackBar({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: 'rgba(255,255,255,0.16)' }]}
    >
      <ArrowLeft size={15} color={colors.textStrong} strokeWidth={2.2} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 6,
    paddingLeft: 9,
    paddingRight: 12,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  label: { fontSize: 12, fontWeight: weight.bold, color: colors.textStrong },
});
