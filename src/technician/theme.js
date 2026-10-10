// Neutral surfaces keep fault priorities easy to distinguish.
export const TECH_LIGHT = {
  heroStart: '#FFF0DF', heroEnd: '#FFFAF4',
  action: '#B94D0B', onAccent: '#FFFFFF',
  bg: '#F4F6F8', card: '#FFFFFF', cardRaised: '#EDF1F5', border: '#E0E5EB', borderStrong: '#C6CFD9',
  orange: '#B54B0A', orangeDark: '#963C08', orangeSoft: '#FFF0E5', orangeBorder: '#EDBF9E',
  red: '#C13232', redSoft: '#FFF0F0', redBorder: '#EDB5B5', amber: '#956000', amberSoft: '#FFF5DC',
  green: '#187547', greenSoft: '#E8F5ED', greenBorder: '#A4D6BA', blue: '#2563A6',
  text: '#172331', textSecondary: '#526174', textMuted: '#58697C',
};
export const TECH_DARK = {
  heroStart: '#33261D', heroEnd: '#1D252D',
  action: '#B94D0B', onAccent: '#101820',
  bg: '#101820', card: '#19232E', cardRaised: '#23303D', border: '#2B3948', borderStrong: '#465669',
  orange: '#FFAD70', orangeDark: '#B94D0B', orangeSoft: '#34271F', orangeBorder: '#775237',
  red: '#FF9393', redSoft: '#342329', redBorder: '#835159', amber: '#EEC66B', amberSoft: '#332D20',
  green: '#7CD8A5', greenSoft: '#1C342B', greenBorder: '#3D7257', blue: '#88BCF0',
  text: '#EEF3F8', textSecondary: '#B1BFCE', textMuted: '#94A5B8',
};
export const resolveTechMode = (preference, systemScheme) =>
  preference === 'light' || preference === 'dark' ? preference : systemScheme === 'dark' ? 'dark' : 'light';
export const getUrgencyColor = (palette, urgency) =>
  ({ urgent: palette.red, medium: palette.amber, low: palette.green })[urgency] ?? palette.green;
