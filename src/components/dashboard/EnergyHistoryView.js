import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { History, Search, Download, Filter, Sun, Battery, Zap, ArrowUpRight, ArrowDownLeft, FileText, Check } from 'lucide-react-native';

export const EnergyHistoryView = () => {
  const { historyLogs } = useEnergy();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'surplus' | 'production' | 'consumption' | 'deficit'
  const [searchQuery, setSearchQuery] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const filteredLogs = historyLogs.filter(log => {
    const matchesFilter = filterType === 'all' || log.type === filterType;
    const matchesSearch = log.title.toLowerCase().includes(searchQuery.toLowerCase()) || log.detail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getLogIcon = (type) => {
    switch (type) {
      case 'surplus': return <ArrowUpRight size={18} color={COLORS.tealLight} />;
      case 'production': return <Sun size={18} color={COLORS.amber} />;
      case 'consumption': return <Zap size={18} color={COLORS.amberLight} />;
      case 'deficit': return <ArrowDownLeft size={18} color={COLORS.red} />;
      default: return <Battery size={18} color={COLORS.amber} />;
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>Energy Logs & Statements</Text>
      </View>

      {/* Export Statement Action Bar */}
      <View style={[styles.exportBar, GLASS.card, SHADOWS.glass]}>
        <View style={styles.exportInfo}>
          <FileText size={22} color={COLORS.amber} />
          <View>
            <Text style={styles.exportTitle}>Co-op Energy Statement</Text>
            <Text style={styles.exportSub}>Download verified monthly solar ledger (PDF/CSV)</Text>
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
        <View style={[styles.searchBox, GLASS.input]}>
          <Search size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={COLORS.textMuted}
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
              GLASS.pill,
              filterType === p.id && styles.filterPillActive,
            ]}
            onPress={() => setFilterType(p.id)}
          >
            <Text style={[styles.filterPillText, filterType === p.id && styles.filterPillTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* History Timeline Log Cards */}
      <View style={[styles.sectionCard, GLASS.card, SHADOWS.glass]}>
        <Text style={styles.sectionTitle}>Transaction Timeline ({filteredLogs.length})</Text>

        <View style={styles.logsList}>
          {filteredLogs.map(log => (
            <View key={log.id} style={styles.logRow}>
              <View style={styles.iconBadge}>
                {getLogIcon(log.type)}
              </View>

              <View style={styles.logMain}>
                <View style={styles.logTopLine}>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  <Text style={[styles.logAmount, { color: log.type === 'deficit' ? COLORS.red : COLORS.tealLight }]}>{log.amount}</Text>
                </View>
                <Text style={styles.logDetail}>{log.detail}</Text>
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
          <View style={[styles.modalCard, GLASS.card, SHADOWS.glass]}>
            <FileText size={40} color={COLORS.amber} />
            <Text style={styles.modalTitle}>Generate Official Co-op Statement</Text>
            <Text style={styles.modalSub}>
              Includes total kWh generated, community P2P energy trades, grid draws, and carbon offsets for August 2026.
            </Text>

            {downloaded ? (
              <View style={styles.downloadDoneBox}>
                <Check size={24} color={COLORS.tealLight} />
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
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  exportBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  exportInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  exportTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  exportSub: { fontSize: 11, color: COLORS.textSecondary },
  exportBtn: { backgroundColor: COLORS.amber, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, ...SHADOWS.glow },
  exportBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  controlsRow: { flexDirection: 'row', gap: 10 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  pillsScroll: { gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7 },
  filterPillText: { fontSize: 12, color: COLORS.textSecondary },
  filterPillActive: { backgroundColor: COLORS.amber, borderColor: COLORS.amberDark },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '800' },
  sectionCard: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: COLORS.textBright },
  logsList: { gap: 12 },
  logRow: { flexDirection: 'row', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  iconBadge: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  logMain: { flex: 1, gap: 3 },
  logTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  logAmount: { fontSize: 13, fontWeight: '800' },
  logDetail: { fontSize: 11, color: COLORS.textSecondary },
  logMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  logTime: { fontSize: 10, color: COLORS.textMuted },
  logCost: { fontSize: 10, fontWeight: '700', color: COLORS.amberLight },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', padding: 24, alignItems: 'center', gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', color: COLORS.textBright },
  modalSub: { fontSize: 12, textAlign: 'center', lineHeight: 18, color: COLORS.textSecondary },
  downloadDoneBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.tealGlow, padding: 12, borderRadius: 12 },
  downloadDoneText: { color: COLORS.tealLight, fontSize: 13, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  modalCancelText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700' },
  modalConfirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.amber, ...SHADOWS.glow },
  modalConfirmText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
