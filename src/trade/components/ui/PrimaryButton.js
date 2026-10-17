import React from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, weight } from '../../theme';
import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

// Soft blue glow under a solid button in light mode.
const solidShadow = Platform.select({
  web: { boxShadow: '0px 4px 12px rgba(6, 118, 161, 0.22)' },
  default: { shadowColor: '#0676A1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 2 },
});

/**
 * variant: 'solid' (main action) | 'ghost' (secondary, tonal) | 'neutral' (outline)
 * Light mode takes the shared blue button looks; dark mode keeps the teal look.
 */
export default function PrimaryButton({
  label,
  onPress,
  icon: Icon,
  variant = 'solid',
  disabled = false,
  background,
  foreground,
  borderColor,
  style,
  children,
}) {
  const styles = useThemedStyles(baseStyles);
  const { colors, action } = useLegacyTheme();

  const ghost = variant === 'ghost';
  const neutral = variant === 'neutral';
  const outlined = ghost || neutral;
  // Only a solid button turns grey when disabled; tonal and outline ones keep
  // their look so a finished state such as "Requested" still reads as done.
  const look = ghost ? action.tonal : neutral ? action.neutral : disabled ? action.disabled : action.solid;
  const light = !!look.box;
  const bg = background || look.box?.backgroundColor || (ghost ? colors.tealTint : neutral ? colors.surfaceAlt : colors.teal);
  const contentColor = foreground || look.text?.color || (ghost ? colors.teal : neutral ? colors.textStrong : '#FFFFFF');
  const outlineColor = borderColor || look.box?.borderColor || (ghost ? colors.tealBorder : neutral ? colors.border : 'transparent');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        outlined && styles.outlined,
        {
          backgroundColor: bg,
          borderColor: outlineColor,
          opacity: disabled && !light ? 0.64 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
        },
        light && !outlined && !disabled ? solidShadow : null,
        style,
      ]}
    >
      {Icon ? <Icon size={18} color={contentColor} strokeWidth={2} /> : null}
      <Text
        style={[styles.label, { color: contentColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {label}
      </Text>
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
  outlined: { borderWidth: 1 },
  label: { color: colors.text, fontSize: 14, fontWeight: weight.bold },
});
