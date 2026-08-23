import { colors } from '../theme';
import { sum } from './format';

/**
 * Derives the Smart Energy Insight cards from a member's energy record.
 * icon is a key resolved by components/InsightCard.
 */
export function buildInsights(d) {
  const out = [];
  const avg = sum(d.last7Consumption) / d.last7Consumption.length;
  const diff = ((d.todayConsumption - avg) / avg) * 100;
  const detail =
    'Today ' + d.todayConsumption.toFixed(1) + ' kWh · 7-day avg ' + avg.toFixed(2) + ' kWh';

  if (diff > 10) {
    out.push({
      id: 'consumption',
      icon: 'zap',
      color: colors.amberLight,
      tint: colors.amberTint,
      title: 'Higher Consumption',
      tag: 'Consumption alert',
      body: 'Your consumption today is ' + Math.round(diff) + '% higher than your recent average.',
      detail,
    });
  } else if (diff < -10) {
    out.push({
      id: 'consumption',
      icon: 'down',
      color: colors.tealLight,
      tint: colors.tealTint,
      title: 'Great Progress',
      tag: 'Consumption',
      body:
        'Your consumption today is ' +
        Math.round(Math.abs(diff)) +
        '% lower than your recent average.',
      detail,
    });
  } else {
    out.push({
      id: 'consumption',
      icon: 'zap',
      color: colors.tealLight,
      tint: colors.tealTint,
      title: 'Normal Usage',
      tag: 'Consumption',
      body: 'Your consumption today is in line with your recent average.',
      detail,
    });
  }

  const surplus = d.todayProduction - d.todayConsumption;
  if (surplus > 0) {
    out.push({
      id: 'surplus',
      icon: 'sun',
      color: colors.amberLight,
      tint: colors.amberTint,
      title: 'Surplus Available',
      tag: 'Sharing opportunity',
      body:
        'You currently have ' + surplus.toFixed(1) + ' kWh available to share with the community.',
      detail:
        'Production ' +
        d.todayProduction.toFixed(1) +
        ' kWh − consumption ' +
        d.todayConsumption.toFixed(1) +
        ' kWh',
      cta: 'Share Energy',
    });
  }

  const t = d.last3Consumption;
  const trail = t.map((v) => v.toFixed(1)).join(' → ') + ' kWh';
  if (t[0] > t[1] && t[1] > t[2]) {
    out.push({
      id: 'trend',
      icon: 'down',
      color: colors.tealLight,
      tint: colors.tealTint,
      title: 'Positive Trend',
      tag: 'Three-day trend',
      body: 'Your energy consumption has decreased for 3 consecutive days.',
      detail: trail,
    });
  } else if (t[0] < t[1] && t[1] < t[2]) {
    out.push({
      id: 'trend',
      icon: 'up',
      color: colors.amberLight,
      tint: colors.amberTint,
      title: 'Consumption Increasing',
      tag: 'Three-day trend',
      body: 'Your consumption has increased over the last 3 days.',
      detail: trail,
    });
  }

  return out;
}

export function selfSufficiency(impact) {
  const produced = sum(impact.production);
  return Math.min(
    100,
    Math.round((Math.min(produced, impact.totalConsumption) / impact.totalConsumption) * 100)
  );
}
