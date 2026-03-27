/**
 * BrushstrokeHeading
 * Section heading with Georgia serif font and a hand-painted brushstroke
 * underline in amber. Optionally renders bead dots beside the text.
 */

import BeadDots from './BeadDots.jsx'

/**
 * @param {object}      props
 * @param {React.ReactNode} props.children  heading text (supports JSX for color splits)
 * @param {'h1'|'h2'|'h3'} [props.as='h2']
 * @param {string}      [props.className]   extra classes
 * @param {boolean}     [props.beads=true]  show bead decorations
 * @param {string}      [props.strokeColor='#C88B00'] brushstroke color
 * @param {'center'|'left'} [props.align='center']
 */
export default function BrushstrokeHeading({
  children,
  as: Tag = 'h2',
  className = '',
  beads = true,
  strokeColor = '#C88B00',
  align = 'center',
}) {
  const alignClass = align === 'center' ? 'text-center justify-center' : 'text-left justify-start'

  return (
    <div className={`flex flex-col items-${align === 'center' ? 'center' : 'start'} gap-3 ${className}`}>
      {beads && (
        <BeadDots count={6} size="sm" className="mb-1" />
      )}

      <Tag
        className={`font-serif text-3xl md:text-4xl font-bold leading-tight relative inline-block ${alignClass}`}
      >
        {children}

        {/* SVG brushstroke underline */}
        <svg
          className="absolute left-0 -bottom-2 w-full"
          viewBox="0 0 300 10"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ height: 8 }}
        >
          <path
            d="M0 5 Q75 1 150 5 Q225 9 300 5"
            stroke={strokeColor}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </Tag>
    </div>
  )
}
