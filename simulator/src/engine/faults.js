export const FAULTS = {
  E01: { title: 'Inverter offline', weight: 10, status: 'offline' },
  E02: { title: 'Panel underperforming (dust/shade)', weight: 35, status: 'degraded' },
  E03: { title: 'Grid over-voltage trip', weight: 5, status: 'fault' },
  E04: { title: 'Ground / insulation fault', weight: 3, status: 'fault', safety: true },
  E05: { title: 'Over-temperature derate', weight: 20, status: 'degraded' },
  E06: { title: 'String disconnected', weight: 15, status: 'degraded' },
  E07: { title: 'Meter communication lost', weight: 10, status: 'offline', stale: true },
  E08: { title: 'Arc fault detected', weight: 2, status: 'fault', safety: true },
};
export function faultEffect(device, fault, sun, tick) {
  let health = [...device.panel_health];
  let multiplier = 1;
  switch (fault?.code) {
    case 'E01': case 'E04': case 'E08': multiplier = 0; break;
    case 'E02': multiplier = 0.6; break;
    case 'E03': multiplier = tick % 6 < 3 ? 0 : 1; break;
    case 'E05': multiplier = sun > 0.6 ? 0.7 : 1; break;
    case 'E06': {
      const string = Number(fault.details?.string || 1);
      health = health.map((h, i) => Math.floor(i * device.string_count / device.panel_count) + 1 === string ? 0 : h);
      break;
    }
  }
  return { health, multiplier, stale: fault?.code === 'E07', safety: !!FAULTS[fault?.code]?.safety };
}
export function randomFault(random = Math.random) {
  let roll = random() * 100;
  return Object.keys(FAULTS).find(code => (roll -= FAULTS[code].weight) < 0) || 'E08';
}
