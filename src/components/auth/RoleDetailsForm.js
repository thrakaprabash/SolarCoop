import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, MapPin, Sun, Wrench } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { AuthField } from './AuthField';
import { useTheme } from '../../theme/useTheme';
import { DISTRICTS, INVERTER_BRANDS, SPECIALIZATIONS } from '../../utils/registrationDetails';

function Choice({ label, value, options, onChange, error, disabled }) {
  const [open, setOpen] = useState(false);
  const { colors } = useTheme();
  const { t } = useTranslation();
  return <View style={styles.field}>
    <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 12 }}>{label}</Text>
    <TouchableOpacity disabled={disabled} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open, disabled }} onPress={() => setOpen(true)} style={[styles.choice, { borderColor: error ? colors.danger : colors.border, backgroundColor: colors.inputBg }]}>
      <Text style={{ color: value ? colors.text : colors.textMuted, flex: 1 }}>{options.find(option => option.value === value)?.label || t('auth.details.select')}</Text>
      <ChevronDown size={18} color={colors.textSecondary} />
    </TouchableOpacity>
    {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={[styles.dialog, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>{label}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            {options.map(option => <TouchableOpacity key={option.value} accessibilityRole="radio" accessibilityState={{ checked: value === option.value }} onPress={() => { onChange(option.value); setOpen(false); }} style={[styles.option, { borderBottomColor: colors.border }]}>
              <Text style={{ color: value === option.value ? colors.primary : colors.text }}>{option.label}</Text>
            </TouchableOpacity>)}
          </ScrollView>
          <TouchableOpacity accessibilityRole="button" onPress={() => setOpen(false)} style={styles.option}><Text style={{ color: colors.primary }}>{t('common.cancel')}</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  </View>;
}

export function RoleDetailsForm({ role, values, onChange, errors = {}, disabled = false }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const label = key => t(`auth.details.${key}`);
  const error = key => errors[key] ? label(errors[key]) : undefined;
  const field = (key, numeric = false, optional = false) => <AuthField key={key} label={`${label(key)}${optional ? ` (${label('optional')})` : ' *'}`} icon={numeric ? Sun : role === 'technician' ? Wrench : MapPin} value={String(values[key] ?? '')} onChangeText={value => onChange(key, value)} error={error(key)} editable={!disabled} keyboardType={numeric ? ['panelCount', 'experienceYears'].includes(key) ? 'number-pad' : 'decimal-pad' : 'default'} autoCapitalize={numeric ? 'none' : 'words'} />;
  return <View style={styles.form}>
    <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>{label(`${role}Hint`)}</Text>
    {role !== 'technician' && field('address')}
    <Choice label={`${label(role === 'technician' ? 'serviceDistrict' : 'district')} *`} value={values.district} options={DISTRICTS.map(value => ({ value, label: value }))} onChange={value => onChange('district', value)} error={error('district')} disabled={disabled} />
    {role !== 'technician' && field('city')}
    {role === 'owner' && field('solarCapacity', true)}
    {role === 'consumer' && field('monthlyConsumption', true, true)}
    {role === 'technician' && <>
      <Choice label={`${label('specialization')} *`} value={values.specialization} options={SPECIALIZATIONS.map(value => ({ value, label: label(value) }))} onChange={value => onChange('specialization', value)} error={error('specialization')} disabled={disabled} />
      {field('experienceYears', true, true)}
      {field('qualification', false, true)}
    </>}
    {role === 'owner' && <>
      <TouchableOpacity disabled={disabled} accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={styles.choice}>
        <Text style={{ color: colors.primary, flex: 1 }}>{label('additionalSystemDetails')}</Text><ChevronDown size={18} color={colors.primary} />
      </TouchableOpacity>
      {(expanded || ['inverterBrand', 'inverterCapacity', 'panelCount', 'inverterModel'].some(key => errors[key])) && <>
        <Choice label={`${label('inverterBrand')} (${label('optional')})`} value={values.inverterBrand} options={INVERTER_BRANDS.map(value => ({ value, label: ['Other', 'Unknown'].includes(value) ? label(value.toLowerCase()) : value }))} onChange={value => onChange('inverterBrand', value)} error={error('inverterBrand')} disabled={disabled} />
        {field('inverterModel', false, true)}{field('inverterCapacity', true, true)}{field('panelCount', true, true)}
      </>}
    </>}
    <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>{label('privacyHint')}</Text>
  </View>;
}

const styles = StyleSheet.create({ form: { gap: 16 }, field: { gap: 6 }, choice: { minHeight: 52, borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }, overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }, dialog: { maxHeight: '80%', borderRadius: 18, padding: 20, gap: 12 }, option: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth } });
