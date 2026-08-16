import React, { createContext, useContext, useState, useEffect } from 'react';

const EnergyContext = createContext();

export const initialHistoryLogs = [
  { id: '1', time: '14:45 Today', type: 'surplus', title: 'Co-op Energy Shared', amount: '+4.5 kWh', cost: '+$1.35 earned', status: 'Completed', detail: 'Transferred excess solar to House #08' },
  { id: '2', time: '13:10 Today', type: 'production', title: 'Peak Solar Generation', amount: '8.4 kW', cost: 'Peak solar output', status: 'Optimal', detail: 'Roof North & South Arrays operating at 98% efficiency' },
  { id: '3', time: '11:30 Today', type: 'storage', title: 'Home Battery Fully Charged', amount: '13.5 kWh', cost: '100% SoC', status: 'Charged', detail: 'Tesla Powerwall 2 reached capacity threshold' },
  { id: '4', time: '09:15 Today', type: 'consumption', title: 'EV Fast Charging Initiated', amount: '-6.2 kW', cost: 'Solar Powered', detail: 'Vehicle charged directly using solar surplus' },
  { id: '5', time: '07:00 Today', type: 'deficit', title: 'Morning Co-op Draw', amount: '-1.8 kWh', cost: '-$0.36 borrowed', status: 'Settled', detail: 'Borrowed from Co-op Pool prior to sunrise' },
  { id: '6', time: 'Yesterday', type: 'surplus', title: 'Co-op Dividend Distributed', amount: '+18.2 kWh', cost: '+$5.46 payout', status: 'Completed', detail: 'Daily community revenue distribution' },
  { id: '7', time: 'Yesterday', type: 'production', title: 'Daily Total Solar Gen', amount: '48.2 kWh', cost: '$14.46 value', status: 'Record', detail: 'Clear sunny sky, zero cloud coverage' },
];

export const initialApplianceLoads = [
  { id: 'app1', name: 'HVAC Air Conditioner', power: '2.4 kW', active: true, icon: 'wind', category: 'Climate' },
  { id: 'app2', name: 'EV Charger (Tesla Wallbox)', power: '7.2 kW', active: true, icon: 'zap', category: 'Mobility' },
  { id: 'app3', name: 'Smart Washer / Dryer', power: '1.2 kW', active: false, icon: 'repeat', category: 'Laundry' },
  { id: 'app4', name: 'Water Heater HeatPump', power: '1.8 kW', active: true, icon: 'droplet', category: 'Water' },
  { id: 'app5', name: 'Refrigerator & Freezers', power: '0.35 kW', active: true, icon: 'box', category: 'Kitchen' },
  { id: 'app6', name: 'Home Entertainment & IT', power: '0.45 kW', active: true, icon: 'tv', category: 'Electronics' },
];

export const initialChartData = {
  hours: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
  production: [0.5, 2.8, 6.4, 8.8, 8.2, 5.1, 1.2, 0.0],
  consumption: [1.8, 3.2, 3.8, 4.1, 3.5, 4.8, 6.2, 4.5],
  surplus: [0.0, 0.0, 2.6, 4.7, 4.7, 0.3, 0.0, 0.0],
  deficit: [1.3, 0.4, 0.0, 0.0, 0.0, 0.0, 5.0, 4.5],
};

export const EnergyProvider = ({ children }) => {
  // Theme state: default to studio warm light theme from reference design
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Main bottom navigation taskbar tab ('dashboard' | 'trade' | 'alerts' | 'profile')
  const [mainBottomTab, setMainBottomTab] = useState('dashboard');

  // Active view tab state inside Dashboard
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'production' | 'consumption' | 'surplus' | 'deficit' | 'history' | 'charts' | 'summary'

  // Household vs Community Co-op Mode
  const [viewScope, setViewScope] = useState('household'); // 'household' | 'community'

  // Simulation mode presets to showcase dynamic UI
  const [simulationPreset, setSimulationPreset] = useState('sunny'); // 'sunny' | 'cloudy' | 'evening' | 'deficit'

  // Core metrics
  const [metrics, setMetrics] = useState({
    instantProduction: 8.5, // kW
    dailyProduction: 42.6,  // kWh
    instantConsumption: 3.8, // kW
    dailyConsumption: 24.1,  // kWh
    batteryLevel: 88,       // %
    batteryCapacity: 13.5,  // kWh
    batteryPowerFlow: +2.1,  // kW (+ charging, - discharging)
    surplusAvailable: 4.6,  // kW
    coopPoolSharedToday: 18.5, // kWh
    coopTokensEarned: 142.5, // Tokens
    monetarySaved: 38.40,   // USD / LKR converted
    co2SavedKg: 34.2,       // kg
    gridIndependence: 94,   // %
    coopMembersOnline: 14,
    coopTotalCapacity: 120.0, // kW
  });

  // Appliances state
  const [appliances, setAppliances] = useState(initialApplianceLoads);
  
  // History logs state
  const [historyLogs, setHistoryLogs] = useState(initialHistoryLogs);

  // Auto-share toggle setting
  const [autoShareEnabled, setAutoShareEnabled] = useState(true);
  const [autoShareThreshold, setAutoShareThreshold] = useState(75); // Share when battery > 75%

  // Update metrics based on simulation preset selection
  useEffect(() => {
    if (simulationPreset === 'sunny') {
      setMetrics(prev => ({
        ...prev,
        instantProduction: 8.4,
        instantConsumption: 3.8,
        surplusAvailable: 4.6,
        batteryPowerFlow: +2.1,
        gridIndependence: 96,
      }));
    } else if (simulationPreset === 'cloudy') {
      setMetrics(prev => ({
        ...prev,
        instantProduction: 2.2,
        instantConsumption: 3.5,
        surplusAvailable: 0.0,
        batteryPowerFlow: -1.3,
        gridIndependence: 78,
      }));
    } else if (simulationPreset === 'evening') {
      setMetrics(prev => ({
        ...prev,
        instantProduction: 0.2,
        instantConsumption: 5.8,
        surplusAvailable: 0.0,
        batteryPowerFlow: -4.2,
        gridIndependence: 85,
      }));
    } else if (simulationPreset === 'deficit') {
      setMetrics(prev => ({
        ...prev,
        instantProduction: 0.0,
        instantConsumption: 6.4,
        surplusAvailable: 0.0,
        batteryPowerFlow: -5.0,
        gridIndependence: 42,
      }));
    }
  }, [simulationPreset]);

  // Toggle appliance load
  const toggleAppliance = (id) => {
    setAppliances(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, active: !app.active };
      }
      return app;
    }));
  };

  // Add new energy sharing transaction
  const executeShareEnergy = (amountKwh, recipient) => {
    const newLog = {
      id: Date.now().toString(),
      time: 'Just now',
      type: 'surplus',
      title: `Shared ${amountKwh} kWh with ${recipient}`,
      amount: `+${amountKwh} kWh`,
      cost: `+$${(amountKwh * 0.30).toFixed(2)} earned`,
      status: 'Completed',
      detail: `Direct peer-to-peer energy transfer via Co-op Pool`,
    };
    setHistoryLogs([newLog, ...historyLogs]);
    setMetrics(prev => ({
      ...prev,
      coopPoolSharedToday: parseFloat((prev.coopPoolSharedToday + amountKwh).toFixed(1)),
      coopTokensEarned: prev.coopTokensEarned + (amountKwh * 10),
    }));
  };

  // Borrow deficit energy from Co-op
  const executeBorrowEnergy = (amountKwh) => {
    const newLog = {
      id: Date.now().toString(),
      time: 'Just now',
      type: 'deficit',
      title: `Borrowed ${amountKwh} kWh from Co-op`,
      amount: `-${amountKwh} kWh`,
      cost: `-$${(amountKwh * 0.20).toFixed(2)} borrowed`,
      status: 'Settled',
      detail: `Covered household demand via community battery reserve`,
    };
    setHistoryLogs([newLog, ...historyLogs]);
  };

  return (
    <EnergyContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        mainBottomTab,
        setMainBottomTab,
        activeTab,
        setActiveTab,
        viewScope,
        setViewScope,
        simulationPreset,
        setSimulationPreset,
        metrics,
        appliances,
        toggleAppliance,
        historyLogs,
        chartData: initialChartData,
        autoShareEnabled,
        setAutoShareEnabled,
        autoShareThreshold,
        setAutoShareThreshold,
        executeShareEnergy,
        executeBorrowEnergy,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
};

export const useEnergy = () => useContext(EnergyContext);
