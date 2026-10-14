import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS } from '../../theme/colors';
import { SolarCoopLogo } from './SolarCoopLogo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useThemedStyles, useLegacyTheme } from '../../theme/useLegacyTheme';

export const Header = () => {
  const styles = useThemedStyles(baseStyles);
  const { COLORS, action } = useLegacyTheme();

  const { t } = useTranslation();
  const { metrics, hasMetrics, viewScope, setViewScope } = useEnergy();
  const isSurplus = metrics.instantProduction > metrics.instantConsumption;
  const liveColor = !hasMetrics ? COLORS.textMuted : isSurplus ? COLORS.teal : COLORS.red;
  const liveBackground = !hasMetrics
    ? 'rgba(148,163,184,0.15)'
    : isSurplus ? COLORS.tealGlow : COLORS.redGlow;

  return (
    <View style={styles.headerContainer}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <SolarCoopLogo size={36} decorative />
          <View>
            <Text style={styles.appName}>{t('common.appName')}</Text>
            <Text style={styles.subTitle}>{t('app.communityEnergySharing')}</Text>
          </View>
        </View>

        {/* Live Status */}
        <View style={[styles.liveStatusPill, { backgroundColor: liveBackground, borderColor: `${liveColor}55` }]}>
          <View style={[styles.liveDot, { backgroundColor: liveColor }]} />
          <Text style={[styles.liveStatusText, { color: liveColor }]}>
            {!hasMetrics ? t('member.dashboard.waitingTitle') : isSurplus ? t('member.header.surplus') : t('member.header.deficit')}
          </Text>
        </View>
      </View>

      {/* Household scope and appearance */}
      <View style={styles.bottomRow}>
        <View style={styles.scopeContainer}>
          <TouchableOpacity
            style={[styles.scopeTab, viewScope === 'household' && styles.scopeTabActive, viewScope === 'household' && action.selected.box]}
            onPress={() => setViewScope('household')}
            accessibilityRole="tab"
            accessibilityState={{ selected: viewScope === 'household' }}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Text style={[styles.scopeText, viewScope === 'household' && styles.scopeTextActive, viewScope === 'household' && action.selected.text]}>{t('member.header.household')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeTab, viewScope === 'community' && styles.scopeTabActive, viewScope === 'community' && action.selected.box]}
            onPress={() => setViewScope('community')}
            accessibilityRole="tab"
            accessibilityState={{ selected: viewScope === 'community' }}
            hitSlop={{ top: 8, bottom: 8 }}
          >
            <Text style={[styles.scopeText, viewScope === 'community' && styles.scopeTextActive, viewScope === 'community' && action.selected.text]}>{t('member.header.coop')}</Text>
          </TouchableOpacity>
        </View>
        <ThemeSwitcher compact />
      </View>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textBright,
    letterSpacing: -0.3,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  liveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scopeContainer: {
    flexDirection: 'row',
    ...GLASS.pill,
    padding: 3,
  },
  scopeTab: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  scopeTabActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  scopeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  scopeTextActive: {
    color: COLORS.amberLight,
    fontWeight: '700',
  },
  simRow: {
    flexDirection: 'row',
    gap: 4,
  },
  simDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  simDotActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  simEmoji: {
    fontSize: 13,
  },
});
