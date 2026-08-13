import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { User, Shield, Key, Clock } from 'lucide-react-native';

export const ProfileAuthPlaceholder = () => {
  const moduleFeatures = [
    { title: 'User Registration & Login', desc: 'Secure member authentication & household onboarding' },
    { title: 'Household Profile Management', desc: 'Solar array specifications & energy preferences profile' },
    { title: 'Role Based Access Control', desc: 'Co-op Administrator vs General Household Member permissions' },
    { title: 'Community Member Directory', desc: 'Manage participating households in GreenValley Solar Co-op' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[GLASS.card, styles.heroCard]}>
        <View style={styles.iconBadge}>
          <User size={28} color={COLORS.amberLight} />
        </View>
        <Text style={styles.title}>Profile & Members</Text>
        <Text style={styles.subtitle}>Authentication, Roles & Co-op Member Directory</Text>
        <View style={styles.assigneeTag}>
          <Text style={styles.assigneeText}>Member 4 — Irusha Shaveen</Text>
        </View>
      </View>

      <View style={[GLASS.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Module Features</Text>
        <View style={styles.list}>
          {moduleFeatures.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Shield size={14} color={COLORS.amberLight} />
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
        <Key size={18} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>View Co-op Members</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  heroCard: { padding: 20, alignItems: 'center', gap: 8 },
  iconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.amberGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },
  subtitle: { fontSize: 12, textAlign: 'center', color: COLORS.textSecondary },
  assigneeTag: { backgroundColor: COLORS.amberGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  assigneeText: { color: COLORS.amberLight, fontSize: 11, fontWeight: '800' },
  sectionCard: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  list: { gap: 12 },
  itemRow: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  itemDesc: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 10, color: COLORS.amber, fontWeight: '700' },
  actionBtn: { backgroundColor: COLORS.amberGlow, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.4)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, ...SHADOWS.glow },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
