import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, weight } from '../../theme';
import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

/**
 * variant: 'solid' (filled teal) | 'ghost' (translucent teal)
 */
export default function PrimaryButton({
  label,
  onPress,
  icon: Icon,
  variant = 'solid',
  disabled = false,
  background,
  style,
  children,
}) {
  const styles = useThemedStyles(baseStyles);
  const { colors } = useLegacyTheme();

  const ghost = variant === 'ghost';
  const bg = background || (ghost ? colors.tealTint : colors.teal);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        ghost && styles.ghost,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {Icon ? <Icon size={18} color={ghost ? colors.tealLight : '#FFFFFF'} strokeWidth={2} /> : null}
      <Text style={[styles.label, { color: ghost ? colors.tealLight : '#FFFFFF' }]}>{label}</Text>
      {children}
    </Pressable>
  );
}

const baseStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: radius.xl,
  },
  ghost: { borderWidth: 1, borderColor: colors.tealBorder },
  label: { color: colors.text, fontSize: 14, fontWeight: weight.bold },
});
