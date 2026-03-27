/**
 * Client-side WhatsApp deep link builder (mirrors server util).
 */
export function buildOrderWhatsAppLink({ phone, orderId, items, total, vendorName }) {
  const shortId  = orderId?.slice(-8).toUpperCase() || 'N/A'
  const itemList = items.map(i => `• ${i.name} x${i.quantity} — Rs. ${(i.unitPrice / 100).toLocaleString()}`).join('\n')
  const message  = [
    `🧶 *StitchBazaar Order Confirmed!*`,
    `Order ID: #${shortId}`,
    vendorName ? `Shop: ${vendorName}` : '',
    ``, itemList, ``,
    `*Total: Rs. ${(total / 100).toLocaleString()}*`,
    `Payment: Cash on Delivery`,
    ``, `Thank you for shopping at StitchBazaar! 🎨`,
  ].filter(Boolean).join('\n')
  const cleaned = (phone || '').replace(/\D/g, '').replace(/^0/, '92')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}
