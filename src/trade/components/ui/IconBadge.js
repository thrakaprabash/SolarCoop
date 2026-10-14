import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemedStyles, useLegacyTheme } from '../../../theme/useLegacyTheme';

export default function IconBadge({
  size = 50,
  background,
  borderColor,
  radius: r,
  children,
  style,
}) {
  const styles = useThemedStyles(baseStyles);
  const { colors, themeColor } = useLegacyTheme();

  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: r != null ? r : size / 2,
          backgroundColor: background ? themeColor(background, 'backgroundColor') : colors.tealTint,
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
