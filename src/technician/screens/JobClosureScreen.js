import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';
import { useTechnician } from '../context/TechnicianContext';

import RepairEvidenceCard from '../components/RepairEvidenceCard';

const MIN_NOTES = 10;

const notify = (title, message) => {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

/** Repair evidence, checklist and notes for an active job. */
export default function JobClosureScreen() {
  const { TECH } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const { t } = useTranslation();
  const { selectedJob: job, closeClosure, toggleChecklistItem, completeJob, uploadRepairPhoto, saveResolutionNotes, pendingWrites } = useTechnician();
  const [notes, setNotes] = useState(job.resolutionNotes ?? '');
  const [savedNotes, setSavedNotes] = useState(job.resolutionNotes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pending = (pendingWrites[job.id] ?? 0) > 0;
  const busy = saving || savingNotes || uploading || pending;
  const notesDirty = notes !== savedNotes;

  // Refresh saved drafts without replacing text that is still being edited.
  useEffect(() => {
    const incoming = job.resolutionNotes ?? '';
    if (incoming === savedNotes) return;
    if (notes === savedNotes) setNotes(incoming);
    setSavedNotes(incoming);
  }, [job.resolutionNotes, notes, savedNotes]);

  const handleSaveNotes = async () => {
    if (busy || !notesDirty) return;
    setSavingNotes(true);
    try {
      const updated = await saveResolutionNotes(job.id, notes);
      setSavedNotes(updated.resolutionNotes ?? '');
      setNotes(updated.resolutionNotes ?? '');
    } catch (err) {
      notify(t('technician.closure.notesErrorTitle'), err?.message || t('technician.closure.errorBody'));
    } finally {
      setSavingNotes(false);
    }
  };

  // Save a draft when leaving the form, including short notes that are not ready for closure.
  const handleBack = useCallback(async () => {
    if (busy) return;
    try {
      if (notesDirty) await saveResolutionNotes(job.id, notes);
      closeClosure();
    } catch (err) {
      notify(t('technician.closure.notesErrorTitle'), err?.message || t('technician.closure.errorBody'));
    }
  }, [busy, notesDirty, notes, job.id, saveResolutionNotes, closeClosure, t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const doneCount = job.checklist.filter(i => i.done).length;
  const notesOk = notes.trim().length >= MIN_NOTES;
  const photosOk = job.repairPhotos.length > 0;

  const handleToggle = async (index) => {
    try {
      await toggleChecklistItem(job.id, index);
    } catch (err) {
      notify(t('technician.alert.saveErrorTitle'), err?.message || t('technician.alert.saveErrorBody'));
    }
  };

  const handleComplete = async () => {
    if (!notesOk || !photosOk || busy) return;
    setSaving(true);
    try {
      await completeJob(job.id, notes);
    } catch (err) {
      notify(t('technician.closure.errorTitle'), err?.message || t('technician.closure.errorBody'));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.back} onPress={handleBack} disabled={busy} hitSlop={10}>
          <ArrowLeft size={13} color={TECH.orange} />
          <Text style={styles.backText} numberOfLines={1}>
            {t('technician.closure.activeJob', { title: job.title })}
          </Text>
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{t('technician.closure.title')}</Text>
          <Text style={styles.subtitle}>{t('technician.closure.subtitle')}</Text>
        </View>

        <RepairEvidenceCard photos={job.repairPhotos} onUpload={asset => uploadRepairPhoto(job.id, asset)}
          onBusyChange={setUploading} disabled={busy} />

        {/* ── Parts & repair checklist ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('technician.closure.checklist')}</Text>
            <Text style={styles.count}>
              {t('technician.closure.checkedCount', { done: doneCount, total: job.checklist.length })}
            </Text>
          </View>
          {job.checklist.map((item, i) => (
            <Pressable
              key={`${item.label}-${i}`}
              style={styles.checkRow}
              onPress={() => handleToggle(i)}
              disabled={busy}
              accessibilityRole="checkbox"
              aria-checked={item.done}
              accessibilityState={{ checked: item.done, disabled: busy }}
            >
              <View style={[styles.box, item.done && styles.boxDone]}>
                {item.done ? <Check size={16} color={TECH.onAccent} strokeWidth={3} /> : null}
              </View>
              <Text style={[styles.checkText, item.done && styles.checkTextDone]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Resolution notes ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('technician.closure.notes')}</Text>
          <TextInput
            style={styles.input}
            value={notes}
            editable={!busy}
            accessibilityLabel={t('technician.closure.notes')}
            onChangeText={setNotes}
            placeholder={t('technician.closure.notesPlaceholder')}
            placeholderTextColor={TECH.textMuted}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <View style={styles.notesFooter}>
            <Text style={styles.hint}>{t(notesDirty ? 'technician.closure.notesUnsaved' : 'technician.closure.notesSaved')}</Text>
            <Pressable onPress={handleSaveNotes} disabled={!notesDirty || busy} accessibilityRole="button"
              style={[styles.saveNotesBtn, (!notesDirty || busy) && styles.btnDisabled]}>
              {savingNotes ? <ActivityIndicator size="small" color={TECH.orange} />
                : <Text style={styles.saveNotesText}>{t('technician.closure.saveNotes')}</Text>}
            </Pressable>
          </View>
          {!notesOk ? (
            <Text style={styles.hint}>{t('technician.closure.notesHint', { min: MIN_NOTES })}</Text>
          ) : null}
        </View>

        {!photosOk && <Text style={styles.hint}>{t('technician.closure.photoRequired')}</Text>}

        <Pressable
          accessibilityRole="button"
          onPress={handleComplete}
          disabled={!notesOk || !photosOk || busy}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <LinearGradient
            colors={[TECH.action, TECH.orangeDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.completeBtn, (!notesOk || !photosOk || busy) && styles.btnDisabled]}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={styles.completeText}>{t('technician.closure.complete')}</Text>}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = TECH => StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 14 },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', maxWidth: '100%' },
  backText: { flexShrink: 1, fontSize: 12, fontWeight: '600', letterSpacing: 0.6, color: TECH.orange, textTransform: 'uppercase' },
  titleBlock: { gap: 4, marginTop: 4 },
  title: { fontSize: 20, fontWeight: '600', color: TECH.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: TECH.textSecondary },
  card: {
    backgroundColor: TECH.card,
    borderWidth: 1,
    borderColor: TECH.border,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, color: TECH.text, textTransform: 'uppercase' },
  count: { fontSize: 11, fontWeight: '700', color: TECH.textSecondary },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, minHeight: 48 },
  box: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: TECH.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: TECH.orange, borderColor: TECH.orange },
  checkText: { flex: 1, fontSize: 14, color: TECH.text },
  checkTextDone: { color: TECH.textSecondary },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: TECH.borderStrong,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: TECH.text,
    backgroundColor: TECH.bg,
    marginTop: 4,
  },
  notesFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  saveNotesBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: TECH.orangeSoft },
  saveNotesText: { fontSize: 12, fontWeight: '700', color: TECH.orange },
  hint: { fontSize: 11, color: TECH.textMuted },
  completeBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: 12, minHeight: 50, marginTop: 4 },
  completeText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.6, color: '#FFFFFF', textTransform: 'uppercase' },
  btnDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
});
