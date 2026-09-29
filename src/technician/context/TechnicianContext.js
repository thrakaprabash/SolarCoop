import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTechnicianJobs,
  acceptJob as serviceAcceptJob,
  updateChecklist as serviceUpdateChecklist,
} from '../services/jobService';

const TechnicianContext = createContext(null);

export const TechnicianProvider = ({ children, onExit }) => {
  const { user, profile } = useAuth();
  const technicianId = user?.id ?? null;

  // ─── Navigation state ───────────────────────────────────────────────────────
  const [techBottomTab, setTechBottomTab] = useState('dashboard'); // 'dashboard' | 'diagnostics' | 'profile'
  const [jobFilter, setJobFilter]         = useState('active');    // 'pending' | 'active' | 'completed'
  const [selectedJobId, setSelectedJobId] = useState(null);        // job open on the Diagnostic Dossier

  // ─── Live job data ──────────────────────────────────────────────────────────
  const [jobs, setJobs]               = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError]     = useState(null);
  const [hasLoaded, setHasLoaded]     = useState(false);

  // What the header pill shows: only "connected" once a fetch has actually
  // come back, "offline" if the latest one failed.
  const connectionStatus = jobsError ? 'offline' : hasLoaded ? 'connected' : 'connecting';

  // Counts shown on the segmented control — one definition shared by every screen.
  const jobCounts = useMemo(() => ({
    pending:   jobs.filter(j => j.status === 'pending').length,
    active:    jobs.filter(j => j.status === 'active').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  }), [jobs]);

  // The open job is looked up from `jobs` rather than copied, so a refresh
  // or an accept updates the screen that's showing it.
  const selectedJob = useMemo(
    () => jobs.find(j => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  // Open fault alerts for the Diagnostics tab — the technician's own active
  // jobs first, then the pending queue, most urgent first within each.
  const openAlerts = useMemo(() => {
    const rank = { urgent: 0, medium: 1, low: 2 };
    return jobs
      .filter(j => j.status === 'active' || j.status === 'pending')
      .sort((a, b) =>
        (a.status === 'active' ? 0 : 1) - (b.status === 'active' ? 0 : 1) ||
        (rank[a.urgency] ?? 3) - (rank[b.urgency] ?? 3)
      );
  }, [jobs]);
  const urgentAlertCount = openAlerts.filter(j => j.urgency === 'urgent').length;

  const openJob  = useCallback((jobId) => setSelectedJobId(jobId), []);
  const closeJob = useCallback(() => setSelectedJobId(null), []);

  // ─── loadJobs ───────────────────────────────────────────────────────────────
  /**
   * Fetch the technician's board from Supabase. Safe to call repeatedly
   * (mount, retry, pull-to-refresh).
   */
  const loadJobs = useCallback(async () => {
    if (!technicianId) return;
    setJobsLoading(true);
    setJobsError(null);
    try {
      const data = await fetchTechnicianJobs(technicianId);
      setJobs(data);
      setHasLoaded(true);
    } catch (err) {
      console.error('[TechnicianContext] loadJobs failed:', err.message);
      setJobsError(
        err.message ||
        'Could not load jobs. Check that migration 0006_technician_jobs.sql has been applied.'
      );
    } finally {
      setJobsLoading(false);
    }
  }, [technicianId]);

  // ─── acceptJob ──────────────────────────────────────────────────────────────
  /**
   * SOL-197 — Pending → Active. On success the dashboard switches to the
   * Active view so the accepted ticket is what the technician sees next.
   * If someone else took it first, the board is refreshed and the error is
   * re-thrown for the screen to show.
   */
  const acceptJob = useCallback(async (jobId) => {
    try {
      const updated = await serviceAcceptJob(jobId, {
        id: technicianId,
        name: profile?.name ?? user?.user_metadata?.name,
      });
      setJobs(prev => prev.map(j => (j.id === jobId ? updated : j)));
      setJobFilter('active');
      return updated;
    } catch (err) {
      loadJobs();
      throw err;
    }
  }, [technicianId, profile?.name, user?.user_metadata?.name, loadJobs]);

  // ─── toggleChecklistItem ────────────────────────────────────────────────────
  /**
   * SOL-198 — tick / untick one diagnostic step. Optimistic: the box flips
   * immediately and is put back if the save fails.
   */
  const toggleChecklistItem = useCallback(async (jobId, index) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || !job.checklist[index]) return;

    const previous = job.checklist;
    const next = previous.map((item, i) => (i === index ? { ...item, done: !item.done } : item));
    setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, checklist: next } : j)));

    try {
      const updated = await serviceUpdateChecklist(jobId, next);
      setJobs(prev => prev.map(j => (j.id === jobId ? updated : j)));
    } catch (err) {
      setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, checklist: previous } : j)));
      throw err;
    }
  }, [jobs]);

  return (
    <TechnicianContext.Provider
      value={{
        // Navigation
        techBottomTab,
        setTechBottomTab,
        jobFilter,
        setJobFilter,
        onExit,
        selectedJob,
        openJob,
        closeJob,
        // Jobs
        technicianId,
        jobs,
        jobsLoading,
        jobsError,
        jobCounts,
        connectionStatus,
        loadJobs,
        acceptJob,
        // Diagnostics
        openAlerts,
        urgentAlertCount,
        toggleChecklistItem,
      }}
    >
      {children}
    </TechnicianContext.Provider>
  );
};

export const useTechnician = () => {
  const ctx = useContext(TechnicianContext);
  if (!ctx) throw new Error('useTechnician must be used within TechnicianProvider');
  return ctx;
};
