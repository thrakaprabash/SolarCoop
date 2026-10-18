import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/useTheme';
import { fetchMemberDetails, saveMemberDetails } from '../../services/memberDetailsService';
import { EMPTY_DETAILS, validateRegistrationDetails } from '../../utils/registrationDetails';
import { showAlert } from '../../utils/alert';
import { RoleDetailsForm } from './RoleDetailsForm';
import { PrimaryButton } from './PrimaryButton';

// Shared by the member's Profile and the administrator's member detail view.
export function MemberDetailsCard({ userId, role, readOnly = false }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { refreshProfile } = useAuth();
  const [record, setRecord] = useState(null);
  const [values, setValues] = useState({ ...EMPTY_DETAILS });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setRecord(null); setValues({ ...EMPTY_DETAILS }); setEditing(false); setLoading(true); setLoadError(false); setErrors({});
    if (!userId || !['owner', 'consumer', 'technician'].includes(role)) { setLoading(false); return () => { active = false; }; }
    fetchMemberDetails(userId, role).then(result => {
      if (active) { setRecord(result); setValues(result.values); }
    }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId, role, retry]);
  if (!userId || !['owner', 'consumer', 'technician'].includes(role)) return null;
  const label = key => t(`auth.details.${key}`);
  const save = async () => {
    if (saving) return;
    const next = validateRegistrationDetails(role, values);
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await saveMemberDetails(role, values);
      setRecord({ complete: true, values: { ...values } }); setEditing(false);
      await refreshProfile();
      showAlert(t('profile.successTitle'), label('saved'));
    } catch (error) { showAlert(t('profile.updateFailedTitle'), error.message); }
    finally { setSaving(false); }
  };
  const keys = role === 'technician' ? ['district', 'specialization', 'experienceYears', 'qualification'] : ['address', 'district', 'city', ...(role === 'owner' ? ['solarCapacity', 'inverterBrand', 'inverterModel', 'inverterCapacity', 'panelCount'] : ['monthlyConsumption'])];
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>{label('profileTitle')}</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : loadError ? <>
      <Text style={{ color: colors.danger }}>{label('loadFailed')}</Text>
      <PrimaryButton label={label('retry')} onPress={() => setRetry(value => value + 1)} variant="secondary" />
    </> : editing ? <>
      <RoleDetailsForm role={role} values={values} errors={errors} disabled={saving} onChange={(key, value) => { setValues(previous => ({ ...previous, [key]: value })); setErrors(previous => ({ ...previous, [key]: undefined })); }} />
      <PrimaryButton label={label('saveDetails')} onPress={save} loading={saving} disabled={saving} />
      <PrimaryButton label={t('common.cancel')} variant="secondary" disabled={saving} onPress={() => { setValues(record.values); setEditing(false); setErrors({}); }} />
    </> : <>
      {!record?.complete && <Text style={{ color: colors.textSecondary }}>{label('missingDetails')}</Text>}
      {keys.filter(key => values[key] !== '').map(key => <View key={key} style={styles.row}>
        <Text style={{ color: colors.textSecondary, flex: 1 }}>{label(key === 'district' && role === 'technician' ? 'serviceDistrict' : key)}</Text>
        <Text selectable style={{ color: colors.text, flex: 1, textAlign: 'right' }}>{key === 'specialization' ? label(values[key]) : ['Other', 'Unknown'].includes(values[key]) ? label(values[key].toLowerCase()) : values[key]}</Text>
      </View>)}
      {!readOnly && <PrimaryButton label={label('editDetails')} variant="secondary" onPress={() => setEditing(true)} />}
    </>}
  </View>;
}
const styles = StyleSheet.create({ card: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 16 }, row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 } });
