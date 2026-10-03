import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS } from '../../theme/colors';
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
  { id: 'dashboard', labelKey: 'member.tabs.dashboard', Icon: LayoutDashboard },
  { id: 'production', labelKey: 'member.tabs.production', Icon: Sun },
  { id: 'consumption', labelKey: 'member.tabs.consumption', Icon: Zap },
  { id: 'surplus', labelKey: 'member.tabs.surplus', Icon: BatteryCharging },
  { id: 'deficit', labelKey: 'member.tabs.deficit', Icon: AlertTriangle },
  { id: 'history', labelKey: 'member.tabs.history', Icon: History },
  { id: 'charts', labelKey: 'member.tabs.charts', Icon: BarChart3 },
  { id: 'summary', labelKey: 'member.tabs.summary', Icon: Leaf },
];

export const SegmentedTabs = () => {
  const { t } = useTranslation();
  const { activeTab, setActiveTab } = useEnergy();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabsConfig.map(tab => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.Icon;
          const label = t(tab.labelKey);

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                isActive && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <IconComponent
                size={14}
                color={isActive ? COLORS.amberLight : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                ]}
              >
                {label}
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
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: COLORS.amberLight,
  },
});
