import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertsHubScreen } from './AlertsHubScreen';
import { SubmitComplaintScreen } from './SubmitComplaintScreen';
import { useAuth } from '../../context/AuthContext';
import {
  fetchMyComplaints,
  submitComplaint,
  editComplaint,
  deleteComplaint,
} from '../../services/complaintService';
import { fetchMyFaultAlerts } from '../../services/faultAlertService';

export const AlertsSection = () => {
  const { user } = useAuth();
  const [screen, setScreen] = useState('hub');
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faultAlerts, setFaultAlerts] = useState([]);

  const loadComplaints = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMyComplaints(user.id);
      setComplaints(data);
    } catch (err) {
      console.error('[AlertsSection] loadComplaints failed:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Maintenance jobs at this household (SOL-199). Secondary to complaints,
  // so a failure here is logged and the card simply isn't shown.
  const loadFaultAlerts = useCallback(async () => {
    if (!user?.id) return;
    try {
      setFaultAlerts(await fetchMyFaultAlerts(user.id));
    } catch (err) {
      console.warn('[AlertsSection] loadFaultAlerts failed:', err?.message);
    }
  }, [user?.id]);

  useEffect(() => {
    loadComplaints();
    loadFaultAlerts();
  }, [loadComplaints, loadFaultAlerts]);

  const handleCreateSubmit = async (formData) => {
    if (!user?.id) throw new Error('User not authenticated.');
    const newRecord = await submitComplaint(user.id, formData);
    setComplaints(prev => [newRecord, ...prev]);
    // A 'System Fault' complaint raises a job server-side (0006 trigger).
    loadFaultAlerts();
  };

  const handleEditSubmit = async (formData) => {
    if (!editingComplaint?.id) return;
    const updatedRecord = await editComplaint(editingComplaint.id, formData);
    setComplaints(prev =>
      prev.map(c => (c.id === editingComplaint.id ? updatedRecord : c))
    );
    setEditingComplaint(null);
  };

  const handleDeleteComplaint = async (complaintId) => {
    await deleteComplaint(complaintId);
    setComplaints(prev => prev.filter(c => c.id !== complaintId));
  };

  const handleStartEdit = (complaint) => {
    setEditingComplaint(complaint);
    setScreen('edit');
  };

  const handleBackToHub = () => {
    setEditingComplaint(null);
    setScreen('hub');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'submit':
        return (
          <SubmitComplaintScreen
            onBack={handleBackToHub}
            onSubmit={handleCreateSubmit}
          />
        );
      case 'edit':
        return (
          <SubmitComplaintScreen
            onBack={handleBackToHub}
            onSubmit={handleEditSubmit}
            existingComplaint={editingComplaint}
          />
        );
      case 'hub':
      default:
        return (
          <AlertsHubScreen
            onNavigate={(newScreen) => setScreen(newScreen)}
            complaints={complaints}
            faultAlerts={faultAlerts}
            loading={loading}
            onEdit={handleStartEdit}
            onDelete={handleDeleteComplaint}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
