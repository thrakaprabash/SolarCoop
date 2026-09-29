/**
 * src/technician/data/mockJobs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Placeholder job tickets so the dashboard shell (SOL-193) can be built and
 * reviewed before the `jobs` table exists. Same shape the job service will
 * return once it is wired to Supabase (SOL-194).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const MOCK_JOBS = [
  {
    id: 'mock-1',
    ticketCode: 'JOB-1001',
    title: 'Solis Inverter Fault - 5kW',
    device: 'Solis 5kW Single Phase',
    errorCode: 'F05',
    errorMessage: 'DC Arc Fault on String 2',
    urgency: 'urgent',
    status: 'active',
    clientName: 'Kasun Jayasinghe',
    siteArea: 'Athurugiriya',
    distanceKm: 4.2,
  },
  {
    id: 'mock-2',
    ticketCode: 'JOB-1002',
    title: 'Huawei PV String Low Voltage',
    device: 'Huawei SUN2000 3kW',
    errorCode: null,
    errorMessage: 'String voltage below threshold',
    urgency: 'medium',
    status: 'pending',
    clientName: 'Naduni Silva',
    siteArea: 'Malabe',
    distanceKm: 7.8,
  },
  {
    id: 'mock-3',
    ticketCode: 'JOB-1003',
    title: 'SolarPlanet Cloud Sync Delay',
    device: 'SolarPlanet Gateway',
    errorCode: null,
    errorMessage: 'Telemetry upload delayed',
    urgency: 'medium',
    status: 'pending',
    clientName: 'Ruwan Fernando',
    siteArea: 'Koswatta',
    distanceKm: 2.7,
  },
];
