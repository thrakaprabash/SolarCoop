import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnergy } from '../../context/EnergyContext';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { 
  Radio, 
  RotateCw, 
  Activity, 
  Wifi, 
  Cpu, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react-native';

/**
 * SOL-187: Live Real-Time Telemetry & Status Indicator Widget
 * Displays live streaming/polling status, pulsing visual beacon,
 * inverter performance telemetry, and auto-updating heartbeat ticker.
 */
export const LiveTelemetryWidget = () => {
  const { t } = useTranslation();
  const {
    telemetryStatus = 'live', 
    lastFetchedAt, 
    telemetryHealth = { inverterStatus: 'Optimal', gridFrequency: '50.0 Hz', pingMs: 38, efficiency: 99.2 },
    refreshMetricsNow,
  } = useEnergy();

  const [refreshing, setRefreshing] = useState(false);
  const [relativeTime, setRelativeTime] = useState(t('member.telemetry.justNow'));

  // Looping pulse animation for live beacon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isNative = Platform.OS !== 'web';
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 1000, useNativeDriver: isNative }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: isNative }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  // Relative timestamp ticker updating every second
  useEffect(() => {
    const updateRelative = () => {
      if (!lastFetchedAt) {
        setRelativeTime(t('member.telemetry.justNow'));
        return;
      }
      const diffSec = Math.max(0, Math.floor((Date.now() - new Date(lastFetchedAt).getTime()) / 1000));
      if (diffSec < 5) {
        setRelativeTime(t('member.telemetry.justNow'));
      } else if (diffSec < 60) {
        setRelativeTime(t('member.telemetry.secondsAgo', { count: diffSec }));
      } else {
        const mins = Math.floor(diffSec / 60);
        setRelativeTime(t('member.telemetry.minutesAgo', { count: mins }));
      }
    };

    updateRelative();
    const timer = setInterval(updateRelative, 1000);
    return () => clearInterval(timer);
  }, [lastFetchedAt]);

  const handleManualRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    const isNative = Platform.OS !== 'web';
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: isNative,
    }).start(() => spinAnim.setValue(0));

    try {
      if (refreshMetricsNow) {
        await refreshMetricsNow();
      }
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusColor = () => {
    if (telemetryStatus === 'live') return COLORS.tealLight;
    if (telemetryStatus === 'polling') return COLORS.amberLight;
    return COLORS.red;
  };

  const getStatusLabel = () => {
    if (telemetryStatus === 'live') return t('member.telemetry.status.realtime');
    if (telemetryStatus === 'polling') return t('member.telemetry.status.polling');
    return t('member.telemetry.status.offline');
  };

  const statusColor = getStatusColor();

  return (
    <View style={[GLASS.card, styles.container, SHADOWS.glass]}>
      {/* Top Bar: Live Status & Sync Button */}
      <View style={styles.topRow}>
        <View style={styles.statusIdentity}>
          <View style={styles.iconCircle}>
            <Radio size={14} color={statusColor} />
          </View>
          <View>
            <View style={styles.labelRow}>
              <Animated.View 
                style={[
                  styles.pulseDot, 
                  { backgroundColor: statusColor, opacity: pulseAnim }
                ]} 
              />
              <Text style={styles.widgetTitle}>{t('member.telemetry.widgetTitle')}</Text>
              <View style={[styles.badge, { borderColor: `${statusColor}55`, backgroundColor: `${statusColor}18` }]}>
                <Text style={[styles.badgeText, { color: statusColor }]}>{getStatusLabel()}</Text>
              </View>
            </View>
            <View style={styles.timeRow}>
              <Clock size={11} color={COLORS.textMuted} />
              <Text style={styles.timeText}>{t('member.telemetry.heartbeat', { time: relativeTime })}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.refreshBtn, refreshing && styles.refreshBtnActive]} 
          onPress={handleManualRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <RotateCw size={13} color={COLORS.textPrimary} />
          </Animated.View>
          <Text style={styles.refreshBtnText}>{refreshing ? t('member.telemetry.syncing') : t('member.telemetry.sync')}</Text>
        </TouchableOpacity>
      </View>

      {/* Telemetry Metrics Bar */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryItem}>
          <View style={styles.metricHeader}>
            <Activity size={12} color={COLORS.tealLight} />
            <Text style={styles.metricLabel}>{t('member.telemetry.inverterHealth')}</Text>
          </View>
          <Text style={styles.metricValue}>{telemetryHealth.efficiency || 99.2}%</Text>
          <Text style={[styles.metricSub, { color: COLORS.tealLight }]}>{t('member.telemetry.inverterHealthSub')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.telemetryItem}>
          <View style={styles.metricHeader}>
            <Cpu size={12} color={COLORS.amberLight} />
            <Text style={styles.metricLabel}>{t('member.telemetry.gridFrequency')}</Text>
          </View>
          <Text style={styles.metricValue}>{telemetryHealth.gridFrequency || '50.0 Hz'}</Text>
          <Text style={styles.metricSub}>{t('member.telemetry.gridFrequencySub')}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.telemetryItem}>
          <View style={styles.metricHeader}>
            <Wifi size={12} color={COLORS.tealLight} />
            <Text style={styles.metricLabel}>{t('member.telemetry.telemetryPing')}</Text>
          </View>
          <Text style={styles.metricValue}>{telemetryHealth.pingMs || 38} ms</Text>
          <Text style={styles.metricSub}>{t('member.telemetry.telemetryPingSub')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  widgetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textBright,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  refreshBtnActive: {
    opacity: 0.6,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  telemetryGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textBright,
    marginTop: 2,
  },
  metricSub: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
