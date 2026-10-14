import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  fetchAllMembers,
  computeCommunityStats,
  updateMemberStatus as serviceUpdateStatus,
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
import { scanForSystemAlerts } from '../services/alertScanService';

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

  // Automatic-alert scan: whether one is running, what the last one found, and
  // the in-flight run itself so concurrent triggers share it.
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const scanInFlight = useRef(null);
  const transactionReads = useRef(0);
  const alertReads = useRef(0);

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

  // ─── loadTransactions ───────────────────────────────────────────────────────
  /**
   * Fetch all transactions (with sender/receiver names resolved) from Supabase.
   */
  const loadTransactions = useCallback(async ({ silent = false } = {}) => {
    const request = ++transactionReads.current;
    if (!silent) setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const data = await fetchAllTransactions();
      if (request !== transactionReads.current) return;
      setTransactions(data);
    } catch (err) {
      if (request !== transactionReads.current) return;
      console.error('[AdminContext] loadTransactions failed:', err.message);
      setTransactionsError(
        err.message ||
        'Could not load transactions. Check your Supabase RLS policies.'
      );
    } finally {
      if (request === transactionReads.current) setTransactionsLoading(false);
    }
  }, []);

  // ─── loadAlerts ─────────────────────────────────────────────────────────────
  /**
   * Fetch all alerts (with targeted member names resolved) from Supabase.
   */
  const loadAlerts = useCallback(async ({ silent = false } = {}) => {
    const request = ++alertReads.current;
    if (!silent) setAlertsLoading(true);
    setAlertsError(null);
    try {
      const data = await fetchAllAlerts();
      if (request !== alertReads.current) return;
      setAlerts(data);
    } catch (err) {
      if (request !== alertReads.current) return;
      console.error('[AdminContext] loadAlerts failed:', err.message);
      setAlertsError(
        err.message ||
        'Could not load alerts. Check your Supabase RLS policies.'
      );
    } finally {
      if (request === alertReads.current) setAlertsLoading(false);
    }
  }, []);

  // ─── scanAlerts ─────────────────────────────────────────────────────────────
  /**
   * Run the automatic-alert scan, then reload alerts so anything it raised
   * appears. Triggered on portal mount, by the Scan button and by
   * pull-to-refresh; concurrent calls share a single run.
   */
  const scanAlerts = useCallback(() => {
    if (scanInFlight.current) return scanInFlight.current;

    const run = (async () => {
      setScanning(true);
      try {
        const result = await scanForSystemAlerts();
        result.failedChecks.forEach(f =>
          console.warn(`[AdminContext] alert check "${f.check}" could not run: ${f.reason}`)
        );
        setLastScan({ at: new Date().toISOString(), ...result, error: null });
      } catch (err) {
        console.error('[AdminContext] scanAlerts failed:', err?.message);
        setLastScan({
          at: new Date().toISOString(),
          raised: 0,
          evaluated: 0,
          failedChecks: [],
          error: err?.message || 'The scan could not run.',
        });
      } finally {
        await loadAlerts({ silent: true });
        setScanning(false);
        scanInFlight.current = null;
      }
    })();

    scanInFlight.current = run;
    return run;
  }, [loadAlerts]);

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
  const reverseTransaction = useCallback(async (transactionId, reason) => {
    const updatedRecord = await serviceReverseTransaction(transactionId, reason);
    ++transactionReads.current;
    setTransactionsLoading(false);
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
    ++alertReads.current;
    setAlertsLoading(false);
    setAlerts(prev => [created, ...prev]);
    return created;
  }, []);

  // ─── updateAlert ────────────────────────────────────────────────────────────
  // Only admin-created alerts can be edited; the service enforces it.
  const updateAlert = useCallback(async (alertId, changes) => {
    const updated = await serviceUpdateAlert(alertId, changes);
    ++alertReads.current;
    setAlertsLoading(false);
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, ...updated } : a)));
  }, []);

  // ─── resolveAlert / reopenAlert ─────────────────────────────────────────────
  const resolveAlert = useCallback(async (alertId) => {
    const { status } = await serviceResolveAlert(alertId);
    ++alertReads.current;
    setAlertsLoading(false);
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, status } : a)));
  }, []);

  const reopenAlert = useCallback(async (alertId) => {
    const { status } = await serviceReopenAlert(alertId);
    ++alertReads.current;
    setAlertsLoading(false);
    setAlerts(prev => prev.map(a => (a.id === alertId ? { ...a, status } : a)));
  }, []);

  // ─── deleteAlert ────────────────────────────────────────────────────────────
  const deleteAlert = useCallback(async (alertId) => {
    await serviceDeleteAlert(alertId);
    ++alertReads.current;
    setAlertsLoading(false);
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
        scanning,
        lastScan,
        scanAlerts,
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

