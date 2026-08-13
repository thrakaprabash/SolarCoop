import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { ArrowLeftRight, Clock, Zap, PlusCircle } from 'lucide-react-native';

export const TradeRequestsPlaceholder = () => {
  const moduleFeatures = [
    { title: 'Available Community Energy', desc: 'Browse available solar energy pools across co-op households' },
    { title: 'Energy Requests Management', desc: 'Submit and track P2P energy request orders' },
    { title: 'Request Approval / Rejection', desc: 'Review incoming requests from neighboring households' },
    { title: 'Transaction Ledger & History', desc: 'Immutable ledger of completed energy exchanges & token payouts' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[GLASS.card, styles.heroCard]}>
        <View style={styles.iconBadge}>
          <ArrowLeftRight size={28} color={COLORS.tealLight} />
        </View>
        <Text style={styles.title}>P2P Energy Trading</Text>
        <Text style={styles.subtitle}>Community Energy Exchange & Request Approvals</Text>
        <View style={styles.assigneeTag}>
          <Text style={styles.assigneeText}>Member 2 — Pawan Menuka</Text>
        </View>
      </View>

      <View style={[GLASS.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Module Features</Text>
        <View style={styles.list}>
          {moduleFeatures.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Zap size={14} color={COLORS.tealLight} />
                <Text style={styles.itemTitle}>{item.title}</Text>
              </View>
              <Text style={styles.itemDesc}>{item.desc}</Text>
              <View style={styles.statusPill}>
                <Clock size={10} color={COLORS.amber} />
                <Text style={styles.statusText}>Ready for Integration</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
        <PlusCircle size={18} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>Create Energy Request</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  heroCard: { padding: 20, alignItems: 'center', gap: 8 },
  iconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.tealGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },
  subtitle: { fontSize: 12, textAlign: 'center', color: COLORS.textSecondary },
  assigneeTag: { backgroundColor: COLORS.tealGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  assigneeText: { color: COLORS.tealLight, fontSize: 11, fontWeight: '800' },
  sectionCard: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  list: { gap: 12 },
  itemRow: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  itemDesc: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 10, color: COLORS.amber, fontWeight: '700' },
  actionBtn: { backgroundColor: 'rgba(20, 184, 166, 0.3)', borderWidth: 1, borderColor: 'rgba(20, 184, 166, 0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18 },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
