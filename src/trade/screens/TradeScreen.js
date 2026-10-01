import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft, CirclePlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, radius, weight } from '../theme';
import { MEMBER, MODULE_FEATURES } from '../data/features';
import { useNavigation } from '../context/NavigationContext';
import { FeatureRow } from '../components';
import { Card, IconBadge, PrimaryButton } from '../components/ui';

export default function TradeScreen() {
  const { t } = useTranslation();
  const { navigate } = useNavigation();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card padding={20} style={styles.hero}>
        <IconBadge size={56} style={styles.heroIcon}>
          <ArrowRightLeft size={28} color={colors.tealLight} strokeWidth={2} />
        </IconBadge>
        <Text style={styles.heroTitle}>{t('trade.home.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('trade.home.heroSubtitle')}</Text>
        <View style={styles.memberTag}>
          <Text style={styles.memberText}>{t('trade.home.memberTag', { number: MEMBER.number, name: MEMBER.name })}</Text>
        </View>
      </Card>

      <Card style={styles.featureCard}>
        <Text style={styles.featureHeading}>{t('trade.home.featureHeading')}</Text>
        <View style={styles.featureList}>
          {MODULE_FEATURES.map((feature, i) => (
            <FeatureRow
              key={feature.titleKey}
              feature={feature}
              last={i === MODULE_FEATURES.length - 1}
              onPress={() => navigate(feature.screen)}
            />
          ))}
        </View>
      </Card>

      <PrimaryButton
        label={t('trade.home.createRequest')}
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
