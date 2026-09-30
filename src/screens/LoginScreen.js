/**
 * src/screens/LoginScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SOL-91: Backend Integration — User Login
 *
 * Solar Amber & Orange themed email/password form:
 *   • Email + Password fields with show/hide eye toggle.
 *   • Inline validation (empty inputs, valid email format).
 *   • "Remember me" toggle backed by AsyncStorage (session persistence).
 *   • "Forgot Password?" link → ForgotPasswordScreen.
 *   • "Login" CTA with an active loading spinner.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mail, Lock, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alert';
import { getRememberMe, setRememberMe as persistRememberMe } from '../lib/supabase';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { useTheme } from '../theme/useTheme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen = ({ onCreateAccount, onForgotPassword }) => {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const theme = useTheme();
  const { colors } = theme;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  // Local busy flag: keeps the Login button disabled + spinner visible while
  // the request is in flight and prevents double submissions.
  const [loading, setLoading] = useState(false);

  // Animated check mark for the "Remember me" toggle.
  const checkAnim = React.useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: rememberMe ? 1 : 0,
      speed: 30,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [rememberMe, checkAnim]);

  // Hydrate the stored preference on mount.
  useEffect(() => {
    getRememberMe().then(setRememberMe);
  }, []);

  const toggleRememberMe = (next) => {
    setRememberMe(next);
    persistRememberMe(next);
  };

  const handleSubmit = async () => {
    if (loading) return; // prevent double submissions

    const trimmedEmail = email.trim();
    const nextErrors = {};

    if (!trimmedEmail) {
      nextErrors.email = t('auth.field.emailRequired');
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = t('auth.field.emailInvalid');
    }
    if (!password) {
      nextErrors.password = t('auth.field.passwordRequired');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showAlert(
        t('auth.checkDetailsTitle'),
        Object.values(nextErrors).join('\n'),
      );
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(trimmedEmail, password);

      // Show the exact Supabase error (e.g. "Email not confirmed",
      // "Invalid login credentials") instead of failing silently.
      if (result.error) {
        showAlert(
          t('auth.login.failedTitle'),
          result.error.message || t('auth.genericError'),
        );
        return;
      }

      // On success the AuthProvider sets `session`/`user`, which the app
      // shell uses to move past the auth gate — no manual navigation here.
    } catch (error) {
      showAlert(
        t('auth.login.failedTitle'),
        error?.message || t('auth.genericError'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {t('auth.login.newToApp')}
          </Text>
          <TouchableOpacity
            onPress={onCreateAccount}
            hitSlop={{ top: 10, bottom: 10 }}
            accessibilityRole="link"
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              {t('auth.register.title')}
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <AuthField
        label={t('auth.field.emailLabel')}
        icon={Mail}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        placeholder={t('auth.login.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={errors.email}
        returnKeyType="next"
      />

      <AuthField
        label={t('auth.field.passwordLabel')}
        icon={Lock}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) {
            setErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        placeholder={t('auth.login.passwordPlaceholder')}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        error={errors.password}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      {/* Remember me + Forgot password */}
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => toggleRememberMe(!rememberMe)}
          hitSlop={{ top: 10, bottom: 10 }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
        >
          <Animated.View
            style={[
              styles.checkbox,
              {
                borderColor: rememberMe ? colors.primary : colors.inputBorder,
                backgroundColor: rememberMe ? colors.primary : colors.inputBg,
                transform: [
                  {
                    scale: checkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Animated.View
              style={{
                opacity: checkAnim,
                transform: [{ scale: checkAnim }],
              }}
            >
              <Check size={13} color="#FFFFFF" strokeWidth={3.5} />
            </Animated.View>
          </Animated.View>
          <Text style={[styles.rememberLabel, { color: colors.textSecondary }]}>
            {t('auth.login.rememberMe')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onForgotPassword}
          hitSlop={{ top: 10, bottom: 10 }}
          accessibilityRole="link"
        >
          <Text style={[styles.forgotLink, { color: colors.primary }]}>
            {t('auth.login.forgotPassword')}
          </Text>
        </TouchableOpacity>
      </View>

      <PrimaryButton
        label={t('auth.login.submitButton')}
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
