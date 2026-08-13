import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { History, Search, Download, Filter, Sun, Battery, Zap, ArrowUpRight, ArrowDownLeft, FileText, Check } from 'lucide-react-native';

export const EnergyHistoryView = () => {
  const { isDarkMode, historyLogs } = useEnergy();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'surplus' | 'production' | 'consumption' | 'deficit'
  const [searchQuery, setSearchQuery] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const themeColors = isDarkMode
    ? { bg: '#0F172A', card: '#1E293B', border: '#334155', text: '#F8FAFC', textSub: '#94A3B8' }
    : { bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', textSub: '#64748B' };

  const filteredLogs = historyLogs.filter(log => {
    const matchesFilter = filterType === 'all' || log.type === filterType;
    const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) || log.detail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLogIcon = (type) => {
    switch (type) {
      case 'surplus': return <ArrowUpRight size={18} color="#06B6D4" />;
      case 'production': return <Sun size={18} color="#F59E0B" />;
      case 'consumption': return <Zap size={18} color="#10B981" />;
      case 'deficit': return <ArrowDownLeft size={18} color="#EF4444" />;
      default: return <Battery size={18} color={COLORS.primary} />;
    }
  };

  const handleSimulateExport = () => {
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      setExportModalVisible(false);
    }, 2000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.bg }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={[styles.storyBadgeTitle, { color: themeColors.text }]}>Energy Logs & Statements</Text>
      </View>

      {/* Export Statement Action Bar */}
      <View style={[styles.exportBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.exportInfo}>
          <FileText size={22} color={COLORS.primary} />
          <View>
            <Text style={[styles.exportTitle, { color: themeColors.text }]}>Co-op Energy Statement</Text>
            <Text style={[styles.exportSub, { color: themeColors.textSub }]}>Download verified monthly solar ledger (PDF/CSV)</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => setExportModalVisible(true)}
          activeOpacity={0.7}
        >
          <Download size={16} color="#FFFFFF" />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Controls */}
      <View style={styles.controlsRow}>
        <View style={[styles.searchBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Search size={16} color={themeColors.textSub} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={themeColors.textSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
        {[
          { id: 'all', label: 'All Events' },
          { id: 'surplus', label: '⚡ Surplus Shared' },
          { id: 'production', label: '☀️ Solar Gen' },
          { id: 'consumption', label: '🔋 Usage' },
          { id: 'deficit', label: '⚠️ Deficit Draw' },
        ].map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.filterPill,
              filterType === p.id && styles.filterPillActive,
              { backgroundColor: filterType === p.id ? COLORS.primary : themeColors.card, borderColor: themeColors.border }
            ]}
            onPress={() => setFilterType(p.id)}
          >
            <Text style={[styles.filterPillText, filterType === p.id && { color: '#FFFFFF', fontWeight: '800' }]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* History Timeline Log Cards */}
      <View style={[styles.sectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Transaction Timeline ({filteredLogs.length})</Text>

        <View style={styles.logsList}>
          {filteredLogs.map(log => (
            <View key={log.id} style={[styles.logRow, { borderBottomColor: themeColors.border }]}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
                {getLogIcon(log.type)}
              </View>

              <View style={styles.logMain}>
                <View style={styles.logTopLine}>
                  <Text style={[styles.logTitle, { color: themeColors.text }]}>{log.title}</Text>
                  <Text style={[styles.logAmount, { color: log.type === 'deficit' ? '#EF4444' : COLORS.primary }]}>{log.amount}</Text>
                </View>
                <Text style={[styles.logDetail, { color: themeColors.textSub }]}>{log.detail}</Text>
                <View style={styles.logMetaRow}>
                  <Text style={styles.logTime}>{log.time}</Text>
                  <Text style={styles.logCost}>{log.cost}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Export Preview Modal */}
      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <FileText size={40} color={COLORS.primary} />
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Generate Official Co-op Statement</Text>
            <Text style={[styles.modalSub, { color: themeColors.textSub }]}>
              Includes total kWh generated, community P2P energy trades, grid draws, and carbon offsets for August 2026.
            </Text>

            {downloaded ? (
              <View style={styles.downloadDoneBox}>
                <Check size={24} color="#10B981" />
                <Text style={styles.downloadDoneText}>Statement Downloaded to Device!</Text>
              </View>
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setExportModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleSimulateExport}>
                  <Download size={16} color="#FFFFFF" />
                  <Text style={styles.modalConfirmText}>Download PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTag: { fontSize: 10, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  exportBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 16, borderWidth: 1 },
  exportInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportTitle: { fontSize: 14, fontWeight: '800' },
  exportSub: { fontSize: 11 },
  exportBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, ...SHADOWS.glowGreen },
  exportBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  controlsRow: { flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 13 },
  pillsScroll: { gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  filterPillText: { fontSize: 12, color: '#94A3B8' },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryDark },
  sectionCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  logsList: { gap: 12 },
  logRow: { flexDirection: 'row', gap: 12, paddingBottom: 12, borderBottomWidth: 1 },
  iconBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logMain: { flex: 1, gap: 3 },
  logTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logTitle: { fontSize: 13, fontWeight: '700' },
  logAmount: { fontSize: 13, fontWeight: '800' },
  logDetail: { fontSize: 11 },
  logMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  logTime: { fontSize: 10, color: '#94A3B8' },
  logCost: { fontSize: 10, fontWeight: '700', color: COLORS.secondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', borderRadius: 20, padding: 24, borderWidth: 1, alignItems: 'center', gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  modalSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  downloadDoneBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: 12, borderRadius: 12 },
  downloadDoneText: { color: '#10B981', fontSize: 13, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#334155' },
  modalCancelText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  modalConfirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: COLORS.primary },
  modalConfirmText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
