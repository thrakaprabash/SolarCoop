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
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyRound, Mail } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/auth/AuthLayout';
import { AuthField } from '../components/auth/AuthField';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { useTheme } from '../theme/useTheme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordScreen = ({ onBackToLogin }) => {
  const { resetPasswordForEmail, loading } = useAuth();
  const theme = useTheme();
  const { colors } = theme;

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);

    try {
      await resetPasswordForEmail(trimmedEmail);
      setSent(true);
      Alert.alert(
        'Reset link sent ☀️',
        `We've emailed a password reset link to ${trimmedEmail}. ` +
          'Check your inbox (and spam folder) and follow the link to choose a new password.',
        [{ text: 'Back to Login', onPress: onBackToLogin }],
      );
    } catch (err) {
      Alert.alert('Could not send link', err.message);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter the email linked to your SolarCoop account and we'll send you a secure reset link."
      footer={
        <View style={styles.footerRow}>
          <TouchableOpacity
            onPress={onBackToLogin}
            hitSlop={{ top: 10, bottom: 10 }}
            accessibilityRole="link"
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              ← Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      <AuthField
        label="Email Address"
        icon={Mail}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (error) setError(null);
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        error={error}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />

      <PrimaryButton
        label={sent ? 'Link Sent' : 'Send Reset Link'}
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
