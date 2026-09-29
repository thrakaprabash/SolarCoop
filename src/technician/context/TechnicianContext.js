import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTechnicianJobs,
  acceptJob as serviceAcceptJob,
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
