/**
 * src/screens/ForgotPasswordScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SOL-91 (flow): Password Recovery
 *
 * Simple, beautifully themed email input that triggers Supabase's password
 * recovery workflow (`resetPasswordForEmail`). On confirmation it shows a
 * styled success alert and returns the member to the Login screen.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyRound, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { showAlert } from '../utils/alert';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { useTheme } from '../theme/useTheme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordScreen = ({ onBackToLogin }) => {
  const { t } = useTranslation();
  const { resetPasswordForEmail, loading } = useAuth();
  const theme = useTheme();
  const { colors } = theme;

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(t('auth.field.emailRequired'));
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError(t('auth.field.emailInvalid'));
      return;
    }
    setError(null);

    try {
      await resetPasswordForEmail(trimmedEmail);
      setSent(true);
      showAlert(
        t('auth.forgotPassword.sentTitle'),
        t('auth.forgotPassword.sentMessage', { email: trimmedEmail }),
        [{ text: t('auth.forgotPassword.backToLoginAction'), onPress: onBackToLogin }],
      );
    } catch (err) {
      showAlert(t('auth.forgotPassword.sendFailedTitle'), err.message);
    }
  };

  return (
    <AuthLayout
      title={t('auth.forgotPassword.title')}
      subtitle={t('auth.forgotPassword.subtitle')}
      footer={
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={onBackToLogin}
            hitSlop={{ top: 10, bottom: 10 }}
            accessibilityRole="link"
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              {t('auth.forgotPassword.backToLoginLink')}
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
          if (error) setError(null);
        }}
        placeholder={t('auth.register.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={error}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <PrimaryButton
        label={sent ? t('auth.forgotPassword.linkSent') : t('auth.forgotPassword.sendButton')}
        icon={KeyRound}
        onPress={handleSubmit}
        loading={loading}
        disabled={loading || sent}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
