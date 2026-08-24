import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  fetchAllMembers,
  computeCommunityStats,
  updateMemberStatus as serviceUpdateStatus,
  toUIStatus,
} from '../services/adminMemberService';

const AdminContext = createContext(null);

export const AdminProvider = ({ children, onExit }) => {
  // ─── Navigation state (existing — unchanged) ────────────────────────────────
  const [adminBottomTab, setAdminBottomTab]       = useState('dashboard');
  const [adminHeaderToggle, setAdminHeaderToggle] = useState('overview');
  const [adminMetricChip, setAdminMetricChip]     = useState('all');
  const [selectedMember, setSelectedMember]       = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // ─── Live member data state ─────────────────────────────────────────────────
  const [members, setMembers]               = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError]     = useState(null);
  const [communityStats, setCommunityStats] = useState(null);

  // ─── loadMembers ────────────────────────────────────────────────────────────
  /**
   * Fetch all member profiles + their energy data from Supabase.
   * Populates `members` and derives `communityStats`.
   * Safe to call multiple times (e.g. on retry or pull-to-refresh).
   */
  const loadMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const data  = await fetchAllMembers();
      const stats = computeCommunityStats(data);
      setMembers(data);
      setCommunityStats(stats);
    } catch (err) {
      console.error('[AdminContext] loadMembers failed:', err.message);
      setMembersError(
        err.message ||
        'Could not load members. Check your Supabase RLS policies.'
      );
    } finally {
      setMembersLoading(false);
    }
  }, []);

  // ─── updateMemberStatus ─────────────────────────────────────────────────────
  /**
   * Write a new status for a member to Supabase, then apply an optimistic
   * in-place update to the `members` array so the UI reflects the change
   * immediately — no full refetch required.
   *
   * Also updates `selectedMember` if it is the same profile, so
   * MemberDetailScreen's status badge updates without navigating away.
   *
   * @param {string} userId   - profiles.id (uuid)
   * @param {string} uiStatus - 'Active' | 'Inactive' | 'Suspended'
   */
  const updateMemberStatus = useCallback(async (userId, uiStatus) => {
    // Write to Supabase — throws on failure so callers can handle error
    await serviceUpdateStatus(userId, uiStatus);

    // Optimistic in-place update of members array
    setMembers(prev => {
      const updated = prev.map(m => (m.id === userId ? { ...m, status: uiStatus } : m));
      const nextStats = computeCommunityStats(updated);
      setTimeout(() => setCommunityStats(nextStats), 0);
      return updated;
    });

    // Keep selectedMember in sync (MemberDetailScreen reads it directly)
    setSelectedMember(prev =>
      prev?.id === userId ? { ...prev, status: uiStatus } : prev
    );
  }, []);

  return (
    <AdminContext.Provider
      value={{
        // Navigation (existing)
        adminBottomTab,
        setAdminBottomTab,
        adminHeaderToggle,
        setAdminHeaderToggle,
        adminMetricChip,
        setAdminMetricChip,
        selectedMember,
        setSelectedMember,
        selectedComplaint,
        setSelectedComplaint,
        onExit,
        // Live member data
        members,
        membersLoading,
        membersError,
        communityStats,
        loadMembers,
        updateMemberStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};

