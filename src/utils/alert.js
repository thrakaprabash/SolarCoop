/**
 * src/utils/alert.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Cross-platform alert helpers for the SolarCoop app.
 *
 * React Native's `Alert` is a NO-OP on react-native-web, so any `Alert.alert`
 * call silently does nothing on Expo Web. That made validation errors, login
 * errors and the logout confirmation invisible in the browser. These helpers
 * detect the platform and fall back to the browser's native `window.alert` /
 * `window.confirm` on web, while keeping the familiar native `Alert` on iOS /
 * Android.
 *
 * Usage:
 *   showAlert('Registration Failed', error.message);
 *   showAlert('Success!', 'Account created.', [{ text: 'OK', onPress: fn }]);
 *   showConfirm('Logout', 'Are you sure?', {
 *     confirmText: 'Log Out',
 *     cancelText: 'Cancel',
 *     destructive: true,
 *     onConfirm: () => signOut(),
 *   });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Alert, Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';

/** Join a title and message into the single string the web fallbacks need. */
const formatMessage = (title, message) => {
  if (!title) return message || '';
  if (!message) return title;
  return `${title}\n\n${message}`;
};

/**
 * Show an informational / error / success alert.
 *
 * @param {string} title
 * @param {string} [message]
 * @param {Array<{ text: string, style?: string, onPress?: () => void }>} [buttons]
 */
export const showAlert = (title, message, buttons) => {
  if (IS_WEB) {
    window.alert(formatMessage(title, message));
    // Honor the first actionable button (e.g. an "OK" that navigates to the
    // Login screen) once the user dismisses the browser alert.
    const action = (buttons || []).find((button) => button.style !== 'cancel');
    action?.onPress?.();
    return;
  }

  Alert.alert(title, message, buttons);
};

/**
 * Show a confirmation dialog with a cancel + confirm action.
 *
 * @param {string} title
 * @param {string} [message]
 * @param {object} [options]
 * @param {string} [options.confirmText='OK']
 * @param {string} [options.cancelText='Cancel']
 * @param {boolean} [options.destructive=false]
 * @param {() => void} [options.onConfirm]
 * @param {() => void} [options.onCancel]
 */
export const showConfirm = (
  title,
  message,
  {
    confirmText = 'OK',
    cancelText = 'Cancel',
    destructive = false,
    onConfirm,
    onCancel,
  } = {},
) => {
  if (IS_WEB) {
    const confirmed = window.confirm(formatMessage(title, message));
    if (confirmed) onConfirm?.();
    else onCancel?.();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
};
