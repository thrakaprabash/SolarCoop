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
 *   • Detail rows — Name, Mobile Number, Household ID and "Solar Capacity:
 *     X kW" which renders ONLY for solar owners.
 *   • "Edit Profile" toggle → editable AuthFields for Name, Mobile Number and
 *     Household ID, persisted to the Supabase `profiles` table in real time
 *     via AuthContext `updateProfile`.
 *   • "Logout" button that triggers the SOL-92 cross-platform confirmation
 *     dialog ("Are you sure you want to log out of SolarCoop?"). On web it
 *     uses `window.confirm`, on native a destructive Alert — so the prompt
 *     is visible everywhere.
 *
 * The profile is re-fetched on mount so a status change made by an admin
 * (e.g. approving a pending owner) shows up immediately.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Activity,
  Check,
  Home as HomeIcon,
  LogOut,
  Pencil,
  Phone,
  Shield,
  Sun,
  User as UserIcon,
  X,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';
import { PrimaryButton } from '../components/auth/PrimaryButton';
import { AuthField } from '../components/auth/AuthField';
import { showAlert, showConfirm } from '../utils/alert';

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
  const { user, profile, signOut, loading, refreshProfile, updateProfile } =
    useAuth();
  const theme = useTheme();
  const { colors } = theme;

  // ── Edit-mode state ─────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Live status: pull the freshest profile row (admin may have just approved
  // or blocked this account).
  useEffect(() => {
    refreshProfile().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed the edit form from the freshest profile/user values whenever they
  // change, but never clobber the user's in-progress edits.
  useEffect(() => {
    if (editing) return;
    setName(profile?.name || user?.user_metadata?.name || '');
    setMobileNumber(profile?.mobile_number || '');
    setHouseholdId(profile?.household_id || '');
  }, [profile, user, editing]);

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

  const clearError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleToggleEdit = () => {
    if (saving) return;
    if (editing) {
      // Cancel: revert any unsaved changes and exit edit mode.
      setEditing(false);
      setFieldErrors({});
      setName(profile?.name || user?.user_metadata?.name || '');
      setMobileNumber(profile?.mobile_number || '');
      setHouseholdId(profile?.household_id || '');
    } else {
      setEditing(true);
      setFieldErrors({});
    }
  };

  const handleSave = async () => {
    if (saving) return; // prevent double submissions

    const trimmedName = name.trim();
    const trimmedMobile = mobileNumber.trim();
    const trimmedHousehold = householdId.trim();

    // ── Local validation ────────────────────────────────────────────────
    const nextErrors = {};
    if (!trimmedName) {
      nextErrors.name = 'Full name is required.';
    }
    if (trimmedMobile) {
      const digits = trimmedMobile.replace(/\D/g, '');
      if (digits.length < 9 || digits.length > 12) {
        nextErrors.mobileNumber = 'Enter a valid mobile number (9–12 digits).';
      }
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showAlert('Check your details', Object.values(nextErrors).join('\n'));
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        name: trimmedName,
        mobile_number: trimmedMobile || null,
        household_id: trimmedHousehold || null,
      });

      if (result.error) {
        showAlert(
          'Update Failed',
          result.error.message ||
            'An unknown error occurred. Please try again.',
        );
        return;
      }

      showAlert('Success!', 'Your profile has been updated.', [
        { text: 'OK' },
      ]);
      setEditing(false);
      setFieldErrors({});
    } catch (error) {
      showAlert(
        'Update Failed',
        error?.message || 'An unknown error occurred. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    showConfirm('Logout', 'Are you sure you want to log out of SolarCoop?', {
      confirmText: 'Log Out',
      cancelText: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        // Global signOut() clears the Supabase session + AsyncStorage token
        // and resets session/user/profile → the router returns to Login.
        await signOut();
      },
    });
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
          <View style={styles.detailsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Profile Details
            </Text>
            <TouchableOpacity
              onPress={handleToggleEdit}
              disabled={saving}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={editing ? 'Cancel editing' : 'Edit profile'}
            >
              <View style={styles.editToggle}>
                {editing ? (
                  <X size={15} color={colors.primary} strokeWidth={2.4} />
                ) : (
                  <Pencil size={14} color={colors.primary} strokeWidth={2.4} />
                )}
                <Text style={[styles.editToggleText, { color: colors.primary }]}>
                  {editing ? 'Cancel' : 'Edit'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <DetailRow
            icon={Shield}
            label="Registered Role"
            value={roleLabel}
          />

          {editing ? (
            <AuthField
              label="Full Name"
              icon={UserIcon}
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearError('name');
              }}
              placeholder="e.g. Amara Perera"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              error={fieldErrors.name}
            />
          ) : (
            <DetailRow
              icon={UserIcon}
              label="Full Name"
              value={displayName}
            />
          )}

          {editing ? (
            <AuthField
              label="Mobile Number"
              icon={Phone}
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text);
                clearError('mobileNumber');
              }}
              placeholder="e.g. +94 77 123 4567"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={fieldErrors.mobileNumber}
            />
          ) : (
            <DetailRow
              icon={Phone}
              label="Mobile Number"
              value={profile?.mobile_number || '—'}
            />
          )}

          {editing ? (
            <AuthField
              label="Household ID"
              icon={HomeIcon}
              value={householdId}
              onChangeText={(text) => {
                setHouseholdId(text);
                clearError('householdId');
              }}
              placeholder="e.g. H-0091"
              autoCapitalize="characters"
              autoComplete="off"
              error={fieldErrors.householdId}
            />
          ) : (
            <DetailRow
              icon={HomeIcon}
              label="Household ID"
              value={profile?.household_id || '—'}
            />
          )}

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

        {/* Save button — visible only while editing */}
        {editing ? (
          <PrimaryButton
            label="Save Changes"
            icon={Check}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
          />
        ) : null}

        {/* Logout (SOL-92 cross-platform confirmation) */}
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
    gap: 8,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(237, 137, 54, 0.1)',
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '800',
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
