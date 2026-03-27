/**
 * MosaicBackground
 * Renders the stained-glass polygon mosaic used in the hero and banner areas.
 * Each polygon block has a thick dark border (#1C0A00) for the bazaar aesthetic.
 */

const polygons = [
  // [points, fill-color]
  { points: '0,0 220,0 180,160 0,200',           fill: '#D85A30' }, // coral TL
  { points: '220,0 480,0 520,140 180,160',        fill: '#C88B00' }, // amber top-mid
  { points: '480,0 760,0 760,120 520,140',        fill: '#0F6E56' }, // emerald top-right
  { points: '760,0 1000,0 1000,180 760,120',      fill: '#6A4C93' }, // purple far-right
  { points: '0,200 180,160 200,340 0,380',        fill: '#457B9D' }, // steel-blue left-mid
  { points: '180,160 520,140 460,320 200,340',    fill: '#1C0A00' }, // dark center
  { points: '520,140 760,120 800,300 460,320',    fill: '#C88B00' }, // amber mid-right
  { points: '760,120 1000,180 1000,340 800,300',  fill: '#D85A30' }, // coral right
  { points: '0,380 200,340 220,500 0,500',        fill: '#0F6E56' }, // emerald lower-left
  { points: '200,340 460,320 440,500 220,500',    fill: '#6A4C93' }, // purple lower-mid
  { points: '460,320 800,300 820,500 440,500',    fill: '#457B9D' }, // steel lower-right
  { points: '800,300 1000,340 1000,500 820,500',  fill: '#2DC653' }, // bright-green corner
]

/**
 * @param {object} props
 * @param {string} [props.className]   extra classes
 * @param {number} [props.height=500]  viewBox height (px)
 */
export default function MosaicBackground({ className = '', height = 500 }) {
  return (
    <svg
      viewBox={`0 0 1000 ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 w-full h-full ${className}`}
      aria-hidden="true"
    >
      {polygons.map((p, i) => (
        <polygon
          key={i}
          points={p.points}
          fill={p.fill}
          stroke="#1C0A00"
          strokeWidth="3"
          opacity="0.92"
        />
      ))}
    </svg>
  )
}
