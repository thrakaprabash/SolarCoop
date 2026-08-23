import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, MapPin } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';
import { Card, Metric, Pill, PrimaryButton, ProgressBar } from './ui';
import { kwh, rate as fmtRate } from '../utils/format';

export default function HouseholdCard({ household, requested, onRequest, accentColor = colors.teal }) {
  const { name, house, dist, soc, online } = household;
  const buttonBg = !online ? 'rgba(255,255,255,0.12)' : requested ? colors.tealTintStrong : accentColor;

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.metaRow}>
            <MapPin size={11} color={colors.textFaint} strokeWidth={2.2} />
            <Text style={styles.meta}>{house + ' · ' + dist}</Text>
          </View>
        </View>
        <Pill
          label={online ? 'Live' : 'Offline'}
          dotColor={online ? colors.teal : colors.textFaint}
          background={online ? colors.tealTintSoft : colors.surfaceAlt}
          color={online ? colors.tealLight : colors.textFaint}
        />
      </View>

      <View style={styles.figures}>
        <Metric label="Available" value={kwh(household.kwh)} unit="kWh" size="sm" />
        <View style={styles.rateBlock}>
          <Text style={styles.rateLabel}>Rate</Text>
          <Text style={styles.rateValue}>
            {'$' + fmtRate(household.rate)}
            <Text style={styles.rateUnit}> / kWh</Text>
          </Text>
        </View>
      </View>

      <View style={styles.socBlock}>
        <View style={styles.socRow}>
          <Text style={styles.socLabel}>Battery State (SoC)</Text>
          <Text style={styles.socValue}>{soc + '%'}</Text>
        </View>
        <ProgressBar value={soc} />
      </View>

      <PrimaryButton
        label={requested ? 'Requested' : 'Request Energy'}
        icon={ArrowUpRight}
        onPress={onRequest}
        disabled={!online}
        background={buttonBg}
        style={styles.action}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  name: { fontSize: 15, fontWeight: weight.heavy, color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  meta: { fontSize: 10, fontWeight: weight.medium, color: colors.textFaint },
  figures: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  rateBlock: { alignItems: 'flex-end' },
  rateLabel: {
    fontSize: 10,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textFaint,
  },
  rateValue: { fontSize: 15, fontWeight: weight.heavy, color: colors.amber },
  rateUnit: { fontSize: 11, fontWeight: weight.medium, color: colors.textMuted },
  socBlock: { gap: 6 },
  socRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  socLabel: { fontSize: 11, fontWeight: weight.medium, color: colors.textMuted },
  socValue: { fontSize: 12, fontWeight: weight.heavy, color: colors.teal },
  action: { alignSelf: 'flex-end', paddingVertical: 11, paddingHorizontal: 18, borderRadius: radius.lg },
});
