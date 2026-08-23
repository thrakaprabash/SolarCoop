import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, GLASS, SHADOWS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import {
  COMMUNITY_STATS,
  MOCK_ALERTS,
  MOCK_COMPLAINTS,
  MOCK_TRANSACTIONS,
  timeAgo,
} from '../data/mockAdminData';
import {
  Users,
  Sun,
  Zap,
  BatteryCharging,
  AlertTriangle,
  MessageSquare,
  Clock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react-native';

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconColor, iconBg, label, value, unit, trend, trendUp }) {
  return (
    <View style={[styles.statCell, { borderColor: `${iconColor}22` }]}>
      <View style={[styles.statIconBadge, { backgroundColor: iconBg }]}>
        <Icon size={15} color={iconColor} />
      </View>
      <Text style={styles.statValue}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend != null && (
        <View style={styles.statTrend}>
          {trendUp ? (
            <TrendingUp size={9} color={COLORS.tealLight} />
          ) : (
            <TrendingDown size={9} color={COLORS.red} />
          )}
          <Text style={[styles.statTrendText, { color: trendUp ? COLORS.tealLight : COLORS.red }]}>
            {trend}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── System Health Panel ────────────────────────────────────────────────────
function SystemHealthPanel() {
  const services = [
    { label: 'Application Server', status: 'Online',   color: COLORS.tealLight },
    { label: 'Database',           status: 'Online',   color: COLORS.tealLight },
    { label: 'Solar Grid Feed',    status: 'Degraded', color: COLORS.amberLight },
    { label: 'Notification Service', status: 'Online', color: COLORS.tealLight },
  ];

  return (
    <View style={[GLASS.card, styles.sectionCard]}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      {services.map((s, i) => (
        <View key={i} style={styles.healthRow}>
          <View style={[styles.healthDot, { backgroundColor: s.color }]} />
          <Text style={styles.healthLabel}>{s.label}</Text>
          <Text style={[styles.healthStatus, { color: s.color }]}>{s.status}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Recent Activity Feed ────────────────────────────────────────────────────
function getActivityFeed() {
  const events = [];

  MOCK_ALERTS.filter(a => a.status === 'Open').slice(0, 2).forEach(a => {
    events.push({
      id: `alert-${a.id}`,
      color: a.severity === 'Critical' ? COLORS.red : COLORS.amberLight,
      icon: AlertTriangle,
      label: `${a.type} — ${a.member}`,
      time: a.timestamp,
    });
  });

  MOCK_COMPLAINTS.filter(c => c.status === 'Open').slice(0, 2).forEach(c => {
    events.push({
      id: `complaint-${c.id}`,
      color: COLORS.amber,
      icon: MessageSquare,
      label: `Complaint: ${c.type} — ${c.household}`,
      time: c.submittedAt,
    });
  });

  MOCK_TRANSACTIONS.filter(t => t.status === 'Pending').slice(0, 2).forEach(t => {
    events.push({
      id: `tx-${t.id}`,
      color: COLORS.tealLight,
      icon: ArrowUpRight,
      label: `Pending Transfer: ${t.sender} → ${t.receiver} · ${t.amount} kWh`,
      time: t.timestamp,
    });
  });

  return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AdminDashboardScreen() {
  const { adminHeaderToggle, adminMetricChip, setAdminBottomTab } = useAdmin();
  const feed = getActivityFeed();

  const stats = [
    {
      icon: Users,
      iconColor: COLORS.amberLight,
      iconBg: 'rgba(245,158,11,0.15)',
      label: 'Members',
      value: COMMUNITY_STATS.totalMembers,
      unit: null,
      trend: '+2 this month',
      trendUp: true,
      chips: ['all'],
    },
    {
      icon: Sun,
      iconColor: '#FBBF24',
      iconBg: 'rgba(251,191,36,0.12)',
      label: 'Production',
      value: COMMUNITY_STATS.totalProduction,
      unit: 'kWh',
      trend: '+8.3%',
      trendUp: true,
      chips: ['all', 'production'],
    },
    {
      icon: Zap,
      iconColor: COLORS.teal,
      iconBg: 'rgba(20,184,166,0.12)',
      label: 'Consumption',
      value: COMMUNITY_STATS.totalConsumption,
      unit: 'kWh',
      trend: '+2.1%',
      trendUp: false,
      chips: ['all', 'consumption'],
    },
    {
      icon: BatteryCharging,
      iconColor: COLORS.tealLight,
      iconBg: 'rgba(45,212,191,0.12)',
      label: 'Surplus',
      value: COMMUNITY_STATS.totalSurplus,
      unit: 'kWh',
      trend: '+15.4%',
      trendUp: true,
      chips: ['all', 'surplus'],
    },
    {
      icon: AlertTriangle,
      iconColor: COLORS.red,
      iconBg: 'rgba(239,68,68,0.12)',
      label: 'Open Alerts',
      value: COMMUNITY_STATS.openAlerts,
      unit: null,
      trend: null,
      chips: ['all'],
    },
    {
      icon: MessageSquare,
      iconColor: COLORS.amber,
      iconBg: 'rgba(245,158,11,0.12)',
      label: 'Complaints',
      value: COMMUNITY_STATS.openComplaints,
      unit: null,
      trend: null,
      chips: ['all'],
    },
  ];

  const visibleStats = adminMetricChip === 'all'
    ? stats
    : stats.filter(s => s.chips.includes(adminMetricChip));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Section Title */}
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>
          {adminHeaderToggle === 'health' ? 'System Health' : 'Community Overview'}
        </Text>
        <Text style={styles.screenDate}>
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>

      {/* System Health Panel (only when toggle = health) */}
      {adminHeaderToggle === 'health' && <SystemHealthPanel />}

      {/* Community Stats Grid */}
      <View style={[GLASS.card, styles.statsCard]}>
        <Text style={styles.sectionTitle}>Community Stats — Today</Text>
        <View style={styles.statsGrid}>
          {visibleStats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </View>
      </View>

      {/* Member Breakdown Bar */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Member Status</Text>
        <View style={styles.memberBreakdownRow}>
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNum, { color: COLORS.tealLight }]}>{COMMUNITY_STATS.activeMembers}</Text>
            <Text style={styles.breakdownLabel}>Active</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNum, { color: COLORS.amberLight }]}>{COMMUNITY_STATS.inactiveMembers}</Text>
            <Text style={styles.breakdownLabel}>Inactive</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownItem}>
            <Text style={[styles.breakdownNum, { color: COLORS.red }]}>{COMMUNITY_STATS.suspendedMembers}</Text>
            <Text style={styles.breakdownLabel}>Suspended</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressSegment, {
            flex: COMMUNITY_STATS.activeMembers,
            backgroundColor: COLORS.teal,
            borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
          }]} />
          <View style={[styles.progressSegment, {
            flex: COMMUNITY_STATS.inactiveMembers,
            backgroundColor: COLORS.amber,
          }]} />
          <View style={[styles.progressSegment, {
            flex: COMMUNITY_STATS.suspendedMembers,
            backgroundColor: COLORS.red,
            borderTopRightRadius: 4, borderBottomRightRadius: 4,
          }]} />
        </View>
      </View>

      {/* Energy Flow Visualization */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Energy Flow</Text>
          <Text style={styles.sectionSubtext}>Community · Today</Text>
        </View>
        <View style={styles.energyFlowRow}>
          {[
            { size: 28, color: COLORS.amber,    opacity: 0.6 },
            { size: 42, color: COLORS.amberLight, opacity: 0.5 },
            { size: 20, color: COLORS.amber,    opacity: 0.4 },
            { size: 56, color: COLORS.tealLight, opacity: 0.45 },
            { size: 34, color: COLORS.amber,    opacity: 0.55 },
            { size: 24, color: COLORS.tealLight, opacity: 0.35 },
            { size: 38, color: COLORS.amberLight, opacity: 0.5 },
            { size: 18, color: COLORS.teal,     opacity: 0.4 },
          ].map((b, idx) => (
            <View
              key={idx}
              style={{
                width: b.size,
                height: b.size,
                borderRadius: b.size / 2,
                backgroundColor: b.color,
                opacity: b.opacity,
              }}
            />
          ))}
        </View>
        <View style={styles.flowLegendRow}>
          <View style={styles.flowLegend}>
            <View style={[styles.flowDot, { backgroundColor: COLORS.amber }]} />
            <Text style={styles.flowLegendText}>Production {COMMUNITY_STATS.totalProduction} kWh</Text>
          </View>
          <View style={styles.flowLegend}>
            <View style={[styles.flowDot, { backgroundColor: COLORS.tealLight }]} />
            <Text style={styles.flowLegendText}>Consumption {COMMUNITY_STATS.totalConsumption} kWh</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity Feed */}
      <View style={[GLASS.card, styles.sectionCard]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {feed.map(event => {
          const Icon = event.icon;
          return (
            <View key={event.id} style={styles.feedRow}>
              <View style={[styles.feedAccentBar, { backgroundColor: event.color }]} />
              <View style={[styles.feedIconBadge, { backgroundColor: `${event.color}18` }]}>
                <Icon size={13} color={event.color} />
              </View>
              <View style={styles.feedContent}>
                <Text style={styles.feedLabel} numberOfLines={1}>{event.label}</Text>
                <Text style={styles.feedTime}>{timeAgo(event.time)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Quick Admin Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtnRed}
          onPress={() => setAdminBottomTab('alerts')}
          activeOpacity={0.8}
        >
          <AlertTriangle size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>View Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtnAmber}
          onPress={() => setAdminBottomTab('reports')}
          activeOpacity={0.8}
        >
          <MessageSquare size={16} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Complaints</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 14 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textBright, letterSpacing: -0.3 },
  screenDate: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  statsCard: { padding: 16, gap: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCell: {
    flex: 1,
    minWidth: '44%',
    borderRadius: 18,
    padding: 14,
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },
  statIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.textBright },
  statUnit: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  statTrend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statTrendText: { fontSize: 10, fontWeight: '700' },

  sectionCard: { padding: 16, gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textBright },
  sectionSubtext: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  // System health
  liveChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(20,184,166,0.12)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.tealLight },
  liveText: { fontSize: 9, fontWeight: '800', color: COLORS.tealLight, letterSpacing: 0.8 },
  healthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  healthStatus: { fontSize: 12, fontWeight: '700' },

  // Member breakdown
  memberBreakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  breakdownItem: { alignItems: 'center', gap: 4 },
  breakdownNum: { fontSize: 26, fontWeight: '800' },
  breakdownLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  breakdownDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  progressBarBg: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' },
  progressSegment: { height: 8 },

  // Energy flow
  energyFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    height: 70,
  },
  flowLegendRow: { flexDirection: 'row', gap: 16 },
  flowLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flowDot: { width: 8, height: 8, borderRadius: 4 },
  flowLegendText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },

  // Activity feed
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  feedAccentBar: { width: 3, height: 36, borderRadius: 2 },
  feedIconBadge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  feedContent: { flex: 1, gap: 2 },
  feedLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  feedTime: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtnRed: {
    flex: 1,
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
    ...SHADOWS.glow,
  },
  actionBtnAmber: {
    flex: 1,
    backgroundColor: 'rgba(245,158,11,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
