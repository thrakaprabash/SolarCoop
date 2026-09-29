import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TouchableWithoutFeedback 
} from 'react-native';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { Calendar, Clock, Sliders, Check, X } from 'lucide-react-native';

export const DATE_RANGES = [
  { key: 'today', label: 'Today', shortLabel: 'Today' },
  { key: 'yesterday', label: 'Yesterday', shortLabel: 'Yest' },
  { key: '7d', label: 'Last 7 Days', shortLabel: '7D' },
  { key: '30d', label: 'Last 30 Days', shortLabel: '30D' },
  { key: 'custom', label: 'Custom Range', shortLabel: 'Custom' },
];

export const GRANULARITY_OPTIONS_BY_RANGE = {
  today: [
    { key: '30m', label: '30 Min' },
    { key: '1h', label: '1 Hour' },
  ],
  yesterday: [
    { key: '30m', label: '30 Min' },
    { key: '1h', label: '1 Hour' },
  ],
  '7d': [
    { key: '6h', label: '6 Hours' },
    { key: '1d', label: 'Daily' },
  ],
  '30d': [
    { key: '1d', label: 'Daily' },
    { key: '1w', label: 'Weekly' },
  ],
  custom: [
    { key: '1d', label: 'Daily' },
    { key: '1w', label: 'Weekly' },
  ],
};

/**
 * SOL-186: Dashboard Date-Range & Granularity Filter Component
 * Lets users switch between time windows and adjust data granularity.
 */
export const DateRangeFilter = ({
  activeRange = 'today',
  onSelectRange,
  activeGranularity = '1h',
  onSelectGranularity,
  customRange = { startDate: '2026-09-01', endDate: '2026-09-29' },
  onSelectCustomRange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempStart, setTempStart] = useState(customRange.startDate);
  const [tempEnd, setTempEnd] = useState(customRange.endDate);

  const availableGranularities = GRANULARITY_OPTIONS_BY_RANGE[activeRange] || [
    { key: '1h', label: '1 Hour' },
    { key: '1d', label: 'Daily' },
  ];

  const handleRangePress = (key) => {
    if (key === 'custom') {
      setModalVisible(true);
    } else {
      if (onSelectRange) onSelectRange(key);
      // Auto-adjust default granularity if current active is not in available options
      const nextGranularities = GRANULARITY_OPTIONS_BY_RANGE[key];
      if (nextGranularities && !nextGranularities.some(g => g.key === activeGranularity)) {
        if (onSelectGranularity) onSelectGranularity(nextGranularities[0].key);
      }
    }
  };

  const handleApplyCustom = () => {
    if (onSelectCustomRange) {
      onSelectCustomRange({ startDate: tempStart, endDate: tempEnd });
    }
    if (onSelectRange) {
      onSelectRange('custom');
    }
    setModalVisible(false);
  };

  return (
    <View style={styles.wrapper}>
      {/* Top Filter Bar: Date Range Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.rangeScroll}
      >
        {DATE_RANGES.map((item) => {
          const isActive = activeRange === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.rangeTab,
                isActive ? styles.rangeTabActive : styles.rangeTabInactive,
              ]}
              onPress={() => handleRangePress(item.key)}
              activeOpacity={0.7}
            >
              {item.key === 'custom' && (
                <Calendar 
                  size={12} 
                  color={isActive ? '#FFFFFF' : COLORS.textMuted} 
                  style={{ marginRight: 4 }} 
                />
              )}
              <Text style={[styles.rangeText, isActive && styles.rangeTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Sub Bar: Granularity & Active Window Badge */}
      <View style={styles.subBar}>
        <View style={styles.activeWindowIndicator}>
          <Clock size={11} color={COLORS.amberLight} />
          <Text style={styles.activeWindowText}>
            {activeRange === 'custom' 
              ? `${tempStart} → ${tempEnd}` 
              : activeRange === 'today'
              ? 'Today (Live 24h)'
              : activeRange === 'yesterday'
              ? 'Yesterday (Full 24h)'
              : activeRange === '7d'
              ? 'Past 7 Days'
              : 'Past 30 Days'}
          </Text>
        </View>

        {/* Granularity Selector */}
        <View style={styles.granularityContainer}>
          <Text style={styles.granularityLabel}>Step:</Text>
          <View style={styles.granularityPills}>
            {availableGranularities.map((gran) => {
              const isGranActive = activeGranularity === gran.key;
              return (
                <TouchableOpacity
                  key={gran.key}
                  style={[
                    styles.granPill,
                    isGranActive && styles.granPillActive,
                  ]}
                  onPress={() => onSelectGranularity && onSelectGranularity(gran.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.granText, isGranActive && styles.granTextActive]}>
                    {gran.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Custom Range Picker Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.modalCard, GLASS.card, SHADOWS.glass]}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderTitleRow}>
                    <Calendar size={18} color={COLORS.amber} />
                    <Text style={styles.modalTitle}>Select Custom Time Range</Text>
                  </View>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                    <X size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Quick Range Presets */}
                <View style={styles.presetSection}>
                  <Text style={styles.presetSectionTitle}>Select Window:</Text>
                  <View style={styles.presetButtonsRow}>
                    <TouchableOpacity 
                      style={[styles.presetBtn, tempStart === '2026-09-01' && styles.presetBtnActive]}
                      onPress={() => { setTempStart('2026-09-01'); setTempEnd('2026-09-29'); }}
                    >
                      <Text style={styles.presetBtnText}>Month-to-Date</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.presetBtn, tempStart === '2026-09-15' && styles.presetBtnActive]}
                      onPress={() => { setTempStart('2026-09-15'); setTempEnd('2026-09-22'); }}
                    >
                      <Text style={styles.presetBtnText}>Mid-Month Week</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.presetBtn, tempStart === '2026-08-01' && styles.presetBtnActive]}
                      onPress={() => { setTempStart('2026-08-01'); setTempEnd('2026-08-31'); }}
                    >
                      <Text style={styles.presetBtnText}>Previous Month</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Date Display Card */}
                <View style={styles.dateDisplayCard}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateBoxLabel}>START DATE</Text>
                    <Text style={styles.dateBoxValue}>{tempStart}</Text>
                  </View>
                  <Text style={styles.dateArrow}>→</Text>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateBoxLabel}>END DATE</Text>
                    <Text style={styles.dateBoxValue}>{tempEnd}</Text>
                  </View>
                </View>

                {/* Apply Button */}
                <TouchableOpacity 
                  style={styles.applyBtn} 
                  onPress={handleApplyCustom}
                  activeOpacity={0.8}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.applyBtnText}>Apply Filter</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
    marginBottom: 6,
  },
  rangeScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  rangeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  rangeTabActive: {
    backgroundColor: COLORS.amber,
    borderColor: COLORS.amber,
  },
  rangeTabInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rangeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeWindowIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeWindowText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  granularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  granularityLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  granularityPills: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  granPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  granPillActive: {
    backgroundColor: COLORS.tealLight,
  },
  granText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  granTextActive: {
    color: '#121212',
    fontWeight: '800',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1C1A18',
    borderRadius: 24,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textBright,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetSection: {
    gap: 8,
  },
  presetSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  presetButtonsRow: {
    flexDirection: 'column',
    gap: 6,
  },
  presetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: COLORS.amber,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dateDisplayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dateBox: {
    gap: 2,
  },
  dateBoxLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  dateBoxValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.amberLight,
  },
  dateArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.amber,
    borderRadius: 14,
    paddingVertical: 12,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
