import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { Bell, AlertTriangle, MessageSquare, ShieldAlert, CheckCircle2, Clock } from 'lucide-react-native';

export const AlertsSupportPlaceholder = () => {
  const { isDarkMode } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const moduleFeatures = [
    { title: 'Grid Alerts & Incident Monitoring', desc: 'Real-time solar panel and battery fault detection alerts', status: 'Ready for Integration' },
    { title: 'Complaint Submission Form', desc: 'Report energy billing discrepancies or inverter hardware issues', status: 'Ready for Integration' },
    { title: 'Complaint Review & Tracking', desc: 'Track ticket status from pending to technician dispatch', status: 'Ready for Integration' },
    { title: 'Resolution Management', desc: 'Co-op admin complaint resolution and user notification hub', status: 'Ready for Integration' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={[styles.heroCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.iconBadge}>
          <Bell size={28} color="#EF4444" />
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>Alerts & Support Center</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSub }]}>
          System Incidents, Complaints & Ticket Resolution Module
        </Text>
        <View style={styles.assigneeTag}>
          <Text style={styles.assigneeText}>Assigned to Member 1 (Vihanga Perera)</Text>
        </View>
      </View>

      {/* Feature Items List */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Module Features Roadmap</Text>

        <View style={styles.list}>
          {moduleFeatures.map((item, i) => (
            <View key={i} style={[styles.itemRow, { borderBottomColor: themeColors.border }]}>
              <View style={styles.itemHeader}>
                <AlertTriangle size={16} color={COLORS.alert} />
                <Text style={[styles.itemTitle, { color: themeColors.text }]}>{item.title}</Text>
              </View>
              <Text style={[styles.itemDesc, { color: themeColors.textSub }]}>{item.desc}</Text>
              <View style={styles.statusPill}>
                <Clock size={12} color="#F59E0B" />
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Action Preview Button */}
      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
        <MessageSquare size={18} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>Submit Support Complaint Ticket</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  heroCard: { borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center', textAlign: 'center', gap: 8, ...SHADOWS.medium },
  iconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, textAlign: 'center' },
  assigneeTag: { backgroundColor: 'rgba(239, 68, 68, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  assigneeText: { color: '#EF4444', fontSize: 11, fontWeight: '800' },
  sectionCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  list: { gap: 12 },
  itemRow: { paddingBottom: 12, borderBottomWidth: 1, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemDesc: { fontSize: 12, lineHeight: 18 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
  actionBtn: { backgroundColor: COLORS.alert, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, ...SHADOWS.medium },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
