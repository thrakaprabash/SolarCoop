/**
 * src/components/auth/AuthLayout.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared, fully-themed screen scaffold for the SolarCoop auth flows
 * (Login / Registration / Forgot Password).
 *
 * • Opaque Solar Amber & Orange background (Light: white + warm cream glow,
 *   Dark: premium black + subtle orange ember).
 * • Animated entrance — the card fades and rises into place on mount.
 * • Renders its own themed StatusBar, so auth screens look correct on top of
 *   the (darker) member shell.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { PALETTE } from '../../theme/colors';

export const AuthLayout = ({ title, subtitle, children, footer }) => {
  const theme = useTheme();
  const { colors, spacing, radius } = theme;

  // Entrance animation: fade + gentle rise.
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const contentStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent
      />

      {/* Warm solar glow decorations */}
      <LinearGradient
        colors={
          theme.isDark
            ? ['rgba(237,137,54,0.16)', 'transparent']
            : ['rgba(246,173,85,0.28)', 'rgba(255,249,242,0)']
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glowTop}
        pointerEvents="none"
      />
      <View
        style={[
          styles.glowOrb,
          theme.isDark ? styles.glowOrbDark : styles.glowOrbLight,
        ]}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={contentStyle}>
            {/* Brand */}
            <View style={styles.brandRow}>
              <LinearGradient
                colors={[colors.primaryLight, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoBadge}
              >
                <Sun size={20} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
              <Text style={[styles.brandName, { color: colors.text }]}>
                SolarCoop
              </Text>
            </View>

            {/* Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                },
              ]}
            >
              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {subtitle}
                </Text>
              ) : null}
              <View style={styles.body}>{children}</View>
            </View>

            {footer}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 340,
  },
  glowOrb: {
    position: 'absolute',
    top: -110,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  glowOrbDark: {
    backgroundColor: PALETTE.sunGlowSoft,
  },
  glowOrbLight: {
    backgroundColor: 'rgba(246, 173, 85, 0.16)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 48,
    paddingBottom: 32,
    gap: 18,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 2,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PALETTE.solarOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  card: {
    borderWidth: 1,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: -8,
  },
  body: {
    gap: 16,
  },
});
