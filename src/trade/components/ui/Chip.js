import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, weight } from '../../theme';

export default function Chip({ label, active, onPress, icon: Icon }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.amberTint : 'rgba(255,255,255,0.05)',
          borderColor: active ? colors.amberBorder : colors.borderSoft,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {Icon ? <Icon size={14} color={active ? colors.amberLight : colors.textFaint} strokeWidth={2} /> : null}
      <Text
        style={[
          styles.label,
          { color: active ? colors.amberLight : colors.textFaint, fontWeight: active ? weight.heavy : weight.medium },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  label: { fontSize: 12 },
});
