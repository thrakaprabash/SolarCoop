import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { colors, radius, weight } from '../../theme';

/** tone: 'teal' (approve) | 'danger' (reject) */
export default function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'teal',
  onConfirm,
  onCancel,
}) {
  const teal = tone === 'teal';

  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancel, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: teal ? colors.teal : colors.danger },
                pressed && { opacity: 0.85 },
              ]}
            >
              {teal ? <Check size={15} color={colors.text} strokeWidth={2.4} /> : null}
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
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
  cancel: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  cancelLabel: { color: colors.textStrong, fontSize: 13, fontWeight: weight.bold },
  confirmLabel: { color: colors.text, fontSize: 13, fontWeight: weight.bold },
});
