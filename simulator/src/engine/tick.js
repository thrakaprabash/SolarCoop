import { advanceClock, colomboClock, formatTime } from './clock.js';
import { faultEffect } from './faults.js';
import { production, sunCurve } from './solar.js';
import { consumption } from './consumption.js';
import { battery } from './battery.js';

// A pure calculation: the caller commits state only after the database accepts it.
export function tick(snapshot, previous = {}, { elapsedSeconds = 3, now = new Date(), index = 0, forceRecord = false, random = Math.random } = {}) {
  const clock = advanceClock(snapshot.config, elapsedSeconds, now);
  const next = {};
  const batch = [];
  for (const device of snapshot.devices) {
    const id = device.id;
    const fault = snapshot.faults.find(f => f.device_id === id);
    const effect = faultEffect(device, fault, sunCurve(clock.hour), index);
    const persisted = device.metrics;
    const saved = previous[id] || (persisted?.is_simulated ? {
      day: colomboClock(new Date(persisted.updated_at)).day,
      production: Number(persisted.daily_production), consumption: Number(persisted.daily_consumption),
    } : {});
    const rollover = saved.day !== clock.day;
    if (effect.stale) {
      next[id] = { ...saved, effect,
        instantProduction: saved.instantProduction ?? Number(persisted?.instant_production || 0),
        instantConsumption: saved.instantConsumption ?? Number(persisted?.instant_consumption || 0),
      };
      continue;
    }
    const prod = production(device, clock.hour, snapshot.config.weather, effect, random);
    const cons = consumption(device, clock.hour, random);
    const pack = battery({ ...device, battery_level: saved.batteryLevel ?? device.battery_level }, prod - cons, clock.hours);
    const totals = {
      day: clock.day, production: (rollover ? 0 : saved.production || 0) + prod * clock.hours,
      consumption: (rollover ? 0 : saved.consumption || 0) + cons * clock.hours, batteryLevel: pack.level,
      instantProduction: prod, instantConsumption: cons, effect,
      history: [...(saved.history || []).slice(-39), prod],
    };
    next[id] = totals;
    batch.push({ device_id: id, instant_production: prod, instant_consumption: cons,
      daily_production: totals.production, daily_consumption: totals.consumption,
      battery_level: pack.level, battery_power_flow: pack.flow,
      write_record: forceRecord || rollover || index % 10 === 0,
      slot: Math.floor(clock.hour / 2), rollover,
    });
  }
  return { state: next, batch, clock, simTime: formatTime(clock.hour) + `:${String(Math.floor(clock.hour * 3600) % 60).padStart(2, '0')}` };
}
