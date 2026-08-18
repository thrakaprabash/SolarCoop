import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, Sun, TrendingDown, TrendingUp, Zap } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';
import { Card, IconBadge, PrimaryButton } from './ui';

const ICONS = { zap: Zap, sun: Sun, down: TrendingDown, up: TrendingUp };

export default function InsightCard({ insight, onCta }) {
  const Icon = ICONS[insight.icon] || Zap;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <IconBadge size={42} background={insight.tint}>
          <Icon size={20} color={insight.color} strokeWidth={2} />
        </IconBadge>
        <View>
          <Text style={[styles.title, { color: insight.color }]}>{insight.title}</Text>
          <Text style={styles.tag}>{insight.tag}</Text>
        </View>
      </View>

      <Text style={styles.body}>{insight.body}</Text>

      <View style={styles.footer}>
        <Text style={styles.detail}>{insight.detail}</Text>
        {insight.cta ? (
          <PrimaryButton
            label={insight.cta}
            icon={ArrowUpRight}
            onPress={onCta}
            style={styles.cta}
          />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 15, fontWeight: weight.heavy },
  tag: {
    fontSize: 10,
    fontWeight: weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textFaint,
  },
  body: { fontSize: 13, lineHeight: 20, color: colors.textStrong },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  detail: { flex: 1, fontSize: 11, fontWeight: weight.medium, color: colors.textFaint },
  cta: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.md, gap: 6 },
});
