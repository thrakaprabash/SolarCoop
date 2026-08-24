import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS, GLASS } from '../../theme/colors';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
import {
  UserCog,
  ShieldCheck,
  Info,
  LogOut,
  ChevronRight,
  Edit3,
  Check,
  X,
  User,
  Phone,
  Home,
  Mail,
  Shield,
} from 'lucide-react-native';

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
};

export default function AdminSettingsScreen() {
  const { onExit, communityStats } = useAdmin();
  const { user, profile, updateProfile } = useAuth();

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [householdId, setHouseholdId] = useState('');
  const [saving, setSaving] = useState(false);

  // Populate local form when profile changes or Edit Mode opens
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setMobileNumber(profile.mobile_number || '');
      setHouseholdId(profile.household_id || '');
    }
  }, [profile]);

  const handleStartEdit = () => {
    setName(profile?.name || '');
    setMobileNumber(profile?.mobile_number || '');
    setHouseholdId(profile?.household_id || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setName(profile?.name || '');
    setMobileNumber(profile?.mobile_number || '');
    setHouseholdId(profile?.household_id || '');
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Full Name cannot be empty.');
      } else {
        Alert.alert('Validation Error', 'Full Name cannot be empty.');
      }
      return;
    }

    setSaving(true);
    try {
      const updates = {
        name: name.trim(),
        mobile_number: mobileNumber ? mobileNumber.trim() : null,
        household_id: householdId ? householdId.trim() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await updateProfile(updates);

      if (error) throw error;

      if (Platform.OS === 'web') {
        window.alert('Admin profile updated successfully!');
      } else {
        Alert.alert('Success', 'Admin profile updated successfully!');
      }
      setIsEditing(false);
    } catch (err) {
      const msg = err?.message || 'Failed to update profile details.';
      if (Platform.OS === 'web') {
        window.alert(`Update failed: ${msg}`);
      } else {
        Alert.alert('Update Failed', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm('Are you sure you want to sign out of the Admin Panel?')
        : true;
      if (confirmed) {
        onExit();
      }
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to sign out of the Admin Panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onExit },
      ]
    );
  };

  const menuItems = [
    { icon: Info,        label: 'About SolarCoop',  sub: 'Community Energy Sharing App v1.0.0' },
    { icon: ShieldCheck, label: 'Admin Privileges', sub: 'Full system access · Real-time Member Sync' },
    { icon: UserCog,     label: 'System Environment', sub: 'Expo SDK 57 · React Native 0.86' },
  ];

  const displayName = profile?.name || user?.user_metadata?.name || 'Administrator';
  const email = user?.email || 'admin@solarcoop.app';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Header Title */}
      <View style={styles.titleRow}>
        <UserCog size={18} color={COLORS.amberLight} />
        <Text style={styles.screenTitle}>Admin Profile</Text>
      </View>

      {/* Hero Card */}
      <View style={[GLASS.card, styles.profileCard]}>
        <View style={styles.profileBanner} />
        
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
        </View>

        <Text style={styles.adminName}>{displayName}</Text>
        <Text style={styles.adminEmail}>{email}</Text>

        <View style={styles.roleBadge}>
          <ShieldCheck size={12} color={COLORS.amberLight} />
          <Text style={styles.roleBadgeText}>SUPER ADMIN</Text>
        </View>

        {/* Live Admin Summary Stats */}
        <View style={styles.adminInfoRow}>
          <View style={styles.adminInfoItem}>
            <Text style={styles.adminInfoNum}>{communityStats ? communityStats.totalMembers : '--'}</Text>
            <Text style={styles.adminInfoLabel}>Members</Text>
          </View>
          <View style={styles.adminInfoDivider} />
          <View style={styles.adminInfoItem}>
            <Text style={styles.adminInfoNum}>{communityStats ? communityStats.activeMembers : '--'}</Text>
            <Text style={styles.adminInfoLabel}>Active</Text>
          </View>
          <View style={styles.adminInfoDivider} />
          <View style={styles.adminInfoItem}>
            <Text style={styles.adminInfoNum}>∞</Text>
            <Text style={styles.adminInfoLabel}>Access Level</Text>
          </View>
        </View>
      </View>

      {/* Profile Details Card (View Mode / Edit Mode) */}
      <View style={[GLASS.card, styles.detailsCard]}>
        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>Profile Information</Text>
          {!isEditing ? (
            <TouchableOpacity style={styles.editBtn} onPress={handleStartEdit} activeOpacity={0.7}>
              <Edit3 size={13} color={COLORS.amberLight} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cancelBtnTop} onPress={handleCancelEdit} disabled={saving} activeOpacity={0.7}>
              <X size={13} color={COLORS.textMuted} />
              <Text style={styles.cancelBtnTopText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isEditing ? (
          /* ── View Mode ── */
          <View style={styles.rowsContainer}>
            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <User size={15} color={COLORS.amberLight} />
                <Text style={styles.rowLabelText}>Full Name</Text>
              </View>
              <Text style={styles.rowValue}>{profile?.name || '—'}</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <Mail size={15} color={COLORS.amberLight} />
                <Text style={styles.rowLabelText}>Email Address</Text>
              </View>
              <Text style={styles.rowValue}>{email}</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <Phone size={15} color={COLORS.amberLight} />
                <Text style={styles.rowLabelText}>Mobile Number</Text>
              </View>
              <Text style={styles.rowValue}>{profile?.mobile_number || '—'}</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.rowLabel}>
                <Home size={15} color={COLORS.amberLight} />
                <Text style={styles.rowLabelText}>Household / Admin ID</Text>
              </View>
              <Text style={styles.rowValue}>{profile?.household_id || '—'}</Text>
            </View>

            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <View style={styles.rowLabel}>
                <Shield size={15} color={COLORS.amberLight} />
                <Text style={styles.rowLabelText}>Role</Text>
              </View>
              <Text style={styles.rowValue}>Administrator</Text>
            </View>
          </View>
        ) : (
          /* ── Edit Mode ── */
          <View style={styles.formContainer}>
            {/* Field: Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={15} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Field: Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Phone size={15} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="e.g. +94 77 123 4567"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Field: Household / Admin Dept ID */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Household / Admin ID</Text>
              <View style={styles.inputWrapper}>
                <Home size={15} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={householdId}
                  onChangeText={setHouseholdId}
                  placeholder="e.g. HH-ADMIN-01"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Edit Actions */}
            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={styles.cancelFormBtn}
                onPress={handleCancelEdit}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelFormBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveFormBtn, saving && styles.disabledBtn]}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.saveFormBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* System Information Card */}
      <View style={[GLASS.card, styles.menuCard]}>
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <View key={i}>
              <View style={styles.menuRow}>
                <View style={styles.menuIconWrap}>
                  <Icon size={16} color={COLORS.amberLight} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.textMuted} />
              </View>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </View>
          );
        })}
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color={COLORS.red} />
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, gap: 14 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },

  profileCard: { padding: 20, alignItems: 'center', gap: 10, overflow: 'hidden' },
  profileBanner: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 50,
    backgroundColor: 'rgba(245,158,11,0.1)',
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(245,158,11,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: COLORS.amberLight },
  adminName: { fontSize: 22, fontWeight: '800', color: COLORS.textBright, textAlign: 'center' },
  adminEmail: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleBadgeText: { color: COLORS.amberLight, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  adminInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', marginTop: 6 },
  adminInfoItem: { alignItems: 'center', gap: 3 },
  adminInfoNum: { fontSize: 20, fontWeight: '800', color: COLORS.textBright },
  adminInfoLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  adminInfoDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },

  detailsCard: { padding: 18, gap: 14 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailsTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textBright },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  editBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.amberLight },
  cancelBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtnTopText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  rowsContainer: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  rowLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowLabelText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  rowValue: { fontSize: 13, fontWeight: '700', color: COLORS.textBright, textAlign: 'right', flexShrink: 1 },

  formContainer: { gap: 12, paddingTop: 4 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textBright },

  formActionsRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelFormBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelFormBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  saveFormBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: COLORS.amber,
  },
  saveFormBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  disabledBtn: { opacity: 0.6 },

  menuCard: { padding: 4, gap: 0 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1, gap: 2 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  menuSub: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.red },
});
