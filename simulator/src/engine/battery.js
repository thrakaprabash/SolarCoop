export function battery(device, netKw, hours) {
  const capacity = Number(device.battery_kwh);
  if (!capacity || !hours) return { level: capacity ? Number(device.battery_level) : 0, flow: 0 };
  const previous = capacity * Number(device.battery_level) / 100;
  const stored = Math.min(capacity, Math.max(0, previous + netKw * hours));
  return { level: stored / capacity * 100, flow: (stored - previous) / hours };
}
