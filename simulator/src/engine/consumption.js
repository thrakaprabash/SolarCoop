export function baseLoad(profile, hour) {
  if (profile === 'business') return hour >= 9 && hour < 17 ? 3 : hour >= 18 && hour < 22 ? 1 : 0.8;
  const [base, morning, evening] = { small: [0.25, 0.8, 1.5], family: [0.4, 1.5, 2.5], large: [0.6, 2, 3.8] }[profile] || [0.4, 1.5, 2.5];
  return hour >= 6 && hour < 8 ? morning : hour >= 18 && hour < 22 ? evening : base;
}
export const consumption = (device, hour, random = Math.random) => baseLoad(device.load_profile, hour) * Number(device.load_factor) * (0.9 + random() * 0.2);
