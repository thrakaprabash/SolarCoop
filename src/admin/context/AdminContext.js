import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

export const AdminProvider = ({ children, onExit }) => {
  const [adminBottomTab, setAdminBottomTab] = useState('dashboard');
  const [adminHeaderToggle, setAdminHeaderToggle] = useState('overview');
  const [adminMetricChip, setAdminMetricChip] = useState('all');
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  return (
    <AdminContext.Provider
      value={{
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
