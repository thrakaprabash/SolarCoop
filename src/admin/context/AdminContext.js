import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  fetchAllMembers,
  computeCommunityStats,
  updateMemberStatus as serviceUpdateStatus,
  createInvitedMember as serviceCreateInvitedMember,
  toUIStatus,
} from '../services/adminMemberService';
import {
  fetchAllComplaints,
  updateComplaintStatus as serviceUpdateComplaintStatus,
  saveResolutionNote as serviceSaveResolutionNote,
  clearResolutionNote as serviceClearResolutionNote,
} from '../../services/complaintService';
import {
  fetchAllTransactions,
  reverseTransaction as serviceReverseTransaction,
} from '../services/adminTransactionService';

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

  // ─── Live complaints data state ──────────────────────────────────────────────
  const [complaints, setComplaints]               = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintsError, setComplaintsError]     = useState(null);

  // ─── Live transaction data state ─────────────────────────────────────────────
  const [transactions, setTransactions]               = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError]     = useState(null);

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

  // ─── loadComplaints ─────────────────────────────────────────────────────────
  /**
   * Fetch all complaints from Supabase.
   */
  const loadComplaints = useCallback(async () => {
    setComplaintsLoading(true);
    setComplaintsError(null);
    try {
      const data = await fetchAllComplaints();
      setComplaints(data);
    } catch (err) {
      console.error('[AdminContext] loadComplaints failed:', err.message);
      setComplaintsError(
        err.message ||
        'Could not load complaints. Check your Supabase RLS policies.'
      );
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  // ─── createMember ───────────────────────────────────────────────────────────
  /**
   * Admin-invite a new member account, then refresh the member list so it
   * appears immediately without a manual pull-to-refresh.
   *
   * @returns {Promise<{userId, email, name, tempPassword}>} passed straight
   *   through so the UI can show the one-time temporary password.
   */
  const createMember = useCallback(async (memberData) => {
    const result = await serviceCreateInvitedMember(memberData);
    await loadMembers();
    return result;
  }, [loadMembers]);

  // ─── loadTransactions ───────────────────────────────────────────────────────
  /**
   * Fetch all transactions (with sender/receiver names resolved) from Supabase.
   */
  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const data = await fetchAllTransactions();
      setTransactions(data);
    } catch (err) {
      console.error('[AdminContext] loadTransactions failed:', err.message);
      setTransactionsError(
        err.message ||
        'Could not load transactions. Check your Supabase RLS policies.'
      );
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  // ─── updateMemberStatus ─────────────────────────────────────────────────────
  const updateMemberStatus = useCallback(async (userId, uiStatus) => {
    await serviceUpdateStatus(userId, uiStatus);

    setMembers(prev => {
      const updated = prev.map(m => (m.id === userId ? { ...m, status: uiStatus } : m));
      const nextStats = computeCommunityStats(updated);
      setTimeout(() => setCommunityStats(nextStats), 0);
      return updated;
    });

    setSelectedMember(prev =>
      prev?.id === userId ? { ...prev, status: uiStatus } : prev
    );
  }, []);

  // ─── updateComplaintStatus ──────────────────────────────────────────────────
  const updateComplaintStatus = useCallback(async (complaintId, uiStatus) => {
    const updatedRecord = await serviceUpdateComplaintStatus(complaintId, uiStatus);
    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? updatedRecord : c))
    );
    setSelectedComplaint(prev => (prev?.id === complaintId ? updatedRecord : prev));
  }, []);

  // ─── saveResolutionNote ──────────────────────────────────────────────────────
  const saveResolutionNote = useCallback(async (complaintId, note) => {
    const updatedRecord = await serviceSaveResolutionNote(complaintId, note);
    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? updatedRecord : c))
    );
    setSelectedComplaint(prev => (prev?.id === complaintId ? updatedRecord : prev));
  }, []);

  // ─── clearResolutionNote ─────────────────────────────────────────────────────
  const clearResolutionNote = useCallback(async (complaintId) => {
    const updatedRecord = await serviceClearResolutionNote(complaintId);
    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? updatedRecord : c))
    );
    setSelectedComplaint(prev => (prev?.id === complaintId ? updatedRecord : prev));
  }, []);

  // ─── reverseTransaction ─────────────────────────────────────────────────────
  const reverseTransaction = useCallback(async (transactionId) => {
    const updatedRecord = await serviceReverseTransaction(transactionId);
    setTransactions(prev =>
      prev.map(t => (t.id === transactionId ? updatedRecord : t))
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
        createMember,
        updateMemberStatus,
        // Live complaints data
        complaints,
        complaintsLoading,
        complaintsError,
        loadComplaints,
        updateComplaintStatus,
        saveResolutionNote,
        clearResolutionNote,
        // Live transaction data
        transactions,
        transactionsLoading,
        transactionsError,
        loadTransactions,
        reverseTransaction,
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

