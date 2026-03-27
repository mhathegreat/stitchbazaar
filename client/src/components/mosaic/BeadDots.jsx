/**
 * BeadDots
 * Renders a row of cascading colored bead/dot decorations.
 * Used near headings, CTAs, and section breaks.
 */

import { colors } from '../../styles/theme.js'

const DEFAULT_BEADS = colors.beads

/**
 * @param {object}   props
 * @param {string[]} [props.palette]   override bead colors
 * @param {number}   [props.count=6]   number of beads
 * @param {string}   [props.className]
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
export default function BeadDots({
  palette = DEFAULT_BEADS,
  count = 6,
  size = 'md',
  className = '',
}) {
  const sizes = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' }
  const dot = sizes[size] ?? sizes.md

  return (
    <span className={`inline-flex items-end gap-1.5 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className={`${dot} rounded-full inline-block`}
          style={{
            backgroundColor: palette[i % palette.length],
            marginBottom: `${(i % 3) * 3}px`,     // cascading vertical rhythm
            opacity: 0.85 + (i % 3) * 0.05,
          }}
        />
      ))}
    </span>
  )
}
