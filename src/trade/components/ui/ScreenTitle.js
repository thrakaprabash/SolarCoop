import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, type } from '../../theme';

export default function ScreenTitle({ title, subtitle }) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...type.screenTitle, color: colors.text },
  subtitle: { ...type.label, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
});
