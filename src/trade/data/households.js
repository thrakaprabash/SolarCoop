export const HOUSEHOLDS = [
  { id: 'h1', name: 'Green House', house: 'House #04', dist: '120 m', kwh: 4.2, rate: 0.22, soc: 88, online: true },
  { id: 'h2', name: 'Solar Home', house: 'House #08', dist: '340 m', kwh: 2.8, rate: 0.2, soc: 74, online: true },
  { id: 'h3', name: 'Hilltop Villa', house: 'House #12', dist: '610 m', kwh: 6.1, rate: 0.25, soc: 95, online: true },
  { id: 'h4', name: 'Maple Court', house: 'House #03', dist: '80 m', kwh: 3.6, rate: 0.21, soc: 62, online: true },
  { id: 'h5', name: 'Riverside Cottage', house: 'House #17', dist: '1.2 km', kwh: 1.4, rate: 0.18, soc: 41, online: false },
];

export const SORTS = [
  { key: 'kwh', label: 'Most kWh' },
  { key: 'rate', label: 'Cheapest' },
  { key: 'dist', label: 'Nearest' },
];

export default HOUSEHOLDS;
