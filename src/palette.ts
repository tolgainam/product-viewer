/**
 * Palette — the standalone design values this package ships with.
 *
 * In genUI these come from a design system that reads brand presets at runtime.
 * Here they are frozen constants so the component looks the same anywhere, with no
 * theme provider or setup. Restyle the viewer through the `visualConfig` prop, or
 * import these values to match your own surfaces.
 *
 * @author Tolga Inam <tolgainam@gmail.com>
 * @license MIT
 */

export const colors = {
  primary: {
    accent: '#00d1d2',
    light: '#fffdfb',
    dark: '#393e44',
  },
  text: {
    light: '#fffdfb',
    dark: '#393e44',
    disabled: '#d7d8d9',
    focus: '#393e44',
  },
  border: {
    light: '#fffdfb',
    dark: '#393e44',
    disabled: '#606568',
    focus: '#00476e',
  },
  neutral: {
    5: '#ebecec',
    15: '#d7d8d9',
    30: '#c3c5c6',
    50: '#9c9fa1',
    65: '#888b8e',
    85: '#606568',
    140: '#1c1f21',
  },
  background: {
    default: '#fffdfb',
    white: '#ffffff',
    dark: '#393e44',
    disabled: '#9c9fa1',
    focus: '#e1f5fe',
    /** Stage behind a 3D model: dark, with enough green to sit with the product palette */
    model: '#1e2a26',
  },
  success: { main: '#2f7c34', light: '#e8f5e9', dark: '#1d4d21' },
  error: { main: '#d42e30', light: '#ffebee', dark: '#651314' },
  warning: { main: '#fdac13', light: '#ffedcc', dark: '#915f00' },
  info: { main: '#0070ae', light: '#e1f5fe', dark: '#00476e' },
} as const

/**
 * Type scale. Display sizes (poster, fs1–fs6) are regular weight, headings bold.
 *
 * The stack starts with Inter and falls back to the system sans. No font is
 * bundled, so the component renders identically anywhere without a download.
 *
 * Note: `Text` applies this inline on every element, so a parent CSS rule cannot
 * override it. An app with its own brand face has to change this constant — there
 * is no per-instance font override yet.
 */
export const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',

  desktop: {
    poster: { fontSize: 96, fontWeight: 400, lineHeight: 104 / 96 },
    fs1: { fontSize: 64, fontWeight: 400, lineHeight: 72 / 64 },
    fs2: { fontSize: 56, fontWeight: 400, lineHeight: 64 / 56 },
    fs3: { fontSize: 42, fontWeight: 400, lineHeight: 56 / 42 },
    fs4: { fontSize: 32, fontWeight: 400, lineHeight: 42 / 32 },
    fs5: { fontSize: 28, fontWeight: 400, lineHeight: 36 / 28 },
    fs6: { fontSize: 24, fontWeight: 400, lineHeight: 32 / 24 },
    h1: { fontSize: 64, fontWeight: 700, lineHeight: 72 / 64 },
    h2: { fontSize: 56, fontWeight: 700, lineHeight: 64 / 56 },
    h3: { fontSize: 42, fontWeight: 700, lineHeight: 56 / 42 },
    h4: { fontSize: 32, fontWeight: 700, lineHeight: 42 / 32 },
    h5: { fontSize: 28, fontWeight: 700, lineHeight: 36 / 28 },
    h6: { fontSize: 24, fontWeight: 700, lineHeight: 32 / 24 },
  },

  mobile: {
    poster: { fontSize: 40, fontWeight: 400, lineHeight: 48 / 40 },
    fs1: { fontSize: 40, fontWeight: 400, lineHeight: 44 / 40 },
    fs2: { fontSize: 32, fontWeight: 400, lineHeight: 40 / 32 },
    fs3: { fontSize: 28, fontWeight: 400, lineHeight: 40 / 28 },
    fs4: { fontSize: 24, fontWeight: 400, lineHeight: 32 / 24 },
    fs5: { fontSize: 20, fontWeight: 400, lineHeight: 28 / 20 },
    fs6: { fontSize: 18, fontWeight: 400, lineHeight: 24 / 18 },
    h1: { fontSize: 40, fontWeight: 700, lineHeight: 44 / 40 },
    h2: { fontSize: 32, fontWeight: 700, lineHeight: 40 / 32 },
    h3: { fontSize: 28, fontWeight: 700, lineHeight: 40 / 28 },
    h4: { fontSize: 24, fontWeight: 700, lineHeight: 32 / 24 },
    h5: { fontSize: 20, fontWeight: 700, lineHeight: 28 / 20 },
    h6: { fontSize: 18, fontWeight: 700, lineHeight: 24 / 18 },
  },

  body: {
    body1: { fontSize: 16, fontWeight: 400, lineHeight: 24 / 16 },
    body2: { fontSize: 14, fontWeight: 400, lineHeight: 20 / 14 },
    body3: { fontSize: 12, fontWeight: 400, lineHeight: 16 / 12 },
    caption: { fontSize: 12, fontWeight: 400, lineHeight: 16 / 12 },
  },

  button: { fontSize: 16, fontWeight: 400, lineHeight: 24 / 16 },
} as const

/** Spacing steps in pixels (4, 8, 16, 24, 32, 48, 64, 80, 96, 120) */
export const spacing = {
  1: 4,
  2: 8,
  3: 16,
  4: 24,
  5: 32,
  6: 48,
  7: 64,
  8: 80,
  9: 96,
  10: 120,
} as const

/** Spacing step as a CSS pixel string, e.g. getSpacingPx(3) === '16px' */
export const getSpacingPx = (key: keyof typeof spacing): string => `${spacing[key]}px`

/** Corner radii; 100 is the pill shape used by the feature pills */
export const borderRadius = {
  1: 4,
  2: 8,
  3: 16,
  4: 24,
  100: 100,
} as const

/** Breakpoints matching genUI's MUI theme; the viewer switches layout below `lg` */
export const muiBreakpoints = {
  xs: 0,
  sm: 599,
  md: 899,
  lg: 1199,
  xl: 1536,
} as const

/** Maximum content width per breakpoint, used by the desktop layout */
export const containerPageWidth = {
  large: {
    xs: `calc(100vw - ${getSpacingPx(4)} - ${getSpacingPx(4)})`,
    sm: `calc(${muiBreakpoints.sm}px - ${getSpacingPx(4)} - ${getSpacingPx(4)})`,
    md: `calc(${muiBreakpoints.md}px - ${getSpacingPx(5)} - ${getSpacingPx(5)})`,
    lg: `calc(${muiBreakpoints.lg}px - ${getSpacingPx(6)} - ${getSpacingPx(6)})`,
    xl: `calc(${muiBreakpoints.xl}px - ${getSpacingPx(7)} - ${getSpacingPx(7)})`,
  },
  full: {
    xs: '100vw',
    sm: '100vw',
    md: '100vw',
    lg: `${muiBreakpoints.lg}px`,
    xl: `${muiBreakpoints.xl}px`,
  },
} as const

/** Every palette value in one object, for consumers who want to inspect or mirror them */
export const palette = {
  colors,
  typography,
  spacing,
  borderRadius,
  muiBreakpoints,
  containerPageWidth,
} as const
