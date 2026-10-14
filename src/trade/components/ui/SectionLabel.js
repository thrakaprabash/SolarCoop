import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, type } from '../../theme';
import { useThemedStyles } from '../../../theme/useLegacyTheme';

export default function SectionLabel({ children, style }) {
  const styles = useThemedStyles(baseStyles);

  return <Text style={[styles.label, style]}>{children}</Text>;
}

const baseStyles = StyleSheet.create({
  label: { ...type.overline, color: colors.textFaint },
});
