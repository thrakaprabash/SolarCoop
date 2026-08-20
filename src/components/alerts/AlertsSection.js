import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertsHubScreen } from './AlertsHubScreen';
import { SubmitComplaintScreen } from './SubmitComplaintScreen';
import { MOCK_MEMBER_COMPLAINTS } from '../../admin/data/mockAdminData';

export const AlertsSection = () => {
  const [screen, setScreen] = useState('hub');
  const [complaints, setComplaints] = useState(MOCK_MEMBER_COMPLAINTS);

  const handleAddComplaint = (newComplaint) => {
    setComplaints([newComplaint, ...complaints]);
    setScreen('hub');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'submit':
        return <SubmitComplaintScreen onBack={() => setScreen('hub')} onSubmit={handleAddComplaint} />;
      case 'hub':
      default:
        return <AlertsHubScreen onNavigate={(newScreen) => setScreen(newScreen)} complaints={complaints} />;
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
