import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchChartData } from '../../services/energyService';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Sun, Cpu, Compass, Thermometer } from 'lucide-react-native';

// SOL-97: Production View Component
export const ProductionView = () => {
  const { t } = useTranslation();
  const { metrics, hasMetrics } = useEnergy();
  const { user } = useAuth();
  const [curve, setCurve] = useState(null);
  useEffect(() => {
    let active = true, request = 0;
    setCurve(null);
    if (!user?.id) return;
    const reload = async () => {
      const ticket = ++request;
      try {
        const row = await fetchChartData(user.id, 'day');
        if (active && ticket === request) setCurve(row ? { userId: user.id, row } : null);
      } catch { if (active && ticket === request) setCurve(null); }
    };
    reload();
    const timer = setInterval(reload, 30_000);
    return () => { active = false; clearInterval(timer); };
  }, [user?.id]);
  const readings = curve?.userId === user?.id ? curve.row : null;
  const values = (readings?.production || []).map(Number);
  const peak = values.length ? Math.max(...values) : null;
  const bars = values.map((value, i) => ({ time: readings.hours?.[i] || '', h: peak > 0 ? value / peak * 90 : 0 }));
  if (!hasMetrics) return <View style={styles.sectionCard}><Text style={styles.sectionTitle}>{t('member.dashboard.waitingTitle')}</Text><Text style={styles.arraySub}>{t('member.dashboard.waitingBody')}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.storyBadgeHeader}>
        <Text style={styles.storyBadgeTitle}>{t('member.production.header')}</Text>
      </View>

      {/* Main Gauge Banner */}
      <View style={styles.heroGaugeCard}>
        <View style={styles.heroGaugeHeader}>
          <View style={styles.iconCircle}>
            <Sun size={28} color={COLORS.amber} />
          </View>
          <View>
            <Text style={styles.gaugeLabel}>{t('member.production.liveGeneration')}</Text>
            <Text style={styles.gaugeValue}>
              {metrics.instantProduction} <Text style={styles.gaugeUnit}>kW</Text>
            </Text>
          </View>
        </View>

        {/* Hourly Solar Generation Bar Curve SVG */}
        <View style={styles.chartBox}>
          <Text style={styles.chartBoxTitle}>{t('member.production.generationCurve')}</Text>
          <Svg height="120" width="100%" viewBox="0 0 300 120">
            {/* Grid lines */}
            <Line x1="0" y1="30" x2="300" y2="30" stroke={COLORS.textMuted} strokeDasharray="3 3" />
            <Line x1="0" y1="70" x2="300" y2="70" stroke={COLORS.textMuted} strokeDasharray="3 3" />

            {/* Hourly Bars */}
            {bars.map((bar, i) => (
              <React.Fragment key={i}>
                <Rect
                  x={5 + i * (290 / bars.length)}
                  y={100 - bar.h}
                  width={Math.max(2, 290 / bars.length - 4)}
                  height={bar.h}
                  rx="4"
                  fill={i === 3 ? COLORS.amber : COLORS.amberGlow}
                />
                <SvgText x={5 + (i + 0.5) * (290 / bars.length)} y="115" fill={COLORS.textSecondary} fontSize="9" textAnchor="middle">{bar.time}</SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </View>

        <View style={styles.gaugeFooter}>
          <View style={styles.gaugeStat}>
            <Text style={styles.gaugeStatSub}>{t('member.production.dailyTotal')}</Text>
            <Text style={styles.gaugeStatVal}>{metrics.dailyProduction} kWh</Text>
          </View>
          <View style={styles.gaugeDivider} />
          <View style={styles.gaugeStat}>
            <Text style={styles.gaugeStatSub}>{t('member.production.peakToday')}</Text>
            <Text style={[styles.gaugeStatVal, { color: COLORS.amberLight }]}>{peak === null ? '—' : peak.toFixed(2) + ' kW'}</Text>
          </View>
          <View style={styles.gaugeDivider} />
          <View style={styles.gaugeStat}>
            <Text style={styles.gaugeStatSub}>{t('member.production.capacityUsed')}</Text>
            <Text style={[styles.gaugeStatVal, { color: COLORS.teal }]}>—</Text>
          </View>
        </View>
      </View>

      {/* Solar Telemetry Widgets */}
      <View style={styles.telemetryRow}>
        <View style={styles.telemetryCard}>
          <Compass size={18} color={COLORS.tealLight} />
          <Text style={styles.telemetryVal}>—</Text>
          <Text style={styles.telemetryLabel}>{t('member.production.solarIrradiance')}</Text>
        </View>

        <View style={styles.telemetryCard}>
          <Thermometer size={18} color={COLORS.amber} />
          <Text style={styles.telemetryVal}>—</Text>
          <Text style={styles.telemetryLabel}>{t('member.production.panelTemp')}</Text>
        </View>

        <View style={styles.telemetryCard}>
          <Cpu size={18} color={COLORS.teal} />
          <Text style={styles.telemetryVal}>—</Text>
          <Text style={styles.telemetryLabel}>{t('member.production.inverterEfficiency')}</Text>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 16 },
  storyBadgeHeader: { gap: 2 },
  storyBadgeTag: { fontSize: 10, fontWeight: '800', color: COLORS.amber, textTransform: 'uppercase', letterSpacing: 0.8 },
  storyBadgeTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, color: COLORS.textBright },
  heroGaugeCard: { ...GLASS.card, padding: 18, ...SHADOWS.glass },
  heroGaugeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.amberGlow, alignItems: 'center', justifyContent: 'center' },
  gaugeLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', color: COLORS.textSecondary },
  gaugeValue: { fontSize: 32, fontWeight: '800', color: COLORS.amberLight },
  gaugeUnit: { fontSize: 18, fontWeight: '600' },
  chartBox: { marginTop: 16, marginBottom: 12 },
  chartBoxTitle: { fontSize: 11, fontWeight: '600', marginBottom: 8, color: COLORS.textSecondary },
  gaugeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  gaugeStat: { flex: 1, alignItems: 'center' },
  gaugeStatSub: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  gaugeStatVal: { fontSize: 15, fontWeight: '800', marginTop: 2, color: COLORS.textPrimary },
  gaugeDivider: { width: 1, height: 24, backgroundColor: COLORS.glassBorder },
  telemetryRow: { flexDirection: 'row', gap: 10 },
  telemetryCard: { flex: 1, ...GLASS.card, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4, ...SHADOWS.glass },
  telemetryVal: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  telemetryLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  sectionCard: { ...GLASS.card, padding: 16, ...SHADOWS.glass },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12, color: COLORS.textBright },
  arraysList: { gap: 10 },
  arrayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  arrayInfo: { flex: 1, gap: 2 },
  arrayName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  arraySub: { fontSize: 11, color: COLORS.textSecondary },
  arrayOutputCol: { alignItems: 'flex-end', gap: 4 },
  arrayOutput: { fontSize: 15, fontWeight: '800', color: COLORS.amberLight },
  statusTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusTagText: { fontSize: 9, fontWeight: '800' },
});
