import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTrade } from '../context/TradeContext';
import { useNavigation } from '../context/NavigationContext';
import { BackBar } from '../components';
import { Toast } from '../components/ui';
import {
  AvailableEnergyScreen,
  SmartEnergyInsightsScreen,
  SustainabilityImpactScreen,
  EnergyRequestScreen,
  IncomingRequestsScreen,
  MyRequestsScreen,
  RequestApprovalScreen,
  TradeScreen,
  TransactionDetailsScreen,
  TransactionHistoryScreen,
} from '../screens';

const SCREENS = {
  trade: TradeScreen,
  list: AvailableEnergyScreen,
  request: EnergyRequestScreen,
  requests: MyRequestsScreen,
  incoming: IncomingRequestsScreen,
  approval: RequestApprovalScreen,
  transaction: TransactionDetailsScreen,
  history: TransactionHistoryScreen,
  insights: SmartEnergyInsightsScreen,
  impact: SustainabilityImpactScreen,
};

export default function TradeShell() {
  const { screen, canGoBack, backLabel, goBack } = useNavigation();
  const { toast } = useTrade();

  const Screen = SCREENS[screen] || AvailableEnergyScreen;

  return (
    <View style={styles.frame}>
      {canGoBack ? <BackBar label={backLabel} onPress={goBack} /> : null}

      <View style={styles.body}>
        <Screen />
      </View>

      <Toast message={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  body: { flex: 1 },
});
