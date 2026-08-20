import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import {
  LayoutGrid,
  Sun,
  Zap,
  BatteryCharging,
} from 'lucide-react-native';

const CHIPS = [
  { id: 'all',         label: 'All Metrics',  Icon: LayoutGrid },
  { id: 'production',  label: 'Production',   Icon: Sun },
  { id: 'consumption', label: 'Consumption',  Icon: Zap },
  { id: 'surplus',     label: 'Surplus',      Icon: BatteryCharging },
];

export default function AdminMetricChips() {
  const { adminMetricChip, setAdminMetricChip } = useAdmin();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CHIPS.map(chip => {
          const isActive = adminMetricChip === chip.id;
          const IconComponent = chip.Icon;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setAdminMetricChip(chip.id)}
              activeOpacity={0.7}
            >
              <IconComponent size={13} color={isActive ? COLORS.amberLight : COLORS.textMuted} />
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: 'rgba(245,158,11,0.35)',
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  chipLabelActive: {
    fontWeight: '800',
    color: COLORS.amberLight,
  },
});
