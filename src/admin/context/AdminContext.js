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
import {
  fetchAllAlerts,
  createAlert as serviceCreateAlert,
  updateAlert as serviceUpdateAlert,
  resolveAlert as serviceResolveAlert,
  reopenAlert as serviceReopenAlert,
  deleteAlert as serviceDeleteAlert,
} from '../services/adminAlertService';

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

  // ─── Live alert data state ───────────────────────────────────────────────────
  const [alerts, setAlerts]               = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError]     = useState(null);

  // Shared by the header status pill, the dashboard stat and the alerts screen,
  // so the "what needs attention" definition lives in exactly one place.
  const openAlertCount = alerts.filter(a => a.status === 'Open').length;
  const urgentAlertCount = alerts.filter(
    a => a.status === 'Open' && (a.severity === 'Critical' || a.severity === 'High')
  ).length;

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

  // ─── loadAlerts ─────────────────────────────────────────────────────────────
  /**
   * Fetch all alerts (with targeted member names resolved) from Supabase.
   */
  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const data = await fetchAllAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('[AdminContext] loadAlerts failed:', err.message);
      setAlertsError(
        err.message ||
        'Could not load alerts. Check your Supabase RLS policies.'
      );
    } finally {
      setAlertsLoading(false);
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
    // A reversal raises alerts server-side (database trigger, 0004), which this
    // app can't see until it asks — pull them in so the header pill reacts now.
    loadAlerts();
  }, [loadAlerts]);

  // ─── createAlert ────────────────────────────────────────────────────────────
  const createAlert = useCallback(async (alertData) => {
    const created = await serviceCreateAlert(alertData);
    setAlerts(prev => [created, ...prev]);
    return created;
  }, []);

  // ─── updateAlert ────────────────────────────────────────────────────────────
  // Only admin-created alerts can be edited; the service enforces it.
  const updateAlert = useCallback(async (alertId, changes) => {
    const updated = await serviceUpdateAlert(alertId, changes);
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, ...updated } : a)));
  }, []);

  // ─── resolveAlert / reopenAlert ─────────────────────────────────────────────
  const resolveAlert = useCallback(async (alertId) => {
    const { status } = await serviceResolveAlert(alertId);
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, status } : a)));
  }, []);

  const reopenAlert = useCallback(async (alertId) => {
    const { status } = await serviceReopenAlert(alertId);
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, status } : a)));
  }, []);

  // ─── deleteAlert ────────────────────────────────────────────────────────────
  const deleteAlert = useCallback(async (alertId) => {
    await serviceDeleteAlert(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
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
        // Live alert data
        alerts,
        alertsLoading,
        alertsError,
        openAlertCount,
        urgentAlertCount,
        loadAlerts,
        createAlert,
        updateAlert,
        resolveAlert,
        reopenAlert,
        deleteAlert,
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

