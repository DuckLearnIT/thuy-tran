import { Easing } from 'remotion'

// Palette lifted from the website (src/index.css) so the trailer and site read as one brand.
export const C = {
  paper: '#ecdcc0',
  card: '#f6e9d7',
  ink: '#231511',
  vermilion: '#b5362b',
  ochre: '#d99a2b',
  indigo: '#15345f',
  bamboo: '#1a3a26',
  river: '#c9e1d5',
  sun: '#f3c766',
  deep: '#0b1d36',
  water: '#2f6f9a',
  foam: '#e9f1ec',
  woodLight: '#7a4a30',
  woodDark: '#3b2219',
}

export const W = 1920
export const H = 1080
export const FPS = 30

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
}

export const font = {
  display: 'Yellost, serif',
  body: 'Futura, sans-serif',
}

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
