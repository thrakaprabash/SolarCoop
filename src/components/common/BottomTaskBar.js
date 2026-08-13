import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { LayoutDashboard, ArrowLeftRight, Bell, User } from 'lucide-react-native';

export const bottomTabsConfig = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'trade', label: 'P2P Trade', icon: ArrowLeftRight },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

export const BottomTaskBar = () => {
  const { mainBottomTab, setMainBottomTab } = useEnergy();

  return (
    <View style={styles.taskBarContainer}>
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
                size={18}
                color={isActive ? COLORS.amberLight : COLORS.textMuted}
              />
            </View>
            <Text
              style={[
                styles.tabLabel,
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
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 14, 39, 0.7)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrapper: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: COLORS.amberLight,
  },
});
