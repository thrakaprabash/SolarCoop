import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS } from '../../theme/colors';
import { 
  LayoutDashboard, 
  Sun, 
  Zap, 
  BatteryCharging, 
  AlertTriangle, 
  History, 
  BarChart3, 
  Leaf 
} from 'lucide-react-native';

export const tabsConfig = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'production', label: 'Production', Icon: Sun },
  { id: 'consumption', label: 'Consumption', Icon: Zap },
  { id: 'surplus', label: 'Surplus', Icon: BatteryCharging },
  { id: 'deficit', label: 'Deficit', Icon: AlertTriangle },
  { id: 'history', label: 'History', Icon: History },
  { id: 'charts', label: 'Charts', Icon: BarChart3 },
  { id: 'summary', label: 'Summary', Icon: Leaf },
];

export const SegmentedTabs = () => {
  const { activeTab, setActiveTab, isDarkMode } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#0F172A', cardBg: '#1E293B', text: '#94A3B8', activeText: '#FFFFFF', border: '#334155' }
    : { bg: '#F8FAFC', cardBg: '#FFFFFF', text: '#64748B', activeText: '#0F172A', border: '#E2E8F0' };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg, borderColor: themeColors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabsConfig.map(tab => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.Icon;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                { backgroundColor: themeColors.cardBg, borderColor: themeColors.border },
                isActive && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <IconComponent
                size={16}
                color={isActive ? '#FFFFFF' : themeColors.text}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? '#FFFFFF' : themeColors.text },
                  isActive && styles.tabLabelActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  storyPill: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  storyPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  storyText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  storyTextActive: {
    color: '#FFFFFF',
  },
});
