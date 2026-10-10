export const sunCurve = hour => hour <= 6 || hour >= 18 ? 0 : Math.sin(Math.PI * (hour - 6) / 12) ** 1.3;
export function weatherFactor(weather, random = Math.random) {
  if (weather === 'partly') return 0.55 + random() * 0.3;
  if (weather === 'storm') return random() < 0.15 ? 0 : 0.05;
  return { sunny: 1, cloudy: 0.4, rain: 0.15 }[weather] ?? 1;
}
export function production(device, hour, weather, effect, random = Math.random) {
  const health = effect.health.length ? effect.health.reduce((a, b) => a + Number(b), 0) / effect.health.length : 0;
  return Number(device.capacity_kw) * sunCurve(hour) * weatherFactor(weather, random) * health * effect.multiplier * (0.97 + random() * 0.06);
}
