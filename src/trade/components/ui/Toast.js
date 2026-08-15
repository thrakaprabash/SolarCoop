import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircleCheck } from 'lucide-react-native';

import { colors, radius, weight } from '../../theme';

export default function Toast({ message, bottom = 96 }) {
  if (!message) return null;
  return (
    <View style={[styles.toast, { bottom }]} pointerEvents="none">
      <CircleCheck size={18} color={colors.tealLight} strokeWidth={2} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(20,184,166,0.18)',
    borderWidth: 1,
    borderColor: colors.tealBorder,
    zIndex: 70,
  },
  text: { color: colors.tealLight, fontSize: 12, fontWeight: weight.bold },
});
