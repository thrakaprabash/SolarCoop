import React from 'react';

import { NavigationProvider } from './context/NavigationContext';
import TradeShell from './navigation/TradeShell';

export default function TradeModule({ initialScreen = 'list' }) {
  return (
    <NavigationProvider key={initialScreen} initialScreen={initialScreen}>
      <TradeShell />
    </NavigationProvider>
  );
}
