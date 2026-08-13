import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { ArrowLeftRight, CheckCircle2, Clock, ShieldCheck, Zap, PlusCircle } from 'lucide-react-native';

export const TradeRequestsPlaceholder = () => {
  const { isDarkMode } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const moduleFeatures = [
    { title: 'Available Community Energy', desc: 'Browse available solar energy pools across co-op households', status: 'Ready for Integration' },
    { title: 'Energy Requests Management', desc: 'Submit and track P2P energy request orders', status: 'Ready for Integration' },
    { title: 'Request Approval / Rejection', desc: 'Review incoming requests from neighboring households', status: 'Ready for Integration' },
    { title: 'Transaction Ledger & History', desc: 'Immutable ledger of completed energy exchanges & token payouts', status: 'Ready for Integration' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={[styles.heroCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.iconBadge}>
          <ArrowLeftRight size={28} color="#06B6D4" />
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>P2P Energy Trading & Requests</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSub }]}>
          Community Energy Exchange & Request Approvals Module
        </Text>
        <View style={styles.assigneeTag}>
          <Text style={styles.assigneeText}>Assigned to Member 2 (Pawan Menuka)</Text>
        </View>
      </View>

      {/* Feature Items List */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Module Features Roadmap</Text>

        <View style={styles.list}>
          {moduleFeatures.map((item, i) => (
            <View key={i} style={[styles.itemRow, { borderBottomColor: themeColors.border }]}>
              <View style={styles.itemHeader}>
                <Zap size={16} color={COLORS.accent} />
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

      {/* Action Preview Placeholder Button */}
      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
        <PlusCircle size={18} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>Create New P2P Energy Request</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  heroCard: { borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center', textAlign: 'center', gap: 8, ...SHADOWS.medium },
  iconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(6, 182, 212, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, textAlign: 'center' },
  assigneeTag: { backgroundColor: 'rgba(6, 182, 212, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  assigneeText: { color: '#06B6D4', fontSize: 11, fontWeight: '800' },
  sectionCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  list: { gap: 12 },
  itemRow: { paddingBottom: 12, borderBottomWidth: 1, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemDesc: { fontSize: 12, lineHeight: 18 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
  actionBtn: { backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, ...SHADOWS.medium },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
