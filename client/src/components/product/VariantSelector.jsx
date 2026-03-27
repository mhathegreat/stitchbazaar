/**
 * VariantSelector
 * Renders grouped variant options (e.g. Color, Size) as clickable pill buttons.
 * Groups variants by their label prefix (e.g. "Color: Red" → "Color" group).
 */

import { formatPrice } from '../../styles/theme.js'

/**
 * @param {object}    props
 * @param {Array}     props.variants       [ { id, label, priceModifier, stock } ]
 * @param {string|null} props.selected     currently selected variant id
 * @param {function}  props.onSelect       (variantId) => void
 * @param {number}    props.basePrice      product base price in paisa
 */
export default function VariantSelector({ variants = [], selected, onSelect, basePrice }) {
  if (!variants.length) return null

  // Group by prefix: "Color: Red" → group "Color"
  const groups = variants.reduce((acc, v) => {
    const [group, ...rest] = v.label.split(':')
    const key = rest.length ? group.trim() : 'Options'
    const val = rest.length ? rest.join(':').trim() : v.label
    if (!acc[key]) acc[key] = []
    acc[key].push({ ...v, displayLabel: val })
    return acc
  }, {})

  const selectedVariant = variants.find(v => v.id === selected)
  const finalPrice = selectedVariant
    ? basePrice + selectedVariant.priceModifier
    : basePrice

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(groups).map(([group, opts]) => (
        <div key={group}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#1C0A00' }}>
            {group}
            {selectedVariant && (
              <span className="font-normal ml-1" style={{ color: '#7A6050' }}>
                — {selectedVariant.label.split(':').pop()?.trim()}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {opts.map(v => {
              const isSel     = v.id === selected
              const outOfStock = v.stock < 1
              return (
                <button
                  key={v.id}
                  onClick={() => !outOfStock && onSelect(v.id)}
                  disabled={outOfStock}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all relative"
                  style={{
                    borderColor:     isSel ? '#C88B00' : 'rgba(200,139,0,0.25)',
                    background:      isSel ? '#C88B00' : '#FFFCF5',
                    color:           isSel ? '#1C0A00' : '#5A4030',
                    opacity:         outOfStock ? 0.45 : 1,
                    textDecoration:  outOfStock ? 'line-through' : 'none',
                  }}
                  title={outOfStock ? 'Out of stock' : undefined}
                >
                  {v.displayLabel}
                  {v.priceModifier !== 0 && (
                    <span className="ml-1 text-[10px]" style={{ color: isSel ? '#1C0A00' : '#A07000' }}>
                      {v.priceModifier > 0 ? '+' : ''}{formatPrice(Math.abs(v.priceModifier))}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <p className="text-xs" style={{ color: '#7A6050' }}>
          {selectedVariant.stock > 0
            ? <span style={{ color: '#0F6E56' }}>✓ {selectedVariant.stock} in stock</span>
            : <span style={{ color: '#D85A30' }}>✗ Out of stock</span>
          }
          {selectedVariant.priceModifier !== 0 && (
            <> · Price: <strong style={{ color: '#C88B00' }}>{formatPrice(finalPrice)}</strong></>
          )}
        </p>
      )}
    </div>
  )
}
