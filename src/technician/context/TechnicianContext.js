import React, { createContext, useContext, useMemo, useState } from 'react';
import { MOCK_JOBS } from '../data/mockJobs';

const TechnicianContext = createContext(null);

export const TechnicianProvider = ({ children, onExit }) => {
  // ─── Navigation state ───────────────────────────────────────────────────────
  const [techBottomTab, setTechBottomTab] = useState('dashboard'); // 'dashboard' | 'diagnostics' | 'profile'
  const [jobFilter, setJobFilter]         = useState('active');    // 'pending' | 'active' | 'completed'

  // ─── Job data ───────────────────────────────────────────────────────────────
  const [jobs] = useState(MOCK_JOBS);
  const connectionStatus = 'connected'; // 'connected' | 'connecting' | 'offline'

  // Counts shown on the segmented control — one definition shared by every screen.
  const jobCounts = useMemo(() => ({
    pending:   jobs.filter(j => j.status === 'pending').length,
    active:    jobs.filter(j => j.status === 'active').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  }), [jobs]);

  return (
    <TechnicianContext.Provider
      value={{
        // Navigation
        techBottomTab,
        setTechBottomTab,
        jobFilter,
        setJobFilter,
        onExit,
        // Jobs
        jobs,
        jobCounts,
        connectionStatus,
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
