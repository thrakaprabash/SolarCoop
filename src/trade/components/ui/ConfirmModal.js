import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, weight } from '../../theme';

/** tone: 'teal' (approve) | 'danger' (reject) */
export default function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  tone = 'teal',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();
  const teal = tone === 'teal';
  const resolvedConfirmLabel = confirmLabel || t('common.confirm');
  const resolvedCancelLabel = cancelLabel || t('common.cancel');

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={() => { if (!busy) onCancel?.(); }}
    >
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={busy ? undefined : onCancel}
              style={({ pressed }) => [styles.button, styles.cancel, busy && styles.busy, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.cancelLabel}>{resolvedCancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={busy ? undefined : onConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: teal ? colors.teal : colors.danger },
                busy && styles.busy,
                pressed && { opacity: 0.85 },
              ]}
            >
              {busy ? <ActivityIndicator size="small" color={colors.text} /> : teal ? <Check size={15} color={colors.text} strokeWidth={2.4} /> : null}
              <Text style={styles.confirmLabel}>{busy ? t('common.working') : resolvedConfirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(5,8,22,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    backgroundColor: '#111737',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 20,
    gap: 14,
  },
  title: { fontSize: 17, fontWeight: weight.heavy, color: colors.text },
  body: { fontSize: 13, lineHeight: 20, color: colors.textMuted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 13,
    borderRadius: radius.lg,
  },
  busy: { opacity: 0.6 },
  cancel: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  cancelLabel: { color: colors.textStrong, fontSize: 13, fontWeight: weight.bold },
  confirmLabel: { color: colors.text, fontSize: 13, fontWeight: weight.bold },
});
