import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, weight } from '../../theme';
import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

export default function Chip({ label, active, onPress, icon: Icon }) {
  const styles = useThemedStyles(baseStyles);
  const { colors, themeColor } = useLegacyTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      hitSlop={{ top: 6, bottom: 6 }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.amberTint : themeColor('rgba(255,255,255,0.05)', 'backgroundColor'),
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

const baseStyles = StyleSheet.create({
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
