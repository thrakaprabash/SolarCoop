import React from 'react';
import { StyleSheet, View } from 'react-native';

import { NavigationProvider, useNavigation } from '../../trade/context/NavigationContext';
import { useEnergy as useTradeEnergy } from '../../trade/context/EnergyContext';
import { BackBar } from '../../trade/components';
import { Toast } from '../../trade/components/ui';
import {
  AvailableEnergyScreen,
  EnergyInsightsScreen,
  EnergyRequestScreen,
  MyRequestsScreen,
  TradeScreen,
} from '../../trade/screens';

const SCREENS = {
  trade: TradeScreen,
  list: AvailableEnergyScreen,
  request: EnergyRequestScreen,
  requests: MyRequestsScreen,
  insights: EnergyInsightsScreen,
};

function TradeSectionBody() {
  const { screen, canGoBack, backLabel, goBack } = useNavigation();
  const { toast } = useTradeEnergy();
  const Screen = SCREENS[screen] || TradeScreen;

  return (
    <View style={styles.container}>
      {canGoBack ? <BackBar label={backLabel} onPress={goBack} /> : null}
      <View style={styles.body}>
        <Screen />
      </View>
      <Toast message={toast} bottom={20} />
    </View>
  );
}

export function TradeSection({ initialScreen = 'trade' }) {
  return (
    <NavigationProvider initialScreen={initialScreen}>
      <TradeSectionBody />
    </NavigationProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
});
