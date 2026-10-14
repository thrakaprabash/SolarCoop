/**
 * src/components/common/SolarCoopLogo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The SolarCoop brand mark — "Sun over rooftops": a sun rising behind three
 * homes (solar energy + community).
 *
 * Drawn on a 100×100 grid with react-native-svg, so it stays sharp at any size
 * on iOS, Android and web. The same geometry is saved as SVG in
 * assets/branding/ and was used to make the app icon, splash image and favicon.
 *
 * Props
 *   size         – width and height in px (default 40)
 *   variant      – 'tile' : cream rounded square with the mark (default; use it
 *                           wherever a logo badge is needed)
 *                  'mark' : the mark alone, on whatever is behind it
 *   tone         – 'light' : dark roofs, for light backgrounds (default)
 *                  'dark'  : cream roofs, for dark backgrounds   (variant 'mark')
 *   color        – draw the whole mark in one colour (e.g. on a coloured badge)
 *   gapColor     – with `color`: the badge colour, so the roofs stay separated
 *                  from the sun
 *   decorative   – hide it from screen readers (use when the app name is shown
 *                  right next to it)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Rect } from 'react-native-svg';

const BRAND = {
  ink: '#221408',
  cream: '#FFF9F2',
  sun: '#ED8936',
  ray: '#F6AD55',
  line: '#F0E3D3',
};

const RAYS = [
  [73, 46, 81, 46],
  [69.9, 34.5, 76.9, 30.5],
  [61.5, 26.1, 65.5, 19.2],
  [50, 23, 50, 15],
  [38.5, 26.1, 34.5, 19.2],
  [30.1, 34.5, 23.1, 30.5],
  [27, 46, 19, 46],
];

const ROOFS = [
  '12,84 12,70 24,58 36,70 36,84',
  '38,84 38,66 50,54 62,66 62,84',
  '64,84 64,70 76,58 88,70 88,84',
];

export function SolarCoopLogo({
  size = 40,
  variant = 'tile',
  tone = 'light',
  color,
  gapColor,
  decorative = false,
  style,
  accessibilityLabel = 'SolarCoop logo',
}) {
  const roof = color || (tone === 'dark' ? BRAND.cream : BRAND.ink);
  const sun = color || BRAND.sun;
  const ray = color || BRAND.ray;
  const separateRoofs = Boolean(color && gapColor);

  // `aria-hidden` works on iOS, Android and web; the older accessibility* props only cover the phones.
  const a11y = decorative
    ? { 'aria-hidden': true, accessible: false }
    : { accessible: true, accessibilityRole: 'image', accessibilityLabel };

  return (
    <View style={[{ width: size, height: size }, style]} {...a11y}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {variant === 'tile' ? (
          <Rect
            x="0.75"
            y="0.75"
            width="98.5"
            height="98.5"
            rx="21.5"
            fill={BRAND.cream}
            stroke={BRAND.line}
            strokeWidth="1.5"
          />
        ) : null}
        <G stroke={ray} strokeWidth="4" strokeLinecap="round">
          {RAYS.map(([x1, y1, x2, y2]) => (
            <Line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </G>
        <Circle cx="50" cy="46" r="17" fill={sun} />
        <G
          fill={roof}
          stroke={separateRoofs ? gapColor : undefined}
          strokeWidth={separateRoofs ? 3 : undefined}
          strokeLinejoin="round"
        >
          {ROOFS.map((points) => (
            <Polygon key={points} points={points} />
          ))}
        </G>
      </Svg>
    </View>
  );
}

export default SolarCoopLogo;
