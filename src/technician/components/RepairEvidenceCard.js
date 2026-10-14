import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus } from 'lucide-react-native';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';
import { getRepairPhotoUrl } from '../services/repairPhotoService';

export default function RepairEvidenceCard({ photos, onUpload, onBusyChange, disabled = false, readOnly = false }) {
  const { TECH } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [urls, setUrls] = useState({});
  const [previewError, setPreviewError] = useState(false);
  const [retry, setRetry] = useState(0);
  const busy = useRef(false);
  const paths = JSON.stringify(photos.map(photo => photo.path));

  useEffect(() => {
    let cancelled = false;
    setPreviewError(false);
    Promise.all(JSON.parse(paths).map(async path => [path, await getRepairPhotoUrl(path)]))
      .then(entries => { if (!cancelled) setUrls(Object.fromEntries(entries)); })
      .catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [paths, retry]);

  const choosePhoto = async (camera) => {
    if (busy.current || disabled || readOnly) return;
    setError(null);
    let ownsUpload = false;
    try {
      if (camera && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(t('technician.closure.cameraPermission'));
          return;
        }
      }
      // On web, launch from the click itself so the browser permits its file picker.
      const options = { mediaTypes: ['images'], quality: 1, allowsEditing: false };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.[0] || busy.current) return;
      ownsUpload = true;
      busy.current = true;
      setUploading(true);
      onBusyChange?.(true);
      await onUpload(result.assets[0]);
    } catch (err) {
      setError(err?.message || t('technician.closure.photoError'));
    } finally {
      if (ownsUpload) {
        busy.current = false;
        setUploading(false);
        onBusyChange?.(false);
      }
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('technician.closure.evidence')}</Text>
      <Text style={styles.hint}>{t('technician.closure.photoHint')}</Text>
      {!readOnly && (
        <View style={styles.actions}>
          {[{ camera: true, Icon: Camera, label: 'takePhoto' }, { camera: false, Icon: ImagePlus, label: 'choosePhoto' }].map(({ camera, Icon, label }) => (
            <Pressable key={label} onPress={() => choosePhoto(camera)}
              disabled={disabled || uploading} accessibilityRole="button"
              style={[styles.action, (disabled || uploading) && styles.disabled]}>
              <Icon size={18} color={TECH.orange} />
              <Text style={styles.actionText}>{t(`technician.closure.${label}`)}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {uploading && <View style={styles.progress}><ActivityIndicator color={TECH.orange} /><Text style={styles.hint}>{t('technician.closure.uploadingPhoto')}</Text></View>}
      {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      {photos.length === 0 && <Text style={styles.hint}>{t('technician.closure.noPhotos')}</Text>}
      {photos.map((photo, index) => (
        <View key={photo.path} style={styles.photo}>
          {urls[photo.path] ? <Image source={{ uri: urls[photo.path] }} style={styles.preview}
            accessibilityLabel={t('technician.closure.photoNumber', { number: index + 1 })}
            onError={() => setPreviewError(true)} /> : null}
          <Text style={styles.hint}>{t('technician.closure.photoSaved', { date: new Date(photo.uploadedAt).toLocaleString() })}</Text>
        </View>
      ))}
      {previewError && <Pressable onPress={() => setRetry(value => value + 1)} style={styles.action} accessibilityRole="button">
        <Text style={styles.actionText}>{t('technician.closure.retryPhotos')}</Text>
      </Pressable>}
    </View>
  );
}

const createStyles = TECH => StyleSheet.create({
  card: { backgroundColor: TECH.card, borderWidth: 1, borderColor: TECH.border, borderRadius: 14, padding: 14, gap: 10 },
  title: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7, color: TECH.text, textTransform: 'uppercase' },
  hint: { fontSize: 13, lineHeight: 20, color: TECH.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { flex: 1, minWidth: 120, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderStyle: 'dashed', borderColor: TECH.orangeBorder, borderRadius: 10, backgroundColor: TECH.orangeSoft, padding: 10 },
  actionText: { fontSize: 12, fontWeight: '700', color: TECH.orange },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preview: { width: '100%', height: 180, borderRadius: 10, backgroundColor: TECH.cardRaised, resizeMode: 'contain' },
  photo: { gap: 6 },
  error: { color: TECH.red, fontSize: 12, lineHeight: 18 },
  disabled: { opacity: 0.45 },
});
