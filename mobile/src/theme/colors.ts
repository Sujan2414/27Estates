export const colors = {
  // Backgrounds
  bg: '#F1F3F8',
  surface: '#FEFEFE',
  surfaceAlt: '#F9FAFB',
  surfaceHover: '#F2F4F7',

  // Borders
  border: '#EAECF0',
  borderStrong: '#D0D5DD',

  // Brand Primary (Dark Teal Green) - full scale
  primary: '#183C38',
  primaryLight: '#E6F2F0',
  primaryDark: '#0E2422',
  primaryText: '#FFFFFF',
  primaryMid: '#1E4D47',
  primary25: '#F0FAF8',
  primary50: '#E6F2F0',
  primary100: '#D1EBE7',
  primary200: '#B0DDD6',
  primary300: '#7FC4B8',
  primary400: '#4DA99A',
  primary500: '#2A6B62',
  primary600: '#1E4D47',
  primary700: '#183C38',
  primary800: '#0E2422',
  primary900: '#091A18',

  // Gradient stops
  gradientFrom: '#2A6B62',
  gradientVia: '#1E4D47',
  gradientTo: '#0E2422',

  // Gold Accent
  gold: '#BFA270',
  goldLight: '#FEF6E4',
  goldMuted: 'rgba(191, 162, 112, 0.7)',

  // Semantic
  success: '#0BAB7A',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  info: '#2563EB',
  infoLight: '#EFF6FF',
  red500: '#F95555',

  // Typography
  textPrimary: '#101828',
  textSecondary: '#475467',
  textMuted: '#98A2B3',
  textDisabled: '#D0D5DD',
  textInverse: '#FFFFFF',
  textAccent: '#183C38',

  // Lead Temperature
  hot: '#DC2626', hotBg: '#FEF2F2',
  warm: '#D97706', warmBg: '#FFFBEB',
  cold: '#2563EB', coldBg: '#EFF6FF',
  dead: '#9CA3AF', deadBg: '#F9FAFB',

  // Overlay
  overlay: 'rgba(16, 19, 33, 0.87)',

  // Pipeline status
  statusNew: '#183C38', statusNewBg: '#E6F2F0',
  statusContacted: '#2563EB', statusContactedBg: '#EFF6FF',
  statusQualified: '#0BAB7A', statusQualifiedBg: '#ECFDF5',
  statusNegotiation: '#D97706', statusNegotiationBg: '#FFFBEB',
  statusSiteVisit: '#EA580C', statusSiteVisitBg: '#FFF7ED',
  statusConverted: '#16A34A', statusConvertedBg: '#F0FDF4',
  statusLost: '#6B7280', statusLostBg: '#F9FAFB',

  // Tab bar
  tabBg: '#1C2020',
  tabActive: '#FEFEFE',
  tabInactive: '#6B7280',

  // Navigation bar
  navBg: '#FEFEFE',
  navBorder: '#EAECF0',
} as const

export const shadows = {
  xs: { shadowColor: '#101828', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  card: { shadowColor: '#101828', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  modal: { shadowColor: '#101828', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 10 },
  fab: { shadowColor: '#183C38', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  header: { shadowColor: '#101828', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  onboard: { shadowColor: '#C2D4FF', shadowOffset: { width: -8, height: 8 }, shadowOpacity: 0.1, shadowRadius: 27, elevation: 4 },
}

export const radius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 100, full: 9999 }

// Typography - Inter-based, matching Figma Workmate design system
export const type = {
  // Headline
  headlineSm: { fontSize: 24, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 32 },
  // Title
  titleMd: { fontSize: 16, fontWeight: '500' as const, letterSpacing: 0.15, lineHeight: 24 },
  titleSm: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1, lineHeight: 20 },
  // Label
  labelLg: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1, lineHeight: 20 },
  labelMd: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5, lineHeight: 16 },
  labelSm: { fontSize: 11, fontWeight: '500' as const, letterSpacing: -0.15, lineHeight: 16 },
  // Body
  bodyLg: { fontSize: 16, fontWeight: '400' as const, letterSpacing: 0.5, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.25, lineHeight: 20 },
  bodySm: { fontSize: 12, fontWeight: '400' as const, letterSpacing: -0.2, lineHeight: 16 },
  // Legacy aliases
  h1: { fontSize: 24, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 31 },
  h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.3, lineHeight: 26 },
  h3: { fontSize: 16, fontWeight: '500' as const, letterSpacing: 0.15, lineHeight: 24 },
  h4: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0, lineHeight: 20 },
  body: { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.25, lineHeight: 20 },
  bodyM: { fontSize: 14, fontWeight: '500' as const, letterSpacing: -0.5, lineHeight: 20 },
  sm: { fontSize: 13, fontWeight: '500' as const, letterSpacing: -0.5, lineHeight: 17 },
  smM: { fontSize: 12, fontWeight: '500' as const, letterSpacing: -0.5, lineHeight: 16 },
  xs: { fontSize: 11, fontWeight: '500' as const, letterSpacing: -0.15, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '400' as const, letterSpacing: -0.2, lineHeight: 16 },
  labelM: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1, lineHeight: 20 },
  tiny: { fontSize: 10, fontWeight: '500' as const, letterSpacing: -0.5, lineHeight: 13 },
}
