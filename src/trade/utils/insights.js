import { colors } from '../theme';
import { sum } from './format';

/**
 * Derives the Smart Energy Insight cards from a member's energy record.
 * icon is a key resolved by components/InsightCard. title/tag/body/detail/cta
 * are i18n keys (+ optional params) resolved at render time by InsightCard.
 */
export function buildInsights(d) {
  const out = [];
  const avg = sum(d.last7Consumption) / d.last7Consumption.length;
  const diff = ((d.todayConsumption - avg) / avg) * 100;
  const detailParams = { today: d.todayConsumption.toFixed(1), avg: avg.toFixed(2) };

  if (diff > 10) {
    out.push({
      id: 'consumption',
      icon: 'zap',
      color: colors.amberLight,
      tint: colors.amberTint,
      titleKey: 'trade.insights.consumption.higherTitle',
      tagKey: 'trade.insights.consumption.alertTag',
      bodyKey: 'trade.insights.consumption.higherBody',
      bodyParams: { percent: Math.round(diff) },
      detailKey: 'trade.insights.consumption.detail',
      detailParams,
    });
  } else if (diff < -10) {
    out.push({
      id: 'consumption',
      icon: 'down',
      color: colors.tealLight,
      tint: colors.tealTint,
      titleKey: 'trade.insights.consumption.lowerTitle',
      tagKey: 'trade.insights.consumption.tag',
      bodyKey: 'trade.insights.consumption.lowerBody',
      bodyParams: { percent: Math.round(Math.abs(diff)) },
      detailKey: 'trade.insights.consumption.detail',
      detailParams,
    });
  } else {
    out.push({
      id: 'consumption',
      icon: 'zap',
      color: colors.tealLight,
      tint: colors.tealTint,
      titleKey: 'trade.insights.consumption.normalTitle',
      tagKey: 'trade.insights.consumption.tag',
      bodyKey: 'trade.insights.consumption.normalBody',
      detailKey: 'trade.insights.consumption.detail',
      detailParams,
    });
  }

  const surplus = d.todayProduction - d.todayConsumption;
  if (surplus > 0) {
    out.push({
      id: 'surplus',
      icon: 'sun',
      color: colors.amberLight,
      tint: colors.amberTint,
      titleKey: 'trade.insights.surplus.title',
      tagKey: 'trade.insights.surplus.tag',
      bodyKey: 'trade.insights.surplus.body',
      bodyParams: { surplus: surplus.toFixed(1) },
      detailKey: 'trade.insights.surplus.detail',
      detailParams: { prod: d.todayProduction.toFixed(1), cons: d.todayConsumption.toFixed(1) },
      ctaKey: 'trade.insights.surplus.cta',
    });
  }

  const last3 = d.last3Consumption;
  const trail = last3.map((v) => v.toFixed(1)).join(' → ') + ' kWh';
  if (last3[0] > last3[1] && last3[1] > last3[2]) {
    out.push({
      id: 'trend',
      icon: 'down',
      color: colors.tealLight,
      tint: colors.tealTint,
      titleKey: 'trade.insights.trend.positiveTitle',
      tagKey: 'trade.insights.trend.tag',
      bodyKey: 'trade.insights.trend.positiveBody',
      detail: trail,
    });
  } else if (last3[0] < last3[1] && last3[1] < last3[2]) {
    out.push({
      id: 'trend',
      icon: 'up',
      color: colors.amberLight,
      tint: colors.amberTint,
      titleKey: 'trade.insights.trend.increasingTitle',
      tagKey: 'trade.insights.trend.tag',
      bodyKey: 'trade.insights.trend.increasingBody',
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
