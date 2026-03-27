/**
 * WhatsApp utility — Phase 1: wa.me deep link generation
 * Phase 2: WhatsApp Business API
 *
 * Generates pre-filled WhatsApp message links for order notifications.
 */

/**
 * Build a wa.me deep link with pre-filled order summary.
 * @param {{ phone: string, orderId: string, items: Array, total: number, vendorName?: string }} opts
 * @returns {string}  Full wa.me URL
 */
export function buildOrderWhatsAppLink({ phone, orderId, items, total, vendorName }) {
  const shortId = orderId.slice(-8).toUpperCase()
  const itemList = items
    .map(i => `• ${i.name} x${i.quantity} — Rs. ${(i.unitPrice / 100).toLocaleString()}`)
    .join('\n')

  const message = [
    `🧶 *StitchBazaar Order Confirmed!*`,
    `Order ID: #${shortId}`,
    vendorName ? `Shop: ${vendorName}` : '',
    ``,
    itemList,
    ``,
    `*Total: Rs. ${(total / 100).toLocaleString()}*`,
    `Payment: Cash on Delivery`,
    ``,
    `Thank you for shopping at StitchBazaar! 🎨`,
  ].filter(Boolean).join('\n')

  const cleaned = phone.replace(/\D/g, '').replace(/^0/, '92')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

/**
 * Build a vendor notification link so a customer can alert the vendor.
 * @param {{ vendorPhone: string, orderId: string, customerName: string }} opts
 * @returns {string}
 */
export function buildVendorNotifyLink({ vendorPhone, orderId, customerName }) {
  const shortId = orderId.slice(-8).toUpperCase()
  const message = `Hi! I just placed an order #${shortId} on StitchBazaar. Customer: ${customerName}`
  const cleaned = vendorPhone.replace(/\D/g, '').replace(/^0/, '92')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}
