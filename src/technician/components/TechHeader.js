import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sun } from 'lucide-react-native';
import { TECH } from '../theme';
import { useTechnician } from '../context/TechnicianContext';

// The pill mirrors whether the last job fetch actually reached the backend,
// so "API Connected" is never shown while the list is stale or failing.
const PILL = {
  connected:  { key: 'technician.header.apiConnected',  color: TECH.green, bg: TECH.greenSoft,  border: TECH.greenBorder },
  connecting: { key: 'technician.header.apiConnecting', color: TECH.amber, bg: TECH.amberSoft,  border: 'rgba(245,185,66,0.45)' },
  offline:    { key: 'technician.header.apiOffline',    color: TECH.red,   bg: TECH.redSoft,    border: TECH.redBorder },
};

export default function TechHeader() {
  const { t } = useTranslation();
  const { connectionStatus } = useTechnician();
  const pill = PILL[connectionStatus] ?? PILL.connecting;

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Sun size={18} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <View>
          <Text style={styles.appName}>{t('technician.header.appName')}</Text>
          <Text style={styles.subTitle}>{t('technician.header.subtitle')}</Text>
        </View>
      </View>

      <View style={[styles.pill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
        <View style={[styles.dot, { backgroundColor: pill.color }]} />
        <Text style={[styles.pillText, { color: pill.color }]}>{t(pill.key)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: TECH.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { fontSize: 15, fontWeight: '800', color: TECH.text, letterSpacing: -0.2 },
  subTitle: { fontSize: 10, fontWeight: '500', color: TECH.textSecondary, marginTop: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
});
