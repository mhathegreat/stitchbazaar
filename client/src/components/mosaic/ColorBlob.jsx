/**
 * ColorBlob
 * Abstract soft color blob shape used as section background decoration.
 * Absolutely positioned — place inside a relative container.
 */

/**
 * @param {object} props
 * @param {string} props.color       fill color
 * @param {string} [props.className] positioning classes (e.g. "top-0 right-0 w-64 h-64")
 * @param {number} [props.opacity=0.12]
 */
export default function ColorBlob({ color, className = '', opacity = 0.12 }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <path
        fill={color}
        opacity={opacity}
        d="M47.1,-57.3C60.1,-46.3,69.3,-29.8,71.8,-12.2C74.2,5.4,69.8,24.1,59.5,38.4C49.2,52.7,33,62.6,15.3,67.1C-2.5,71.6,-21.7,70.8,-37.3,62.7C-52.9,54.6,-65,39.3,-70.2,22C-75.4,4.7,-73.7,-14.5,-65.2,-30C-56.8,-45.5,-41.5,-57.2,-25.7,-66.5C-10,-75.8,6.1,-82.6,21.5,-78.8C36.9,-75,60.9,-60.6,47.1,-57.3Z"
        transform="translate(100 100)"
      />
    </svg>
  )
}
