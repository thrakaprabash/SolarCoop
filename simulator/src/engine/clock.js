const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
export function colomboClock(now = new Date()) {
  const p = Object.fromEntries(formatter.formatToParts(now).map(p => [p.type, p.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: +p.hour + +p.minute / 60 + +p.second / 3600 };
}
export const parseTime = time => time.split(':').reduce((h, v, i) => h + Number(v) / 60 ** i, 0);
export function formatTime(hour) {
  const minutes = Math.floor(((hour % 24 + 24) % 24) * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
export function advanceClock(config, elapsedSeconds, now = new Date()) {
  const real = colomboClock(now);
  return { ...real, hour: config.mode === 'live' ? real.hour :
    (parseTime(config.sim_time) + elapsedSeconds * Number(config.speed) / 3600) % 24,
  hours: elapsedSeconds * (config.mode === 'live' ? 1 : Number(config.speed)) / 3600 };
}
