import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Sun } from 'lucide-react-native';
import { useTechnicianTheme, useTechStyles } from '../TechnicianTheme';
import { useTechnician } from '../context/TechnicianContext';

export default function TechHeader({ onSettings }) {
  const { t } = useTranslation();
  const { TECH } = useTechnicianTheme();
  const styles = useTechStyles(createStyles);
  const { connectionStatus } = useTechnician();
  const connection = {
    connected: { label: 'live', color: TECH.green },
    connecting: { label: 'syncing', color: TECH.amber },
    offline: { label: 'offline', color: TECH.red },
  }[connectionStatus] ?? { label: 'syncing', color: TECH.amber };
  return <View style={styles.header}>
    <View style={styles.brand}>
      <View style={styles.logo}><Sun size={23} color={TECH.orange} strokeWidth={2} /></View>
      <View><Text style={styles.appName}>SolarCoop</Text><Text style={styles.subTitle}>{t('technician.design.fieldService')}</Text></View>
    </View>
    <View style={styles.actions}>
      <View style={styles.connection}><View style={[styles.dot, { backgroundColor: connection.color }]} /><Text style={styles.connectionText}>{t(`technician.design.${connection.label}`)}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={t('technician.design.settings')} onPress={onSettings}
        style={({ pressed }) => [styles.settings, pressed && { backgroundColor: TECH.cardRaised }]}>
        <SlidersHorizontal size={21} color={TECH.text} />
      </Pressable>
    </View>
  </View>;
}
const createStyles = TECH => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderColor: TECH.border, backgroundColor: TECH.bg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  logo: { width:38,height:38,borderRadius:12,backgroundColor:TECH.orangeSoft,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:TECH.orangeBorder },
  appName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.4, color: TECH.text },
  subTitle: { fontSize: 11, color: TECH.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  connection: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  connectionText: { fontSize: 11, color: TECH.textSecondary },
  settings: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
