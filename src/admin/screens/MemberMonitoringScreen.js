import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import { MOCK_MEMBERS } from '../data/mockAdminData';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Zap,
  Sun,
  BatteryCharging,
  Users,
} from 'lucide-react-native';

const STATUS_COLORS = {
  Active:    COLORS.tealLight,
  Inactive:  COLORS.amberLight,
  Suspended: COLORS.red,
};

const STATUS_BG = {
  Active:    'rgba(45,212,191,0.12)',
  Inactive:  'rgba(251,191,36,0.12)',
  Suspended: 'rgba(239,68,68,0.12)',
};

const FILTER_OPTS = ['All', 'Active', 'Inactive', 'Suspended'];

function MemberCard({ member, onPress }) {
  const accentColor = STATUS_COLORS[member.status];
  const hasSurplus = member.todaySurplus > 0;

  return (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => onPress(member)}
      activeOpacity={0.75}
    >
      {/* Left Status Accent Bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.35)' }]}>
        <Text style={styles.avatarText}>
          {member.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </Text>
      </View>

      {/* Main Info */}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[member.status], borderColor: `${accentColor}40` }]}>
            <Text style={[styles.statusText, { color: accentColor }]}>{member.status}</Text>
          </View>
        </View>
        <Text style={styles.householdText}>{member.household} · {member.solarCapacity} kW</Text>

        {/* Mini Stats */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <Sun size={11} color={COLORS.amberLight} />
            <Text style={styles.miniStatText}>{member.todayProduction} kWh</Text>
          </View>
          <View style={styles.miniStat}>
            <Zap size={11} color={COLORS.teal} />
            <Text style={styles.miniStatText}>{member.todayConsumption} kWh</Text>
          </View>
          <View style={styles.miniStat}>
            {hasSurplus ? (
              <TrendingUp size={11} color={COLORS.tealLight} />
            ) : (
              <TrendingDown size={11} color={COLORS.red} />
            )}
            <Text style={[styles.miniStatText, { color: hasSurplus ? COLORS.tealLight : COLORS.red }]}>
              {hasSurplus ? '+' : ''}{member.todaySurplus.toFixed(1)} kWh
            </Text>
          </View>
        </View>

        {/* Mini Sparkline */}
        <View style={styles.sparklineRow}>
          {member.trend.map((val, i) => {
            const maxVal = Math.max(...member.trend, 1);
            const barH = Math.max((val / maxVal) * 20, 2);
            return (
              <View
                key={i}
                style={[
                  styles.sparkBar,
                  {
                    height: barH,
                    backgroundColor: i === member.trend.length - 1
                      ? COLORS.amberLight
                      : 'rgba(245,158,11,0.35)',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <ChevronRight size={16} color={COLORS.textMuted} />
    </TouchableOpacity>
  );
}

export default function MemberMonitoringScreen() {
  const { setSelectedMember, setAdminBottomTab } = useAdmin();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = MOCK_MEMBERS.filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.household.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || m.status === filter;
    return matchSearch && matchFilter;
  });

  const handleMemberPress = (member) => {
    setSelectedMember(member);
    setAdminBottomTab('memberDetail');
  };

  const activeCnt   = MOCK_MEMBERS.filter(m => m.status === 'Active').length;
  const inactiveCnt = MOCK_MEMBERS.filter(m => m.status === 'Inactive').length;
  const suspendCnt  = MOCK_MEMBERS.filter(m => m.status === 'Suspended').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Title */}
      <View style={styles.titleRow}>
        <Users size={18} color={COLORS.amberLight} />
        <Text style={styles.screenTitle}>Member Monitoring</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={15} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or household…"
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTER_OPTS.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.filterChip, filter === opt && styles.filterChipActive]}
            onPress={() => setFilter(opt)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filter === opt && styles.filterChipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Summary Strip */}
      <View style={styles.summaryStrip}>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(45,212,191,0.12)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.tealLight }]}>{activeCnt}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.tealLight }]}>Active</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(251,191,36,0.12)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.amberLight }]}>{inactiveCnt}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.amberLight }]}>Inactive</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.red }]}>{suspendCnt}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.red }]}>Suspended</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
          <Text style={[styles.summaryNum, { color: COLORS.textPrimary }]}>{filtered.length}</Text>
          <Text style={[styles.summaryLabel, { color: COLORS.textSecondary }]}>Shown</Text>
        </View>
      </View>

      {/* Member Cards */}
      {filtered.length === 0 ? (
        <View style={[GLASS.card, styles.emptyCard]}>
          <Text style={styles.emptyText}>No members match your search.</Text>
        </View>
      ) : (
        filtered.map(m => (
          <MemberCard key={m.id} member={m} onPress={handleMemberPress} />
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

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },

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
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  filterChipTextActive: { color: COLORS.amberLight, fontWeight: '700' },

  summaryStrip: { flexDirection: 'row', gap: 8 },
  summaryPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 14,
    gap: 2,
  },
  summaryNum: { fontSize: 18, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '600' },

  // Member Card
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 14,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 6,
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: COLORS.amberLight },
  cardBody: { flex: 1, gap: 5 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.textBright, flex: 1, marginRight: 8 },
  statusBadge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700' },
  householdText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  miniStatsRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniStatText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },

  // Sparkline
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 22,
    marginTop: 4,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 2,
  },

  emptyCard: { padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
});
