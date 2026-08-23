/**
 * src/components/auth/PrimaryButton.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Solar-orange call-to-action button used across the auth flows.
 *
 * • Variants:
 *     primary   — filled Solar Orange (default CTA)
 *     secondary — outlined Solar Orange (e.g. "◀ BACK")
 *     danger    — filled red-orange (e.g. "Logout")
 * • Press scale spring animation for tactile feedback.
 * • Active `ActivityIndicator` loading state; disabled while busy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';

const VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  danger: 'danger',
};

export const PrimaryButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon: Icon,
  style,
  labelStyle,
}) => {
  const theme = useTheme();
  const { colors, radius } = theme;

  const scale = useRef(new Animated.Value(1)).current;

  const variantKey = VARIANTS[variant] || 'primary';
  const palette = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primaryLight,
      textColor: colors.onPrimary,
      glowColor: colors.primary,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      textColor: colors.primary,
      glowColor: 'transparent',
    },
    danger: {
      backgroundColor: colors.danger,
      borderColor: colors.dangerDark,
      textColor: colors.onDanger,
      glowColor: colors.danger,
    },
  }[variantKey];

  const isDisabled = disabled || loading;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 40,
      bounciness: 2,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 40,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={style}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
            borderRadius: radius.xl,
            shadowColor: palette.glowColor,
            shadowOffset: { width: 0, height: 5 },
            shadowRadius: 14,
            shadowOpacity: isDisabled ? 0 : 0.35,
            elevation: isDisabled ? 0 : 5,
          },
          { transform: [{ scale }] },
          isDisabled && styles.buttonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={palette.textColor} />
        ) : (
          <>
            {Icon ? <Icon size={18} color={palette.textColor} /> : null}
            <Text
              style={[styles.label, { color: palette.textColor }, labelStyle]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {label}
            </Text>
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
