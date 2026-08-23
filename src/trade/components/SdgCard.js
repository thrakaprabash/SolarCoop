import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, weight } from '../theme';
import { Card, Divider } from './ui';

export default function SdgCard({ goals }) {
  return (
    <Card style={styles.card}>
      {goals.map((goal, i) => {
        const amber = goal.accent === 'amber';
        const color = amber ? colors.amberLight : colors.tealLight;
        return (
          <React.Fragment key={goal.id}>
            <View style={styles.row}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: amber ? colors.amberTint : colors.tealTintSoft,
                    borderColor: amber ? colors.amberBorder : 'rgba(20,184,166,0.35)',
                  },
                ]}
              >
                <Text style={[styles.badgeLabel, { color }]}>SDG</Text>
                <Text style={[styles.badgeNumber, { color }]}>{goal.id}</Text>
              </View>
              <Text style={styles.title}>{goal.title}</Text>
            </View>
            {i < goals.length - 1 ? <Divider /> : null}
          </React.Fragment>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: { fontSize: 9, fontWeight: weight.heavy, lineHeight: 10 },
  badgeNumber: { fontSize: 16, fontWeight: weight.black, lineHeight: 18 },
  title: { flex: 1, fontSize: 13, fontWeight: weight.bold, color: colors.textStrong },
});
