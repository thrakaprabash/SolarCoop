import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
