import { Platform } from 'react-native';

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

/* React Native maps numeric weights on both platforms; keep them as strings. */
export const weight = {
  regular: '500',
  medium: '600',
  bold: '700',
  heavy: '800',
  black: '900',
};

export const type = {
  screenTitle: { fontSize: 22, fontWeight: weight.heavy, letterSpacing: -0.5, lineHeight: 26 },
  cardTitle: { fontSize: 16, fontWeight: weight.heavy },
  itemTitle: { fontSize: 15, fontWeight: weight.heavy },
  metric: { fontSize: 32, fontWeight: weight.heavy, lineHeight: 36 },
  metricSm: { fontSize: 28, fontWeight: weight.heavy, lineHeight: 31 },
  unit: { fontSize: 18, fontWeight: weight.medium },
  label: { fontSize: 12, fontWeight: weight.medium },
  labelCaps: { fontSize: 12, fontWeight: weight.medium, textTransform: 'uppercase', letterSpacing: 0.3 },
  overline: { fontSize: 11, fontWeight: weight.bold, textTransform: 'uppercase', letterSpacing: 1 },
  body: { fontSize: 13, lineHeight: 20 },
  caption: { fontSize: 11, fontWeight: weight.medium },
  micro: { fontSize: 10, fontWeight: weight.medium },
  button: { fontSize: 14, fontWeight: weight.bold },
};

export default type;
