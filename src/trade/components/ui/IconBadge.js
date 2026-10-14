import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';
import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

export default function IconBadge({
  size = 50,
  background = colors.tealTint,
  borderColor,
  radius: r,
  children,
  style,
}) {
  const styles = useThemedStyles(baseStyles);
  const { colors } = useLegacyTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: r != null ? r : size / 2,
          backgroundColor: background,
          borderWidth: borderColor ? 1 : 0,
          borderColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const baseStyles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
