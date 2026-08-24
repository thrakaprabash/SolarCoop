/**
 * src/screens/ProfileScreen.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SOL-93 / SOL-92: Universal "My Profile" — accessible by EVERY user type
 * (Consumer, Solar Owner, Technician, Admin) with dynamic content driven by
 * the logged-in credentials:
 *
 *   • Hero card tinted by the member's role color (Admin red, Owner blue,
 *     Consumer orange, Technician green) with a modern initials avatar.
 *   • Role badge + "Status: Active / Pending Approval" badge (SOL-95).
 *   • Detail rows — Mobile Number, Household ID and "Solar Capacity: X kW"
 *     which renders ONLY for solar owners.
 *   • "Logout" button that triggers the SOL-92 native confirmation alert:
 *       Title    "Logout"
 *       Message  "Are you sure you want to log out of SolarCoop?"
 *       Buttons  Cancel (cancel) · Log Out (destructive → global signOut,
 *                which also clears the AsyncStorage session token).
 *
 * The profile is re-fetched on mount so a status change made by an admin
 * (e.g. approving a pending owner) shows up immediately.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  Home as HomeIcon,
  LogOut,
  Phone,
  Shield,
  Sun,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/auth/PrimaryButton';

const ROLE_LABELS = {
  consumer: 'Consumer',
  owner: 'Solar Owner',
  technician: 'Technician',
  admin: 'Administrator',
};

/** Role → accent palette (badge text, soft background, hero gradient). */
const ROLE_THEMES = {
  admin: {
    color: '#EF4444', // Red
    gradient: ['#F87171', '#EF4444', '#B91C1C'],
  },
  owner: {
    color: '#3B82F6', // Blue
    gradient: ['#60A5FA', '#3B82F6', '#1D4ED8'],
  },
  consumer: {
    color: '#ED8936', // Orange
    gradient: ['#F6AD55', '#ED8936', '#C05621'],
  },
  technician: {
    color: '#22C55E', // Green
    gradient: ['#4ADE80', '#22C55E', '#15803D'],
  },
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
  if (parts.length === 0) return 'U'; // Unknown member
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

export const ProfileScreen = () => {
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const theme = useTheme();
  const { colors } = theme;

  // Live status: pull the freshest profile row (admin may have just approved
  // or blocked this account).
  useEffect(() => {
    refreshProfile().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName =
    profile?.name || user?.user_metadata?.name || user?.email || 'Member';
  const firstName = displayName.trim().split(/\s+/)[0];
  const role = profile?.role || user?.user_metadata?.role || 'consumer';
  const roleLabel = ROLE_LABELS[role] || role;

  const status = profile?.status || 'pending_approval';
  const statusLabel = STATUS_LABELS[status] || status;
  const statusColor = STATUS_COLORS[status] || '#94A3B8';

  const roleTheme = ROLE_THEMES[role] || ROLE_THEMES.consumer;

  // Solar capacity is an owner-only attribute (SOL-95).
  const isOwner = role === 'owner';
  const solarCapacityValue =
    isOwner && profile?.solar_capacity_kw != null
      ? `${profile.solar_capacity_kw} kW`
      : null;

  const handleSignOut = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of SolarCoop?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            // Global signOut() — also clears the AsyncStorage session token.
            await signOut();
          } catch (error) {
            Alert.alert('Sign out failed', error.message);
          }
        },
      },
    ]);
  };

  const DetailRow = ({ icon: Icon, label, value }) => (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowLabel}>
        <Icon size={15} color={roleTheme.color} strokeWidth={2.2} />
        <Text style={[styles.rowLabelText, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero member card — tinted by role */}
        <LinearGradient
          colors={roleTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.avatarCircle}>
            <Text style={[styles.avatarInitials, { color: colors.avatarText }]}>
              {getInitials(displayName)}
            </Text>
          </View>

          <Text style={styles.heroGreeting}>Welcome, {firstName}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>

          <View style={styles.badgeRow}>
            {/* Role badge */}
            <View style={styles.roleBadge}>
              <Shield size={12} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.badgeText}>{roleLabel}</Text>
            </View>

            {/* Status badge */}
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: `${statusColor}33`,
                  borderColor: `${statusColor}66`,
                },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                Status: {statusLabel}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Details card */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Profile Details
          </Text>

          <DetailRow
            icon={Shield}
            label="Registered Role"
            value={roleLabel}
          />
          <DetailRow
            icon={Phone}
            label="Mobile Number"
            value={profile?.mobile_number || '—'}
          />
          <DetailRow
            icon={HomeIcon}
            label="Household ID"
            value={profile?.household_id || '—'}
          />

          {/* Owner-only attribute (SOL-95) */}
          {isOwner ? (
            <DetailRow
              icon={Sun}
              label="Solar Capacity"
              value={solarCapacityValue ?? '—'}
            />
          ) : null}

          <DetailRow
            icon={Activity}
            label="Account Status"
            value={statusLabel}
          />
        </View>

        {/* Logout (SOL-92 confirmation) */}
        <PrimaryButton
          label="Logout"
          variant="danger"
          icon={LogOut}
          onPress={handleSignOut}
          loading={loading}
          disabled={loading}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingTop: 28,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  rowLabelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
});
