/**
 * src/components/auth/AuthField.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable, fully-themed labelled text input used across the auth flows.
 *
 * • Leading icon (e.g. Mail, Lock, Phone, Sun).
 * • Animated orange focus ring + soft glow while the field is active.
 * • Eye toggle for `secureTextEntry` fields (show / hide password).
 * • Optional inline error message.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';

export const AuthField = ({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  textContentType,
  editable = true,
  error,
  returnKeyType = 'next',
  onSubmitEditing,
}) => {
  const theme = useTheme();
  const { colors, radius, spacing } = theme;

  const [isHidden, setIsHidden] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.inputBorder, colors.inputBorderFocus],
  });

  const iconColor = error
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.textMuted;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>

      <Animated.View
        style={[
          styles.inputWrap,
          {
            backgroundColor: editable ? colors.inputBg : colors.track,
            borderColor: animatedBorderColor,
            borderRadius: radius.md,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 3 },
            shadowRadius: 10,
            shadowOpacity: focusAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.18],
            }),
            elevation: 2,
          },
        ]}
      >
        {Icon ? (
          <Icon size={18} color={iconColor} style={styles.leadingIcon} />
        ) : null}

        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry && isHidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          editable={editable}
          selectionColor={colors.primary}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setIsHidden((prev) => !prev)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={isHidden ? 'Show password' : 'Hide password'}
          >
            {isHidden ? (
              <Eye size={18} color={colors.textMuted} />
            ) : (
              <EyeOff size={18} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
    borderWidth: 1.5,
  },
  leadingIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    minHeight: 50,
  },
  eyeButton: { padding: 4 },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
});
