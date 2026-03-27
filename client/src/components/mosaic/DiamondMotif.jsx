/**
 * DiamondMotif
 * Small Pakistani textile-inspired diamond/rhombus corner decoration.
 * Absolutely positioned — place inside a relative container.
 */

/**
 * @param {object} props
 * @param {string} [props.color='#C88B00']
 * @param {string} [props.className]  positioning (e.g. "top-4 right-4")
 * @param {number} [props.size=32]
 */
export default function DiamondMotif({ color = '#C88B00', className = '', size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Outer diamond */}
      <polygon
        points="16,2 30,16 16,30 2,16"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
      {/* Inner diamond */}
      <polygon
        points="16,8 24,16 16,24 8,16"
        fill={color}
        opacity="0.35"
      />
      {/* Center dot */}
      <circle cx="16" cy="16" r="2.5" fill={color} />
    </svg>
  )
}
