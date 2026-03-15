// RPG Theme Constants — eliminates hardcoded colors, fonts, sizes
export const COLORS = {
  gold: '#f0e68c',
  text: '#e8d5b0',
  textMuted: '#c8a87a',
  textDim: '#8b7355',
  error: '#ff6b6b',
  hp: '#ff6b6b',
  mp: '#4ecdc4',
  xp: '#00ff88',
  border: '#6b4c2a',
  borderLight: '#5c3a1e',
  bgDark: '#3a2210',
  bgDarker: '#2a1c0e',
  bgDarkest: '#1a120a',
  inputBg: 'rgba(10,8,4,0.6)',
  userChat: '#90ee90',
  editBlue: '#38bdf8',
  parchment: '#3a1e0a',
} as const

export const FONTS = {
  pixel: 'var(--font-pixel)',
  mono: 'var(--font-mono)',
  serif: 'Georgia, serif',
} as const

export const GRADIENTS = {
  button: 'linear-gradient(180deg, #6a4428 0%, #4a2a14 50%, #3a2210 100%)',
  panel: 'linear-gradient(180deg, #3a2a18 0%, #2a1c0e 100%)',
  tabBar: 'linear-gradient(to bottom, #2a1a0e, #1a120a)',
} as const

export const TIMING = {
  errorToast: 3000,
  longToast: 5000,
  successFlash: 2000,
} as const

export const SIZES = {
  npcPortrait: '80px',
  shopPageSize: 9,
  bulletinPageSize: 6,
  maxEvents: 200,
  maxNpcHistory: 20,
} as const

// Common style patterns
export const INPUT_STYLE: React.CSSProperties = {
  padding: '5px 8px',
  background: COLORS.inputBg,
  border: `1px solid ${COLORS.borderLight}`,
  color: COLORS.text,
  fontFamily: FONTS.mono,
  fontSize: '10px',
}

export const SOURCE_COLOR: Record<string, string> = {
  official: 'var(--green)',
  github: 'var(--cyan)',
  'claude-marketplace': '#b48eff',
  clawhub: '#ff9944',
  lobehub: '#55bbff',
}
