/**
 * App.js — SolarCoop root with role-based routing & navigator integration.
 * ─────────────────────────────────────────────────────────────────────────────
 * Architectural rules implemented here (SOL-90 / SOL-94 / SOL-95 / SOL-113):
 *
 *   1. AUTH GATE (no active session)
 *      Routes to the AuthStack — Login ⇄ Register ⇄ Forgot Password. The
 *      gate keys off the Supabase SESSION (not just `user`), so an
 *      unconfirmed sign-up stays on the auth stack until a session exists.
 *
 *   2. ROLE ROUTER (active session)
 *      Resolves `profile.role` (+ status) and mounts the matching shell:
 *        admin       → AdminApp      (SOL-95 Member Management dashboard)
 *        technician  → TechnicianApp (SOL-113 Fault Diagnostics portal)
 *        owner / consumer → MemberApp (Household energy sharing dashboard)
 *      A Solar Owner with status 'pending_approval' can open their Profile,
 *      but every other tab shows a styled lock screen:
 *        "Your solar assets are currently pending Admin validation."
 *      The profile is re-fetched whenever the app returns to the foreground,
 *      so the moment an Admin flips the status to 'active' in the backend,
 *      sharing & trading tabs unlock automatically.
 *
 *   Note: react-navigation is not installed in this project, so the three
 *   "navigators" are implemented as state-driven shell routes. The structure
 *   maps 1:1 to AuthStackNavigator / AdminStackNavigator /
 *   TechnicianStackNavigator / MemberTabNavigator and can be lifted into
 *   react-navigation without changing the routing rules.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { EnergyProvider, useEnergy } from './src/context/EnergyContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Header } from './src/components/common/Header';
import { SegmentedTabs } from './src/components/common/SegmentedTabs';
import { BottomTaskBar } from './src/components/common/BottomTaskBar';
import { HomeDashboard } from './src/components/dashboard/HomeDashboard';
import { ProductionView } from './src/components/dashboard/ProductionView';
import { ConsumptionView } from './src/components/dashboard/ConsumptionView';
import { SurplusView } from './src/components/dashboard/SurplusView';
import { DeficitView } from './src/components/dashboard/DeficitView';
import { EnergyHistoryView } from './src/components/dashboard/EnergyHistoryView';
import { ChartsView } from './src/components/dashboard/ChartsView';
import { EnergySummaryView } from './src/components/dashboard/EnergySummaryView';
import { TradeRequestsPlaceholder } from './src/components/placeholders/TradeRequestsPlaceholder';
import { AlertsSupportPlaceholder } from './src/components/placeholders/AlertsSupportPlaceholder';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegistrationScreen } from './src/screens/RegistrationScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';
import { useTheme } from './src/theme/useTheme';
import {
  BadgeCheck,
  Ban,
  BatteryCharging,
  Gauge,
  Lock,
  RefreshCw,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Sun,
  TriangleAlert,
  User,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react-native';

/* ─── Shared presentational helpers ────────────────────────────────────────── */

const ROLE_LABELS = {
  consumer: 'Consumer',
  owner: 'Solar Owner',
  technician: 'Technician',
  admin: 'Administrator',
};

const ROLE_COLORS = {
  admin: '#EF4444', // Red
  owner: '#3B82F6', // Blue
  consumer: '#ED8936', // Orange
  technician: '#22C55E', // Green
};

const STATUS_LABELS = {
  active: 'Active',
  pending_approval: 'Pending Approval',
  pending: 'Pending Approval',
  blocked: 'Blocked',
  inactive: 'Inactive',
};

const STATUS_COLORS = {
  active: '#22C55E',
  pending_approval: '#F59E0B',
  pending: '#F59E0B',
  blocked: '#EF4444',
  inactive: '#94A3B8',
};

/** "Amara Perera" → "AP" */
const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

const StatusPill = ({ status }) => {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || '#94A3B8';
  return (
    <View
      style={[
        styles.statusPill,
        { backgroundColor: `${color}22`, borderColor: `${color}55` },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[styles.statusPillText, { color }]}>{label}</Text>
    </View>
  );
};

/* ─── Themed loading splash ────────────────────────────────────────────────── */

function LoadingSplash({ label = 'Loading SolarCoop…' }) {
  const theme = useTheme();
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent
      />
      <View
        style={[styles.loadingBadge, { backgroundColor: theme.colors.primarySoft }]}
      >
        <Sun size={26} color={theme.colors.primary} />
      </View>
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.loadingSpinner}
      />
      <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

/* ─── Auth stack (Login / Register / Forgot Password) ─────────────────────── */

function AuthGate() {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'

  switch (mode) {
    case 'register':
      return <RegistrationScreen onBackToLogin={() => setMode('login')} />;
    case 'forgot':
      return <ForgotPasswordScreen onBackToLogin={() => setMode('login')} />;
    case 'login':
    default:
      return (
        <LoginScreen
          onCreateAccount={() => setMode('register')}
          onForgotPassword={() => setMode('forgot')}
        />
      );
  }
}

/* ─── Dark-glass shell frame shared by every authenticated shell ───────────── */

function ShellFrame({ header, children }) {
  return (
    <ImageBackground
      source={require('./assets/bg.jpg')}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.safeArea}>
          {header}
          <View style={styles.mainContentContainer}>{children}</View>
        </View>
      </View>
    </ImageBackground>
  );
}

function PortalHeader({ title, subtitle, accentColor }) {
  const theme = useTheme();
  return (
    <View style={styles.portalHeader}>
      <View style={styles.portalBrandRow}>
        <View
          style={[
            styles.portalLogoBadge,
            { backgroundColor: `${accentColor}33`, borderColor: `${accentColor}88` },
          ]}
        >
          <Sun size={18} color={accentColor} />
        </View>
        <View>
          <Text style={styles.portalBrandName}>SolarCoop</Text>
          <Text style={[styles.portalBrandSub, { color: theme.colors.textSecondary }]}>
            Community Energy Sharing
          </Text>
        </View>
      </View>
      <Text style={styles.portalTitle}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.portalSubtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/* ─── Pending-approval lock screen (Solar Owners awaiting Admin validation) ── */

function PendingApprovalLock() {
  const theme = useTheme();
  const { refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.lockContainer}>
      <View style={[styles.lockIconCircle, { backgroundColor: theme.colors.primarySoft }]}>
        <Lock size={34} color={theme.colors.primary} strokeWidth={2.2} />
      </View>
      <Text style={[styles.lockTitle, { color: theme.colors.text }]}>
        Pending Admin Validation
      </Text>
      <Text style={[styles.lockMessage, { color: theme.colors.textSecondary }]}>
        Your solar assets are currently pending Admin validation.
      </Text>
      <Text style={[styles.lockHint, { color: theme.colors.textMuted }]}>
        You can still open your Profile. Energy sharing &amp; trading tabs
        unlock automatically as soon as an administrator activates your account.
      </Text>
      <TouchableOpacity
        style={[styles.lockRefreshBtn, { backgroundColor: theme.colors.primary }]}
        onPress={handleRefresh}
        disabled={refreshing}
        activeOpacity={0.85}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <RefreshCw size={16} color="#FFFFFF" />
            <Text style={styles.lockRefreshText}>Check Status</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ─── Member shell (Consumer / Solar Owner) ────────────────────────────────── */

function MemberApp() {
  const { profile, user } = useAuth();
  const { mainBottomTab, activeTab } = useEnergy();

  const role = profile?.role || user?.user_metadata?.role || 'consumer';
  const status =
    profile?.status || (role === 'owner' ? 'pending_approval' : 'active');
  // A solar owner awaiting admin validation may only open their Profile.
  const isPendingOwner = role === 'owner' && status === 'pending_approval';

  const renderDashboardView = () => {
    switch (activeTab) {
      case 'dashboard':   return <HomeDashboard />;
      case 'production':  return <ProductionView />;
      case 'consumption': return <ConsumptionView />;
      case 'surplus':     return <SurplusView />;
      case 'deficit':     return <DeficitView />;
      case 'history':     return <EnergyHistoryView />;
      case 'charts':      return <ChartsView />;
      case 'summary':     return <EnergySummaryView />;
      default:            return <HomeDashboard />;
    }
  };

  const renderMainContent = () => {
    // Guarding: pending solar owners see the lock screen everywhere except
    // their Profile (SOL-90 / SOL-95).
    if (isPendingOwner && mainBottomTab !== 'profile') {
      return <PendingApprovalLock />;
    }

    switch (mainBottomTab) {
      case 'dashboard':
        return (
          <View style={styles.dashboardContainer}>
            <SegmentedTabs />
            <View style={styles.viewContainer}>{renderDashboardView()}</View>
          </View>
        );
      case 'trade':   return <TradeRequestsPlaceholder />;
      case 'alerts':  return <AlertsSupportPlaceholder />;
      case 'profile': return <ProfileScreen />;
      default:
        return (
          <View style={styles.dashboardContainer}>
            <SegmentedTabs />
            <View style={styles.viewContainer}>{renderDashboardView()}</View>
          </View>
        );
    }
  };

  return (
    <ShellFrame header={<Header />}>
      {renderMainContent()}
      <BottomTaskBar />
    </ShellFrame>
  );
}

/* ─── Reusable bottom tab bar for the Admin / Technician shells ────────────── */

function ShellTabBar({ tabs, activeKey, onSelect }) {
  return (
    <View style={styles.shellTabBar}>
      {tabs.map((tab) => {
        const isActive = activeKey === tab.id;
        const IconComponent = tab.icon;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.shellTabItem}
            onPress={() => onSelect(tab.id)}
            activeOpacity={0.7}
          >
            <View
              style={[styles.shellTabIconWrap, isActive && styles.shellTabIconWrapActive]}
            >
              <IconComponent
                size={18}
                color={isActive ? '#FBBF24' : 'rgba(255,255,255,0.4)'}
              />
            </View>
            <Text
              style={[styles.shellTabLabel, isActive && styles.shellTabLabelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ─── Admin shell — SOL-95 Member Management dashboard ─────────────────────── */

function AdminMemberRow({ member, onApprove, onBlock, isSelf, busy }) {
  const role = member.role || 'consumer';
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.consumer;
  const status = member.status || 'pending';
  const showApprove = status === 'pending_approval' || status === 'pending';
  const showBlock = status === 'active';

  return (
    <View style={styles.adminMemberCard}>
      <View style={styles.adminMemberAvatar}>
        <Text style={[styles.adminMemberInitials, { color: roleColor }]}>
          {getInitials(member.name || member.email || 'Member')}
        </Text>
      </View>

      <View style={styles.adminMemberBody}>
        <View style={styles.adminMemberNameRow}>
          <Text style={styles.adminMemberName} numberOfLines={1}>
            {member.name || 'Unnamed member'}
          </Text>
          {isSelf ? <Text style={styles.adminSelfTag}>You</Text> : null}
        </View>
        <Text style={styles.adminMemberEmail} numberOfLines={1}>
          {member.email || '—'}
        </Text>
        <View style={styles.adminMemberMetaRow}>
          <View
            style={[
              styles.roleTag,
              { backgroundColor: `${roleColor}22`, borderColor: `${roleColor}55` },
            ]}
          >
            <Text style={[styles.roleTagText, { color: roleColor }]}>
              {ROLE_LABELS[role] || role}
            </Text>
          </View>
          <StatusPill status={status} />
        </View>
      </View>

      {!isSelf ? (
        <View style={styles.adminMemberActions}>
          {showApprove ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => onApprove(member)}
              disabled={busy}
              activeOpacity={0.8}
            >
              <UserCheck size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>
          ) : null}
          {showBlock ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.blockBtn]}
              onPress={() => onBlock(member)}
              disabled={busy}
              activeOpacity={0.8}
            >
              <Ban size={14} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Block</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function AdminApp() {
  const { profile, fetchAllProfiles, adminUpdateProfileStatus } = useAuth();
  const [tab, setTab] = useState('members'); // 'members' | 'profile'
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberError, setMemberError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    setMemberError(null);
    try {
      const rows = await fetchAllProfiles();
      setMembers(rows);
    } catch (error) {
      console.warn('[AdminApp] Member directory unavailable:', error.message);
      setMemberError(
        'Member directory is unavailable. Check that your admin role has ' +
          'SELECT/UPDATE policies on the profiles table.',
      );
    } finally {
      setLoadingMembers(false);
    }
  }, [fetchAllProfiles]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleApprove = async (member) => {
    setBusyId(member.id);
    try {
      await adminUpdateProfileStatus(member.id, 'active');
      Alert.alert('Member approved', `${member.name || 'Member'} is now Active.`);
      await loadMembers();
    } catch (error) {
      Alert.alert('Approval failed', error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleBlock = async (member) => {
    Alert.alert(
      'Block member?',
      `${member.name || 'This member'} will lose access to SolarCoop features.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            setBusyId(member.id);
            try {
              await adminUpdateProfileStatus(member.id, 'blocked');
              Alert.alert('Member blocked', `${member.name || 'Member'} has been blocked.`);
              await loadMembers();
            } catch (error) {
              Alert.alert('Block failed', error.message);
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const pendingCount = members.filter(
    (m) => m.status === 'pending_approval' || m.status === 'pending',
  ).length;
  const activeCount = members.filter((m) => m.status === 'active').length;

  if (tab === 'profile') {
    return (
      <ShellFrame
        header={
          <PortalHeader
            title="My Profile"
            subtitle="Your administrator account details"
            accentColor={ROLE_COLORS.admin}
          />
        }
      >
        <ProfileScreen />
        <ShellTabBar
          tabs={[
            { id: 'members', label: 'Members', icon: Users },
            { id: 'profile', label: 'My Profile', icon: User },
          ]}
          activeKey={tab}
          onSelect={setTab}
        />
      </ShellFrame>
    );
  }

  return (
    <ShellFrame
      header={
        <PortalHeader
          title="Admin Portal"
          subtitle="Member Management (SOL-95)"
          accentColor={ROLE_COLORS.admin}
        />
      }
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.adminScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: ROLE_COLORS.admin + '55' }]}>
            <Users size={18} color={ROLE_COLORS.admin} />
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
          <View style={styles.statCard}>
            <TriangleAlert size={18} color="#F59E0B" />
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending Approval</Text>
          </View>
          <View style={styles.statCard}>
            <BadgeCheck size={18} color="#22C55E" />
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {memberError ? (
          <View style={styles.noticeCard}>
            <ShieldAlert size={16} color="#F59E0B" />
            <Text style={styles.noticeText}>{memberError}</Text>
          </View>
        ) : null}

        {loadingMembers ? (
          <View style={styles.listLoading}>
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text style={styles.listLoadingText}>Loading members…</Text>
          </View>
        ) : (
          <View style={styles.memberList}>
            {members.length === 0 && !memberError ? (
              <Text style={styles.emptyListText}>No members found yet.</Text>
            ) : (
              members.map((member) => (
                <AdminMemberRow
                  key={member.id}
                  member={member}
                  isSelf={member.id === profile?.id}
                  busy={busyId === member.id}
                  onApprove={handleApprove}
                  onBlock={handleBlock}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <ShellTabBar
        tabs={[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'profile', label: 'My Profile', icon: User },
        ]}
        activeKey={tab}
        onSelect={setTab}
      />
    </ShellFrame>
  );
}

/* ─── Technician shell — SOL-113 Fault Diagnostics portal ──────────────────── */

const FAULT_TASKS = [
  {
    id: 'FLT-1042',
    household: 'Household H-0091',
    device: 'Grid-Tie Inverter',
    severity: 'High',
    status: 'open',
    icon: ServerCog,
  },
  {
    id: 'FLT-1038',
    household: 'Household H-0114',
    device: 'Battery Bank',
    severity: 'Medium',
    status: 'assigned',
    icon: BatteryCharging,
  },
  {
    id: 'FLT-1031',
    household: 'Household H-0087',
    device: 'Net Meter',
    severity: 'Low',
    status: 'resolved',
    icon: Gauge,
  },
];

const FAULT_STATUS_META = {
  open: { label: 'Open', color: '#EF4444' },
  assigned: { label: 'Assigned', color: '#F59E0B' },
  resolved: { label: 'Resolved', color: '#22C55E' },
};

function TechnicianApp() {
  const [tab, setTab] = useState('diagnostics'); // 'diagnostics' | 'profile'

  if (tab === 'profile') {
    return (
      <ShellFrame
        header={
          <PortalHeader
            title="My Profile"
            subtitle="Your technician account details"
            accentColor={ROLE_COLORS.technician}
          />
        }
      >
        <ProfileScreen />
        <ShellTabBar
          tabs={[
            { id: 'diagnostics', label: 'Diagnostics', icon: Wrench },
            { id: 'profile', label: 'My Profile', icon: User },
          ]}
          activeKey={tab}
          onSelect={setTab}
        />
      </ShellFrame>
    );
  }

  const openCount = FAULT_TASKS.filter((f) => f.status === 'open').length;

  return (
    <ShellFrame
      header={
        <PortalHeader
          title="Technician Portal"
          subtitle="Fault Diagnostics (SOL-113)"
          accentColor={ROLE_COLORS.technician}
        />
      }
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.techScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.techSummaryCard}>
          <View style={styles.techSummaryIcon}>
            <ShieldCheck size={22} color="#22C55E" />
          </View>
          <View style={styles.techSummaryBody}>
            <Text style={styles.techSummaryTitle}>
              {openCount} open fault{openCount === 1 ? '' : 's'}
            </Text>
            <Text style={styles.techSummarySub}>
              Assigned maintenance jobs across the community grid
            </Text>
          </View>
        </View>

        <Text style={styles.techSectionLabel}>Fault Diagnostics</Text>
        {FAULT_TASKS.map((fault) => {
          const FaultIcon = fault.icon;
          const meta = FAULT_STATUS_META[fault.status] || FAULT_STATUS_META.open;
          return (
            <View key={fault.id} style={styles.faultCard}>
              <View
                style={[
                  styles.faultIconWrap,
                  { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}55` },
                ]}
              >
                <FaultIcon size={20} color={meta.color} />
              </View>
              <View style={styles.faultBody}>
                <View style={styles.faultIdRow}>
                  <Text style={styles.faultId}>{fault.id}</Text>
                  <View
                    style={[
                      styles.faultStatusTag,
                      { backgroundColor: `${meta.color}22`, borderColor: `${meta.color}55` },
                    ]}
                  >
                    <Text style={[styles.faultStatusText, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.faultDevice}>{fault.device}</Text>
                <Text style={styles.faultHousehold}>{fault.household}</Text>
              </View>
            </View>
          );
        })}

        <Text style={styles.techNote}>
          Portal scaffold — live fault ingestion from the community grid will
          be wired to the backend in a later sprint.
        </Text>
      </ScrollView>

      <ShellTabBar
        tabs={[
          { id: 'diagnostics', label: 'Diagnostics', icon: Wrench },
          { id: 'profile', label: 'My Profile', icon: User },
        ]}
        activeKey={tab}
        onSelect={setTab}
      />
    </ShellFrame>
  );
}

/* ─── Role router — the top-level authenticated gate ───────────────────────── */

function RoleRouter() {
  const { session, user, profile, loading, refreshProfile } = useAuth();

  // Auto-unlock: re-fetch the profile whenever the app returns to the
  // foreground, so an Admin status change to 'active' unlocks a pending
  // solar owner's sharing/trading tabs without a manual re-login.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshProfile().catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [refreshProfile]);

  if (loading) {
    return <LoadingSplash />;
  }

  // No active session → AuthStack (Login / Register / Forgot Password).
  if (!session) {
    return <AuthGate />;
  }

  // Session exists → resolve role (profile row is authoritative; fall back
  // to raw user metadata while the profile is syncing or unavailable).
  const role = profile?.role || user?.user_metadata?.role || 'consumer';

  switch (role) {
    case 'admin':
      return <AdminApp />;
    case 'technician':
      return <TechnicianApp />;
    case 'owner':
    case 'consumer':
    default:
      return <MemberApp />;
  }
}

/* ─── Root App ─────────────────────────────────────────────────────────────── */

export default function App() {
  return (
    <AuthProvider>
      <EnergyProvider>
        <RoleRouter />
      </EnergyProvider>
    </AuthProvider>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bgImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(5, 8, 22, 0.55)' },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 50,
  },
  mainContentContainer: { flex: 1 },
  dashboardContainer: { flex: 1 },
  viewContainer: { flex: 1 },

  /* Splash */
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  loadingSpinner: { marginTop: 8 },
  loadingText: { fontSize: 13, fontWeight: '600' },

  /* Portal header */
  portalHeader: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  portalBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  portalLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalBrandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  portalBrandSub: { fontSize: 11, fontWeight: '600' },
  portalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginTop: 4,
  },
  portalSubtitle: { fontSize: 13, marginTop: -6 },

  /* Pending approval lock */
  lockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  lockIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  lockMessage: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  lockHint: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  lockRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 12,
  },
  lockRefreshText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Shell tab bar (admin / technician) */
  shellTabBar: {
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
  shellTabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  shellTabIconWrap: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shellTabIconWrapActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  shellTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  shellTabLabelActive: {
    fontWeight: '800',
    color: '#FBBF24',
  },

  /* Admin dashboard */
  adminScroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    padding: 12,
  },
  noticeText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    lineHeight: 17,
  },
  listLoading: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  listLoadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  memberList: { gap: 12 },
  emptyListText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 30,
  },
  adminMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 12,
  },
  adminMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminMemberInitials: { fontSize: 15, fontWeight: '800' },
  adminMemberBody: { flex: 1, gap: 2, minWidth: 0 },
  adminMemberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminMemberName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  adminSelfTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FBBF24',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  adminMemberEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  adminMemberMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  roleTag: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleTagText: { fontSize: 10, fontWeight: '800' },
  adminMemberActions: { gap: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    minWidth: 86,
  },
  approveBtn: { backgroundColor: '#22C55E' },
  blockBtn: { backgroundColor: '#EF4444' },
  actionBtnText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' },

  /* Status pill (shared) */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '800' },

  /* Technician portal */
  techScroll: { padding: 16, paddingBottom: 32, gap: 12 },
  techSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 16,
    padding: 14,
  },
  techSummaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  techSummaryBody: { flex: 1 },
  techSummaryTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  techSummarySub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  techSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 4,
  },
  faultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 12,
  },
  faultIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faultBody: { flex: 1, gap: 2, minWidth: 0 },
  faultIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faultId: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  faultStatusTag: {
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 9,
  },
  faultStatusText: { fontSize: 9.5, fontWeight: '800' },
  faultDevice: { fontSize: 13, fontWeight: '700', color: 'rgba(255, 255, 255, 0.85)' },
  faultHousehold: { fontSize: 11.5, color: 'rgba(255, 255, 255, 0.5)' },
  techNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
});
