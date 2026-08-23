import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft, CirclePlus } from 'lucide-react-native';

import { colors, radius, weight } from '../theme';
import { MEMBER, MODULE_FEATURES } from '../data/features';
import { useNavigation } from '../context/NavigationContext';
import { FeatureRow } from '../components';
import { Card, IconBadge, PrimaryButton } from '../components/ui';

export default function TradeScreen() {
  const { navigate } = useNavigation();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card padding={20} style={styles.hero}>
        <IconBadge size={56} style={styles.heroIcon}>
          <ArrowRightLeft size={28} color={colors.tealLight} strokeWidth={2} />
        </IconBadge>
        <Text style={styles.heroTitle}>P2P Energy Trading</Text>
        <Text style={styles.heroSubtitle}>Community Energy Exchange &amp; Request Approvals</Text>
        <View style={styles.memberTag}>
          <Text style={styles.memberText}>{MEMBER.label}</Text>
        </View>
      </Card>

      <Card style={styles.featureCard}>
        <Text style={styles.featureHeading}>Module Features</Text>
        <View style={styles.featureList}>
          {MODULE_FEATURES.map((feature, i) => (
            <FeatureRow
              key={feature.title}
              feature={feature}
              last={i === MODULE_FEATURES.length - 1}
              onPress={() => navigate(feature.screen)}
            />
          ))}
        </View>
      </Card>

      <PrimaryButton
        label="Create Energy Request"
        icon={CirclePlus}
        variant="ghost"
        onPress={() => navigate('list')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 20, gap: 16 },
  hero: { alignItems: 'center', gap: 8 },
  heroIcon: { marginBottom: 4 },
  heroTitle: { fontSize: 20, fontWeight: weight.heavy, color: colors.text },
  heroSubtitle: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  memberTag: {
    backgroundColor: colors.tealTint,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  memberText: { color: colors.tealLight, fontSize: 11, fontWeight: weight.heavy },
  featureCard: { gap: 12 },
  featureHeading: { fontSize: 16, fontWeight: weight.heavy, color: colors.text },
  featureList: { gap: 12 },
});
