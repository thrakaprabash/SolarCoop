import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Zap } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';
import { IconBadge, Pill } from './ui';

export default function AppHeader({ title = 'SolarCoop', subtitle = 'Community Energy Sharing', status = 'Surplus' }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <IconBadge size={34} radius={radius.sm} background="rgba(245,158,11,0.3)" borderColor="rgba(245,158,11,0.5)">
          <Zap size={18} color={colors.text} strokeWidth={2} />
        </IconBadge>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <Pill label={status} dotColor={colors.teal} background={colors.tealTintSoft} color={colors.tealLight} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: weight.heavy, color: colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 10, fontWeight: weight.regular, color: colors.textMuted },
});
