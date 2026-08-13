import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { User, Shield, Key, LogOut, Users, Clock } from 'lucide-react-native';

export const ProfileAuthPlaceholder = () => {
  const { isDarkMode } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const moduleFeatures = [
    { title: 'User Registration & Login', desc: 'Secure member authentication & household onboarding', status: 'Ready for Integration' },
    { title: 'Household Profile Management', desc: 'Solar array specifications & energy preferences profile', status: 'Ready for Integration' },
    { title: 'Role Based Access Control', desc: 'Co-op Administrator vs General Household Member permissions', status: 'Ready for Integration' },
    { title: 'Community Member Directory', desc: 'Manage participating households in GreenValley Solar Co-op', status: 'Ready for Integration' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={[styles.heroCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.iconBadge}>
          <User size={28} color="#8B5CF6" />
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>Profile & Member Management</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSub }]}>
          Authentication, Roles & Co-op Member Directory Module
        </Text>
        <View style={styles.assigneeTag}>
          <Text style={styles.assigneeText}>Assigned to Member 4 (Irusha Shaveen)</Text>
        </View>
      </View>

      {/* Feature Items List */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Module Features Roadmap</Text>

        <View style={styles.list}>
          {moduleFeatures.map((item, i) => (
            <View key={i} style={[styles.itemRow, { borderBottomColor: themeColors.border }]}>
              <View style={styles.itemHeader}>
                <Shield size={16} color="#8B5CF6" />
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
        <Key size={18} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>View Co-op Member Roles</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  heroCard: { borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center', textAlign: 'center', gap: 8, ...SHADOWS.medium },
  iconBadge: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(139, 92, 246, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, textAlign: 'center' },
  assigneeTag: { backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  assigneeText: { color: '#8B5CF6', fontSize: 11, fontWeight: '800' },
  sectionCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  list: { gap: 12 },
  itemRow: { paddingBottom: 12, borderBottomWidth: 1, gap: 4 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemDesc: { fontSize: 12, lineHeight: 18 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
  actionBtn: { backgroundColor: '#8B5CF6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, ...SHADOWS.medium },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
