import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react-native';

const COMPLAINT_TYPES = [
  'Transaction Error',
  'Billing Dispute',
  'System Fault',
  'Other',
];

export const SubmitComplaintScreen = ({ onBack, onSubmit }) => {
  const [type, setType] = useState(COMPLAINT_TYPES[0]);
  const [transaction, setTransaction] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isValid = description.trim().length >= 20;

  const handleSubmit = () => {
    if (!isValid) return;
    
    setIsSubmitting(true);
    
    // Simulate network delay
    setTimeout(() => {
      const newComplaint = {
        id: `c${Date.now()}`,
        complainant: 'Vihanga Perera', // Hardcoded mock user for now
        household: 'House #01',
        memberId: 'm1',
        type,
        description: description.trim(),
        relatedTransaction: transaction.trim() || null,
        relatedAmount: null,
        status: 'Open',
        resolutionNote: '',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Navigate back after showing success message briefly
      setTimeout(() => {
        onSubmit(newComplaint);
      }, 1500);
    }, 800);
  };

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCircle}>
          <Send size={32} color={COLORS.tealLight} />
        </View>
        <Text style={styles.successTitle}>Complaint Submitted</Text>
        <Text style={styles.successText}>
          Your issue has been forwarded to the cooperative administration. You can track its status in the My Complaints list.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit a Complaint</Text>
        <View style={{ width: 40 }} /> {/* balance for flex layout */}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={[GLASS.card, styles.infoCard]}>
          <AlertCircle size={20} color={COLORS.amberLight} />
          <Text style={styles.infoText}>
            Please provide accurate details so administrators can investigate and resolve your issue efficiently.
          </Text>
        </View>

        {/* Type Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>COMPLAINT TYPE</Text>
          <View style={styles.chipRow}>
            {COMPLAINT_TYPES.map(t => {
              const active = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setType(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Optional Transaction ID */}
        <View style={styles.section}>
          <Text style={styles.label}>RELATED TRANSACTION (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. TXN-0042"
            placeholderTextColor={COLORS.textMuted}
            value={transaction}
            onChangeText={setTransaction}
            autoCapitalize="characters"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>DESCRIPTION *</Text>
            <Text style={[styles.charCount, !isValid && description.length > 0 && { color: COLORS.red }]}>
              {description.length} / 500
            </Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe the issue clearly..."
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.helperText}>Minimum 20 characters required.</Text>
        </View>

        <View style={{ height: 24 }} />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={[styles.submitBtnText, !isValid && styles.submitBtnTextDisabled]}>
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textBright },
  
  content: { padding: 16, gap: 24 },

  infoCard: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 19, fontWeight: '500' },

  section: { gap: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
  charCount: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  helperText: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: 'rgba(245,158,11,0.4)',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  chipTextActive: { color: COLORS.amberLight, fontWeight: '700' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },

  submitBtn: {
    backgroundColor: COLORS.teal,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: { color: '#000000', fontSize: 15, fontWeight: '800' },
  submitBtnTextDisabled: { color: COLORS.textMuted },

  // Success view
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textBright },
  successText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
});
