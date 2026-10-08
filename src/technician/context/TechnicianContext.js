import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  fetchTechnicianJobs,
  acceptJob as serviceAcceptJob,
  toggleChecklistItem as serviceToggleChecklistItem,
  saveResolutionNotes as serviceSaveResolutionNotes,
  completeJob as serviceCompleteJob,
  subscribeToJobs,
  buildJob,
} from '../services/jobService';

import { uploadRepairPhoto as serviceUploadRepairPhoto } from '../services/repairPhotoService';

import { createJobMutationQueue } from '../utils/jobMutationQueue';

const TechnicianContext = createContext(null);

export const TechnicianProvider = ({ children, onExit }) => {
  const { user, profile } = useAuth();
  const technicianId = user?.id ?? null;
  const jobRequests = useRef(0);
  const identity = useRef(technicianId);
  identity.current = technicianId;

  // ─── Navigation state ───────────────────────────────────────────────────────
  const [techBottomTab, setTechBottomTab] = useState('dashboard'); // 'dashboard' | 'diagnostics' | 'profile'
  const [jobFilter, setJobFilter]         = useState('active');    // 'pending' | 'active' | 'completed'
  const [selectedJobId, setSelectedJobId] = useState(null);        // job open on the Diagnostic Dossier
  const [closureOpen, setClosureOpen]     = useState(false);       // closure form for the open job

  // ─── Live job data ──────────────────────────────────────────────────────────
  const [jobs, setJobs]               = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError]     = useState(null);
  const [hasLoaded, setHasLoaded]     = useState(false);

  const [pendingWrites, setPendingWrites] = useState({});
  const mutationQueue = useRef(null);
  if (!mutationQueue.current) {
    mutationQueue.current = createJobMutationQueue((jobId, delta) => {
      setPendingWrites(prev => ({ ...prev, [jobId]: Math.max(0, (prev[jobId] ?? 0) + delta) }));
    });
  }
  const saveJobChange = useCallback((jobId, action) => mutationQueue.current.enqueue(jobId, async () => {
    const updated = await action();
    ++jobRequests.current;
    setJobsLoading(false);
    setJobs(prev => prev.map(j => (j.id === jobId ? updated : j)));
    return updated;
  }), []);

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

  const openJob  = useCallback((jobId) => { setClosureOpen(false); setSelectedJobId(jobId); }, []);
  const closeJob = useCallback(() => { setClosureOpen(false); setSelectedJobId(null); }, []);
  const openClosure  = useCallback(() => setClosureOpen(true), []);
  const closeClosure = useCallback(() => setClosureOpen(false), []);

  // ─── loadJobs ───────────────────────────────────────────────────────────────
  /**
   * Fetch the technician's board from Supabase. Safe to call repeatedly
   * (mount, retry, pull-to-refresh).
   */
  const loadJobs = useCallback(async ({ silent = false } = {}) => {
    if (!technicianId) return;
    const request = ++jobRequests.current;
    if (!silent) setJobsLoading(true);
    setJobsError(null);
    try {
      const data = await fetchTechnicianJobs(technicianId);
      if (identity.current !== technicianId || request !== jobRequests.current) return;
      setJobs(data);
      setHasLoaded(true);
    } catch (err) {
      if (identity.current !== technicianId || request !== jobRequests.current) return;
      console.error('[TechnicianContext] loadJobs failed:', err.message);
      setJobsError(
        err.message ||
        'Could not load jobs. Check that migration 0006_technician_jobs.sql has been applied.'
      );
    } finally {
      if (identity.current === technicianId && request === jobRequests.current) setJobsLoading(false);
    }
  }, [technicianId]);

  // Reconcile the board when mobile Realtime disconnects or misses an update.
  useEffect(() => {
    if (!technicianId) return;
    const refresh = () => loadJobs({ silent: true });
    const timer = setInterval(refresh, 10_000);
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') refresh(); });
    return () => { ++jobRequests.current; clearInterval(timer); foreground.remove(); };
  }, [technicianId, loadJobs]);

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
      ++jobRequests.current;
      setJobsLoading(false);
      setJobs(prev => prev.map(j => (j.id === jobId ? updated : j)));
      setJobFilter('active');
      return updated;
    } catch (err) {
      loadJobs();
      throw err;
    }
  }, [technicianId, profile?.name, user?.user_metadata?.name, loadJobs]);

  // Server toggles plus a per-job queue prevent rapid taps from overwriting saved steps.
  const toggleChecklistItem = useCallback((jobId, index) =>
    saveJobChange(jobId, () => serviceToggleChecklistItem(jobId, index)), [saveJobChange]);

  const saveResolutionNotes = useCallback((jobId, notes) =>
    saveJobChange(jobId, () => serviceSaveResolutionNotes(jobId, notes)), [saveJobChange]);

  const uploadRepairPhoto = useCallback((jobId, asset) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return Promise.reject(new Error('This job is no longer on your board.'));
    return saveJobChange(jobId, () => serviceUploadRepairPhoto(job, technicianId, asset));
  }, [jobs, technicianId, saveJobChange]);

  // SOL-204: complete after queued saves, then show the ticket in the Completed tab.
  const completeJob = useCallback(async (jobId, resolutionNotes) => {
    const updated = await saveJobChange(jobId, () => serviceCompleteJob(jobId, { resolutionNotes }));
    setClosureOpen(false);
    setSelectedJobId(null);
    setTechBottomTab('dashboard');
    setJobFilter('completed');
    return updated;
  }, [saveJobChange]);

  // ─── Live sync (SOL-201) ────────────────────────────────────────────────────
  // Apply every jobs change straight onto the board: new faults appear, jobs
  // another technician accepts drop out of the queue, and our own updates made
  // from another device show up. Needs migration 0007_jobs_realtime.sql;
  // without it the board still updates on pull-to-refresh.
  useEffect(() => {
    if (!technicianId) return undefined;

    const onBoard = (job) => job.status === 'pending' || job.technicianId === technicianId;

    return subscribeToJobs(`technician-jobs-${technicianId}`, (payload) => {
      if (payload.eventType === 'DELETE') {
        const goneId = payload.old?.id;
        if (goneId) {
          ++jobRequests.current; setJobsLoading(false);
          setJobs(prev => prev.filter(j => j.id !== goneId));
        }
        return;
      }
      if (!payload.new?.id) return;
      ++jobRequests.current;
      setJobsLoading(false);
      const job = buildJob(payload.new);
      setJobs(prev => {
        const rest = prev.filter(j => j.id !== job.id);
        if (!onBoard(job)) return rest;
        return [job, ...rest].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      });
    });
  }, [technicianId]);

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
        closureOpen,
        openClosure,
        closeClosure,
        // Jobs
        technicianId,
        jobs,
        jobsLoading,
        jobsError,
        jobCounts,
        connectionStatus,
        hasLoaded,
        loadJobs,
        acceptJob,
        completeJob,
        uploadRepairPhoto,
        saveResolutionNotes,
        pendingWrites,
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
