import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import backdrop from '../../assets/images/bg.jpg';
import { colors } from '../theme';
import { useEnergy } from '../context/EnergyContext';
import { useNavigation } from '../context/NavigationContext';
import { AppHeader, BackBar, BottomTabBar } from '../components';
import { Toast } from '../components/ui';
import {
  AvailableEnergyScreen,
  EnergyInsightsScreen,
  EnergyRequestScreen,
  MyRequestsScreen,
  TradeScreen,
} from '../screens';

const SCREENS = {
  trade: TradeScreen,
  list: AvailableEnergyScreen,
  request: EnergyRequestScreen,
  requests: MyRequestsScreen,
  insights: EnergyInsightsScreen,
};

export default function AppShell() {
  const insets = useSafeAreaInsets();
  const { screen, canGoBack, backLabel, goBack, navigate } = useNavigation();
  const { toast } = useEnergy();

  const Screen = SCREENS[screen] || AvailableEnergyScreen;
  const activeTab = screen === 'insights' ? 'energy' : 'trade';

  return (
    <ImageBackground source={backdrop} style={styles.root} resizeMode="cover">
      <View style={styles.scrim} />
      <View style={[styles.frame, { paddingTop: insets.top }]}>
        <AppHeader />
        {canGoBack ? <BackBar label={backLabel} onPress={goBack} /> : null}

        <View style={styles.body}>
          <Screen />
        </View>

        <Toast message={toast} bottom={76 + insets.bottom} />
        <BottomTabBar activeKey={activeTab} onSelect={navigate} bottomInset={insets.bottom} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.base },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  frame: { flex: 1 },
  body: { flex: 1 },
});
