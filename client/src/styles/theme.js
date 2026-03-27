/**
 * StitchBazaar Design Tokens
 * Single source of truth for all brand colors, fonts, and design values.
 * Import this wherever inline styles or dynamic classes are needed.
 */

export const colors = {
  // Primary
  amber:      '#C88B00',
  amberLight: '#E0A500',
  amberDark:  '#A07000',
  coral:      '#D85A30',
  coralLight: '#E87050',
  coralDark:  '#B84020',

  // Accents
  emerald:     '#0F6E56',
  purple:      '#6A4C93',
  brightGreen: '#2DC653',
  steelBlue:   '#457B9D',
  teal:        '#0E7490',

  // Backgrounds
  warmWhite: '#FFFCF5',
  darkBg:    '#1C0A00',
  cardBg:    '#FFF8E7',

  // Bead palette (decorative dots)
  beads: ['#D85A30', '#C88B00', '#2DC653', '#0F6E56', '#6A4C93', '#457B9D'],

  // Card accent borders (cycle through these)
  cardAccents: ['#C88B00', '#D85A30', '#0F6E56', '#6A4C93', '#457B9D', '#2DC653'],
}

export const fonts = {
  serif: "'Georgia', 'Times New Roman', serif",
  sans:  "'Inter', system-ui, sans-serif",
}

export const shadows = {
  amber: '0 4px 24px 0 rgba(200,139,0,0.22)',
  coral: '0 4px 24px 0 rgba(216,90,48,0.20)',
  card:  '0 2px 16px 0 rgba(200,139,0,0.14)',
}

/** Pick a card accent color by index (cycles) */
export const cardAccent = (index) =>
  colors.cardAccents[index % colors.cardAccents.length]

/** Vendor color themes — each vendor gets one */
export const vendorThemes = [
  { bg: '#C88B00', text: '#1C0A00', label: 'Amber' },
  { bg: '#D85A30', text: '#FFFCF5', label: 'Coral' },
  { bg: '#0F6E56', text: '#FFFCF5', label: 'Emerald' },
  { bg: '#6A4C93', text: '#FFFCF5', label: 'Purple' },
  { bg: '#457B9D', text: '#FFFCF5', label: 'SteelBlue' },
]

export const vendorTheme = (index) =>
  vendorThemes[index % vendorThemes.length]

/** Format price from paisa to Rs. display */
export const formatPrice = (paisa) =>
  `Rs. ${(paisa / 100).toLocaleString('en-PK')}`
