import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, SHADOWS } from '../../theme/colors';
import { LayoutDashboard, ArrowLeftRight, Bell, User } from 'lucide-react-native';

export const bottomTabsConfig = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trade', label: 'P2P Trade', icon: ArrowLeftRight },
  { id: 'alerts', label: 'Alerts & Support', icon: Bell },
  { id: 'profile', label: 'Profile & Roles', icon: User },
];

export const BottomTaskBar = () => {
  const { mainBottomTab, setMainBottomTab, isDarkMode } = useEnergy();

  const themeColors = isDarkMode
    ? { bg: '#1E293B', border: '#334155', activeText: '#10B981', inactiveText: '#94A3B8' }
    : { bg: '#FFFFFF', border: '#E2E8F0', activeText: '#10B981', inactiveText: '#64748B' };

  return (
    <View style={[styles.taskBarContainer, { backgroundColor: themeColors.bg, borderColor: themeColors.border }]}>
      {bottomTabsConfig.map(tab => {
        const isActive = mainBottomTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setMainBottomTab(tab.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
              <IconComponent
                size={20}
                color={isActive ? '#FFFFFF' : themeColors.inactiveText}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? themeColors.activeText : themeColors.inactiveText },
                isActive && styles.tabLabelActive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  taskBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    ...SHADOWS.medium,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrapper: {
    width: 38,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.glowGreen,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '800',
  },
});
