import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { MOCK_ALERTS, timeAgo } from '../data/mockAdminData';
import {
  AlertTriangle,
  Info,
  Zap,
  Bell,
  CheckCircle,
  Clock,
} from 'lucide-react-native';

const FILTERS = ['All', 'Open', 'Resolved'];

const SEVERITY_COLOR = {
  Critical: COLORS.red,
  Warning:  COLORS.amberLight,
  Info:     COLORS.tealLight,
};

const SEVERITY_BG = {
  Critical: 'rgba(239,68,68,0.12)',
  Warning:  'rgba(251,191,36,0.12)',
  Info:     'rgba(45,212,191,0.12)',
};

const SEVERITY_ICON = {
  Critical: AlertTriangle,
  Warning:  AlertTriangle,
  Info:     Info,
};

function AlertCard({ alert, onResolve }) {
  const color  = SEVERITY_COLOR[alert.severity];
  const bg     = SEVERITY_BG[alert.severity];
  const Icon   = SEVERITY_ICON[alert.severity];
  const isOpen = alert.status === 'Open';

  return (
    <View style={[styles.alertCard, { borderColor: `${color}25` }]}>
      {/* Top accent */}
      <View style={[styles.alertAccent, { backgroundColor: color }]} />

      <View style={styles.alertBody}>
        {/* Icon badge */}
        <View style={[styles.alertIconBadge, { backgroundColor: bg }]}>
          <Icon size={18} color={color} />
        </View>

        {/* Content */}
        <View style={styles.alertContent}>
          <View style={styles.alertTopRow}>
            <Text style={styles.alertType}>{alert.type}</Text>
            <View style={[
              styles.severityPill,
              { backgroundColor: bg, borderColor: `${color}30` },
            ]}>
              <Text style={[styles.severityText, { color }]}>{alert.severity}</Text>
            </View>
          </View>

          <Text style={styles.alertMessage}>{alert.message}</Text>

          <View style={styles.alertFooter}>
            {/* Member pill */}
            <View style={styles.memberPill}>
              <Text style={styles.memberPillText}>{alert.member}</Text>
            </View>

            {/* Time */}
            <Text style={styles.alertTime}>{timeAgo(alert.timestamp)}</Text>

            {/* Status */}
            {isOpen ? (
              <View style={[styles.statusPill, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <Clock size={9} color={COLORS.red} />
                <Text style={[styles.statusPillText, { color: COLORS.red }]}>Open</Text>
              </View>
            ) : (
              <View style={[styles.statusPill, { backgroundColor: 'rgba(45,212,191,0.12)' }]}>
                <CheckCircle size={9} color={COLORS.tealLight} />
                <Text style={[styles.statusPillText, { color: COLORS.tealLight }]}>Resolved</Text>
              </View>
            )}
          </View>

          {/* Resolve button */}
          {isOpen && (
            <TouchableOpacity
              style={styles.resolveBtn}
              onPress={() => onResolve(alert.id)}
              activeOpacity={0.8}
            >
              <CheckCircle size={13} color={COLORS.tealLight} />
              <Text style={styles.resolveBtnText}>Mark Resolved</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function AlertsScreen() {
  const [filter, setFilter] = useState('All');
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  const filtered = filter === 'All'
    ? alerts
    : alerts.filter(a => a.status === filter);

  const criticalCnt = alerts.filter(a => a.severity === 'Critical' && a.status === 'Open').length;
  const warningCnt  = alerts.filter(a => a.severity === 'Warning'  && a.status === 'Open').length;
  const infoCnt     = alerts.filter(a => a.severity === 'Info'     && a.status === 'Open').length;

  const handleResolve = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Title */}
      <View style={styles.titleRow}>
        <Bell size={18} color={COLORS.amberLight} />
        <Text style={styles.screenTitle}>System Alerts</Text>
      </View>

      {/* Severity Summary */}
      <View style={styles.severitySummaryRow}>
        <View style={[styles.severityCard, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)' }]}>
          <AlertTriangle size={16} color={COLORS.red} />
          <Text style={[styles.severityCount, { color: COLORS.red }]}>{criticalCnt}</Text>
          <Text style={styles.severityLabel}>Critical</Text>
        </View>
        <View style={[styles.severityCard, { backgroundColor: 'rgba(251,191,36,0.1)', borderColor: 'rgba(251,191,36,0.2)' }]}>
          <AlertTriangle size={16} color={COLORS.amberLight} />
          <Text style={[styles.severityCount, { color: COLORS.amberLight }]}>{warningCnt}</Text>
          <Text style={styles.severityLabel}>Warning</Text>
        </View>
        <View style={[styles.severityCard, { backgroundColor: 'rgba(45,212,191,0.1)', borderColor: 'rgba(45,212,191,0.2)' }]}>
          <Info size={16} color={COLORS.tealLight} />
          <Text style={[styles.severityCount, { color: COLORS.tealLight }]}>{infoCnt}</Text>
          <Text style={styles.severityLabel}>Info</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Alert Cards */}
      {filtered.length === 0 ? (
        <View style={[GLASS.card, styles.emptyCard]}>
          <CheckCircle size={28} color={COLORS.tealLight} />
          <Text style={styles.emptyTitle}>All Clear!</Text>
          <Text style={styles.emptyText}>No alerts in this category.</Text>
        </View>
      ) : (
        filtered.map(alert => (
          <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
        ))
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 12 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },

  severitySummaryRow: { flexDirection: 'row', gap: 10 },
  severityCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  severityCount: { fontSize: 24, fontWeight: '800' },
  severityLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },

  filterRow: { gap: 6 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderColor: 'rgba(245,158,11,0.35)',
  },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  filterTextActive: { color: COLORS.amberLight, fontWeight: '700' },

  alertCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  alertAccent: { height: 3, width: '100%' },
  alertBody: { flexDirection: 'row', gap: 12, padding: 14 },
  alertIconBadge: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  alertContent: { flex: 1, gap: 8 },
  alertTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertType: { fontSize: 14, fontWeight: '800', color: COLORS.textBright, flex: 1, marginRight: 8 },
  severityPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  severityText: { fontSize: 10, fontWeight: '700' },
  alertMessage: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, fontWeight: '500' },
  alertFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  memberPill: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  memberPillText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600' },
  alertTime: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  resolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45,212,191,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resolveBtnText: { fontSize: 12, color: COLORS.tealLight, fontWeight: '700' },

  emptyCard: { padding: 32, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textBright },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
});
