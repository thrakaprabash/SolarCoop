import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, type } from '../../theme';

export default function SectionLabel({ children, style }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: { ...type.overline, color: colors.textFaint },
});
