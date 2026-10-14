import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../../theme';
import { useThemedStyles } from '../../../theme/useLegacyTheme';

export default function ScreenTitle({ title, subtitle }) {
  const styles = useThemedStyles(baseStyles);

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const baseStyles = StyleSheet.create({
  title: { ...type.screenTitle, color: colors.text },
  subtitle: { ...type.label, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
});
