/**
 * src/screens/RegistrationScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SOL-90: Backend Integration — Member Registration
 *
 * Progressive 2-step disclosure flow with smooth sliding transitions
 * (React Native `Animated` API):
 *
 *   STEP 1 of 2 — Basic Credentials
 *     Full Name, Email, Password (eye toggle) and Mobile Number (numeric
 *     phone pad with validation) + animated "Continue ➔" CTA.
 *
 *   STEP 2 of 2 — Role Customization
 *     Segmented control bar: CONSUMER / SOLAR OWNER / TECHNICIAN.
 *     Selecting "SOLAR OWNER" slides the Solar Capacity (kW) field in with a
 *     sun icon; the field stays hidden for the other roles.
 *     "◀ BACK" (secondary) + "COMPLETE REGISTRATION" (primary highlighted).
 *
 * On submit the details are sent through AuthContext `signUp`, which passes
 * them as raw user metadata for the `auth.users → public.profiles` trigger.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Lock,
  Mail,
  Phone,
  Sun,
  User,
  Wrench,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alert';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { useTheme } from '../theme/useTheme';

const ROLES = [
  { id: 'consumer', label: 'CONSUMER', Icon: Home },
  { id: 'owner', label: 'SOLAR OWNER', Icon: Sun },
  { id: 'technician', label: 'TECHNICIAN', Icon: Wrench },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SEGMENT_GAP = 6;

export const RegistrationScreen = ({ onBackToLogin, onSuccess, navigation }) => {
  const { signUp } = useAuth();
  const theme = useTheme();
  const { colors } = theme;

  const { width: windowWidth } = useWindowDimensions();

  // ── Form state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('consumer');
  const [solarCapacity, setSolarCapacity] = useState('');
  const [errors, setErrors] = useState({});

  // ── Submission state ────────────────────────────────────────────────────
  // Local busy flag: keeps the CTA disabled + spinner visible while the
  // network request is in flight and prevents double submissions.
  const [loading, setLoading] = useState(false);

  // ── Step-slide animation ────────────────────────────────────────────────
  const [trackWidth, setTrackWidth] = useState(
    Math.max(windowWidth - 88, 0), // scroll padding (40) + card padding (48)
  );
  const trackOffset = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.5)).current;

  const goToStep = (target) => {
    if (target === step) return;
    setStep(target);
    Animated.timing(trackOffset, {
      toValue: target === 2 ? -trackWidth : 0,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(progressAnim, {
      toValue: target === 2 ? 1 : 0.5,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  // ── Role segmented-control sliding pill ─────────────────────────────────
  const [segWidth, setSegWidth] = useState(0);
  const segPillAnim = useRef(new Animated.Value(0)).current;
  const activeSegIndex = Math.max(
    0,
    ROLES.findIndex((r) => r.id === role),
  );
  const segItemWidth = segWidth > 0 ? (segWidth - SEGMENT_GAP * 2) / 3 : 0;

  useEffect(() => {
    Animated.timing(segPillAnim, {
      toValue: activeSegIndex,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeSegIndex, segPillAnim]);

  // ── Conditional capacity slide-down (SOLAR OWNER only) ──────────────────
  const capacityAnim = useRef(new Animated.Value(0)).current;
  const capacityHeightAnim = useRef(new Animated.Value(0)).current;
  const capacityMeasured = useRef(0);

  useEffect(() => {
    const open = role === 'owner';
    Animated.parallel([
      Animated.timing(capacityAnim, {
        toValue: open ? 1 : 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(capacityHeightAnim, {
        toValue: open ? capacityMeasured.current : 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [role, capacityAnim, capacityHeightAnim]);

  const handleCapacityLayout = (event) => {
    capacityMeasured.current = event.nativeEvent.layout.height;
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const next = {};
    if (!name.trim()) next.name = 'Please enter your full name.';
    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = 'Please enter a valid email address.';
    }
    if (!password) {
      next.password = 'Password is required.';
    } else if (password.length < 6) {
      next.password = 'Password must be at least 6 characters.';
    }
    const digits = mobile.replace(/\D/g, '');
    if (!mobile.trim()) {
      next.mobile = 'Mobile number is required.';
    } else if (digits.length < 9 || digits.length > 12) {
      next.mobile = 'Enter a valid mobile number (9–12 digits).';
    }
    return next;
  };

  const validateStep2 = () => {
    const next = {};
    if (role === 'owner') {
      const capacity = parseFloat(solarCapacity);
      if (!solarCapacity.trim()) {
        next.solarCapacity = 'Enter your solar capacity.';
      } else if (Number.isNaN(capacity) || capacity <= 0) {
        next.solarCapacity = 'Enter a valid capacity in kW (e.g. 5.6).';
      }
    }
    return next;
  };

  const failWith = (next) => {
    setErrors(next);
    const messages = Object.values(next).filter(Boolean);
    if (messages.length > 0) {
      showAlert('Check your details', messages.join('\n'));
    }
  };

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleContinue = () => {
    if (loading) return; // block navigation while a request is in flight
    const next = validateStep1();
    if (Object.keys(next).length > 0) {
      failWith(next);
      return;
    }
    setErrors({});
    goToStep(2);
  };

  const handleBack = () => {
    if (loading) return; // block navigation while a request is in flight
    setErrors({});
    goToStep(1);
  };

  const handleComplete = async () => {
    if (loading) return; // prevent double submissions

    const next = validateStep2();
    if (Object.keys(next).length > 0) {
      failWith(next);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, {
        name: name.trim(),
        role,
        mobileNumber: mobile.trim(),
        solarCapacity: role === 'owner' ? parseFloat(solarCapacity) : null,
      });

      // Surface the exact Supabase error (e.g. "User already registered",
      // "This mobile number is already registered.") instead of failing
      // silently.
      if (result.error) {
        showAlert(
          'Registration Failed',
          result.error.message || 'An unknown error occurred. Please try again.',
        );
        return;
      }

      showAlert(
        'Success!',
        'Your account has been created successfully. Please check your inbox if email verification is required.',
        [
          {
            text: 'OK',
            onPress: () => {
              // react-navigation compatibility — this shell routes via
              // callbacks, so fall back to them when no navigator exists.
              if (navigation?.navigate) {
                navigation.navigate('Login');
                return;
              }
              (onSuccess ?? onBackToLogin)?.();
            },
          },
        ],
      );
    } catch (error) {
      // Defensive: AuthContext returns { data, error } and never throws, but
      // an unexpected crash here must still surface to the user.
      showAlert(
        'Registration Failed',
        error?.message || 'An unknown error occurred. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join SolarCoop and manage shared clean energy with your community."
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already a member?
          </Text>
          <PrimaryButton
            label="Login"
            variant="secondary"
            onPress={onBackToLogin}
            style={styles.footerButton}
          />
        </View>
      }
    >
      {/* Step indicator */}
      <View style={styles.stepHeader}>
        <Text style={[styles.stepText, { color: colors.textSecondary }]}>
          Step {step} of 2
        </Text>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.track }]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Sliding step track */}
      <View
        style={styles.viewport}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[
            styles.track,
            {
              width: trackWidth * 2,
              transform: [{ translateX: trackOffset }],
            },
          ]}
        >
          {/* STEP 1 — Basic credentials */}
          <View style={[styles.stepColumn, { width: trackWidth }]}>
            <AuthField
              label="Full Name"
              icon={User}
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearError('name');
              }}
              placeholder="e.g. Amara Perera"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              error={errors.name}
            />

            <AuthField
              label="Email Address"
              icon={Mail}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              error={errors.email}
            />

            <AuthField
              label="Password"
              icon={Lock}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearError('password');
              }}
              placeholder="Minimum 6 characters"
              secureTextEntry
              autoComplete="password-new"
              textContentType="newPassword"
              error={errors.password}
            />

            <AuthField
              label="Mobile Number"
              icon={Phone}
              value={mobile}
              onChangeText={(text) => {
                setMobile(text);
                clearError('mobile');
              }}
              placeholder="e.g. +94 77 123 4567"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={errors.mobile}
            />

            <PrimaryButton
              label="Continue"
              icon={ArrowRight}
              onPress={handleContinue}
              disabled={loading}
            />
          </View>

          {/* STEP 2 — Role customization */}
          <View style={[styles.stepColumn, { width: trackWidth }]}>
            <Text style={[styles.roleLabel, { color: colors.textSecondary }]}>
              I am joining as
            </Text>

            {/* Segmented role control */}
            <View
              style={[
                styles.segmentBar,
                { backgroundColor: colors.track, borderColor: colors.border },
              ]}
              onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.segmentPill,
                  {
                    width: segItemWidth,
                    backgroundColor: colors.primary,
                    transform: [
                      {
                        translateX: segPillAnim.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [
                            0,
                            segItemWidth + SEGMENT_GAP,
                            (segItemWidth + SEGMENT_GAP) * 2,
                          ],
                        }),
                      },
                    ],
                  },
                ]}
              />
              {ROLES.map(({ id, label, Icon }) => {
                const isActive = role === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.segmentItem}
                    onPress={() => setRole(id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Icon
                      size={16}
                      color={isActive ? '#FFFFFF' : colors.textSecondary}
                      strokeWidth={isActive ? 2.4 : 1.8}
                    />
                    <Text
                      style={[
                        styles.segmentLabel,
                        {
                          color: isActive ? '#FFFFFF' : colors.textSecondary,
                          fontWeight: isActive ? '800' : '600',
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Conditional solar capacity (SOLAR OWNER only) */}
            <Animated.View
              style={[
                styles.capacityWrap,
                {
                  height: capacityHeightAnim,
                  opacity: capacityAnim,
                },
              ]}
            >
              <View onLayout={handleCapacityLayout}>
                <AuthField
                  label="Solar Capacity (kW)"
                  icon={Sun}
                  value={solarCapacity}
                  onChangeText={(text) => {
                    setSolarCapacity(text);
                    clearError('solarCapacity');
                  }}
                  placeholder="e.g. 5.6"
                  keyboardType="decimal-pad"
                  error={errors.solarCapacity}
                />
              </View>
            </Animated.View>

            {/* Action row */}
            <View style={styles.actionRow}>
              <PrimaryButton
                label="Back"
                variant="secondary"
                icon={ArrowLeft}
                onPress={handleBack}
                disabled={loading}
                style={styles.backButton}
              />
              <PrimaryButton
                label="Complete Registration"
                onPress={handleComplete}
                loading={loading}
                disabled={loading}
                style={styles.completeButton}
                labelStyle={styles.completeLabel}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    width: 74,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  viewport: {
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
  },
  stepColumn: {
    gap: 16,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  segmentBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    position: 'relative',
  },
  segmentPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 10,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    zIndex: 1,
  },
  segmentLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
  },
  capacityWrap: {
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  backButton: {
    flex: 1,
  },
  completeButton: {
    flex: 1.7,
  },
  completeLabel: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    fontSize: 13,
  },
  footerButton: {
    minWidth: 90,
  },
});
