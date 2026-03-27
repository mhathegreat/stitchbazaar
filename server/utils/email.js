/**
 * Email utility — Nodemailer with Gmail SMTP
 * Sends transactional emails: order confirmation, vendor approval, password reset.
 */

import nodemailer from 'nodemailer'
import { logger } from './logger.js'

/** @returns {import('nodemailer').Transporter} */
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,   // App password (not account password)
    },
  })
}

/**
 * Send a generic email.
 * @param {{ to: string, subject: string, html: string }} options
 */
export async function sendEmail({ to, subject, html }) {
  try {
    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"StitchBazaar" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    })
    logger.info(`Email sent to ${to}: ${subject}`)
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`)
    // Don't throw — email failure should not break the main flow
  }
}

/**
 * Order confirmation email.
 * @param {{ to: string, name: string, orderId: string, total: number, items: Array }} data
 */
export async function sendOrderConfirmation({ to, name, orderId, total, items }) {
  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rs. ${(i.unitPrice / 100).toLocaleString()}</td>
    </tr>`
  ).join('')

  await sendEmail({
    to,
    subject: `Order Confirmed — #${orderId.slice(-8).toUpperCase()} | StitchBazaar`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FFFCF5;padding:32px;border-radius:12px">
        <h1 style="font-family:Georgia,serif;color:#C88B00;margin-bottom:4px">StitchBazaar</h1>
        <p style="color:#7A6050;font-size:11px;letter-spacing:3px;margin-top:0">CRAFTS · KNITTING · HABERDASHERY</p>
        <hr style="border-color:#C88B0030;margin:20px 0"/>
        <h2 style="color:#1C0A00">Order Confirmed!</h2>
        <p>Hi <strong>${name}</strong>, your order has been placed successfully.</p>
        <p style="background:#FFF0C0;padding:12px;border-radius:8px;font-weight:bold">
          Order ID: #${orderId.slice(-8).toUpperCase()}
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#1C0A00;color:#FFFCF5">
              <th style="padding:10px;text-align:left">Item</th>
              <th style="padding:10px">Qty</th>
              <th style="padding:10px;text-align:right">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="text-align:right;font-size:18px;font-weight:bold;color:#C88B00">
          Total: Rs. ${(total / 100).toLocaleString()}
        </p>
        <p style="color:#5A4030;font-size:13px">Payment method: Cash on Delivery</p>
        <hr style="border-color:#C88B0030;margin:20px 0"/>
        <p style="color:#7A6050;font-size:12px">Questions? WhatsApp us or reply to this email.</p>
      </div>
    `,
  })
}

/**
 * Vendor approval email.
 * @param {{ to: string, shopName: string, approved: boolean, note?: string }} data
 */
export async function sendVendorDecision({ to, shopName, approved, note }) {
  await sendEmail({
    to,
    subject: `Your Shop Application — ${approved ? 'Approved!' : 'Needs Attention'} | StitchBazaar`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FFFCF5;padding:32px;border-radius:12px">
        <h1 style="font-family:Georgia,serif;color:#C88B00">StitchBazaar</h1>
        <h2 style="color:${approved ? '#0F6E56' : '#D85A30'}">
          ${approved ? '🎉 Your shop is approved!' : '⚠️ Application update'}
        </h2>
        <p>Hi <strong>${shopName}</strong>,</p>
        <p>${approved
          ? 'Congratulations! Your shop has been approved. You can now log in and start listing your products.'
          : 'Your vendor application requires some attention. Please review the note below.'
        }</p>
        ${note ? `<p style="background:#FFF0C0;padding:12px;border-radius:8px">${note}</p>` : ''}
        <a href="${process.env.CLIENT_URL}/vendor/dashboard"
           style="display:inline-block;margin-top:16px;background:#C88B00;color:#1C0A00;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">
          Go to Dashboard
        </a>
      </div>
    `,
  })
}

/**
 * Order status update email (sent to customer when vendor advances status).
 * @param {{ to: string, name: string, orderId: string, status: string }} data
 */
export async function sendOrderStatusUpdate({ to, name, orderId, status }) {
  const statusLabels = {
    confirmed:  { label: 'Confirmed',  emoji: '✅', color: '#457B9D', msg: 'Your order has been confirmed by the vendor and is being prepared.' },
    packed:     { label: 'Packed',     emoji: '📦', color: '#6A4C93', msg: 'Your order has been packed and is ready for dispatch.' },
    shipped:    { label: 'Shipped',    emoji: '🚚', color: '#2DC653', msg: 'Your order is on the way! Expect delivery within 2-4 business days.' },
    delivered:  { label: 'Delivered',  emoji: '🎉', color: '#0F6E56', msg: 'Your order has been delivered. Enjoy your crafts!' },
    cancelled:  { label: 'Cancelled',  emoji: '❌', color: '#D85A30', msg: 'Your order has been cancelled. Contact us if you have questions.' },
  }
  const s = statusLabels[status]
  if (!s) return

  await sendEmail({
    to,
    subject: `Order ${s.label} — #${orderId.slice(-8).toUpperCase()} | StitchBazaar`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FFFCF5;padding:32px;border-radius:12px">
        <h1 style="font-family:Georgia,serif;color:#C88B00;margin-bottom:4px">StitchBazaar</h1>
        <p style="color:#7A6050;font-size:11px;letter-spacing:3px;margin-top:0">CRAFTS · KNITTING · HABERDASHERY</p>
        <hr style="border-color:#C88B0030;margin:20px 0"/>
        <h2 style="color:${s.color}">${s.emoji} Order ${s.label}</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>${s.msg}</p>
        <p style="background:#FFF0C0;padding:12px;border-radius:8px;font-weight:bold">
          Order ID: #${orderId.slice(-8).toUpperCase()}
        </p>
        <a href="${process.env.CLIENT_URL}/customer/orders/${orderId}"
           style="display:inline-block;margin-top:16px;background:#C88B00;color:#1C0A00;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">
          Track Your Order
        </a>
        <hr style="border-color:#C88B0030;margin:20px 0"/>
        <p style="color:#7A6050;font-size:12px">Questions? Reply to this email or WhatsApp us.</p>
      </div>
    `,
  })
}

/**
 * Payout notification email (sent to vendor when admin processes payout).
 * @param {{ to: string, shopName: string, amount: number, status: 'paid' | 'rejected', adminNote?: string }} data
 */
export async function sendPayoutNotification({ to, shopName, amount, status, adminNote }) {
  const paid = status === 'paid'
  await sendEmail({
    to,
    subject: `Payout ${paid ? 'Processed' : 'Rejected'} — Rs. ${(amount / 100).toLocaleString()} | StitchBazaar`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FFFCF5;padding:32px;border-radius:12px">
        <h1 style="font-family:Georgia,serif;color:#C88B00">StitchBazaar</h1>
        <h2 style="color:${paid ? '#0F6E56' : '#D85A30'}">${paid ? '💰 Payout Processed!' : '⚠️ Payout Rejected'}</h2>
        <p>Hi <strong>${shopName}</strong>,</p>
        <p>${paid
          ? `Your payout of <strong>Rs. ${(amount / 100).toLocaleString()}</strong> has been transferred to your bank account.`
          : `Your payout request of <strong>Rs. ${(amount / 100).toLocaleString()}</strong> was rejected.`
        }</p>
        ${adminNote ? `<p style="background:#FFF0C0;padding:12px;border-radius:8px">Note: ${adminNote}</p>` : ''}
        <a href="${process.env.CLIENT_URL}/vendor/earnings"
           style="display:inline-block;margin-top:16px;background:#C88B00;color:#1C0A00;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">
          View Earnings
        </a>
      </div>
    `,
  })
}

/**
 * Dispute resolution email (sent to customer when dispute is resolved/closed).
 * @param {{ to: string, name: string, orderId: string, status: string, resolution?: string }} data
 */
export async function sendDisputeResolution({ to, name, orderId, status, resolution }) {
  await sendEmail({
    to,
    subject: `Dispute Update — Order #${orderId.slice(-8).toUpperCase()} | StitchBazaar`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FFFCF5;padding:32px;border-radius:12px">
        <h1 style="font-family:Georgia,serif;color:#C88B00">StitchBazaar</h1>
        <h2 style="color:#0F6E56">Dispute ${status === 'resolved' ? 'Resolved' : 'Closed'}</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your dispute for order <strong>#${orderId.slice(-8).toUpperCase()}</strong> has been ${status}.</p>
        ${resolution ? `<p style="background:#FFF0C0;padding:12px;border-radius:8px"><strong>Resolution:</strong> ${resolution}</p>` : ''}
        <a href="${process.env.CLIENT_URL}/customer/orders/${orderId}"
           style="display:inline-block;margin-top:16px;background:#C88B00;color:#1C0A00;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">
          View Order
        </a>
      </div>
    `,
  })
}

/**
 * Low-stock alert sent to the vendor.
 * @param {{ to: string, shopName: string, productName: string, stock: number, productId: string }} data
 */
export async function sendLowStockAlert({ to, shopName, productName, stock, productId }) {
  await sendEmail({
    to,
    subject: `⚠️ Low Stock Alert — ${productName} | StitchBazaar`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FFFCF5;padding:32px;border-radius:12px">
        <h1 style="font-family:Georgia,serif;color:#C88B00">StitchBazaar</h1>
        <h2 style="color:#D85A30">⚠️ Low Stock Alert</h2>
        <p>Hi <strong>${shopName}</strong>,</p>
        <p>Your product <strong>${productName}</strong> has only <strong>${stock} unit${stock !== 1 ? 's' : ''}</strong> remaining in stock.</p>
        <p>Restock soon to avoid missing sales!</p>
        <a href="${process.env.CLIENT_URL}/vendor/products/${productId}/edit"
           style="display:inline-block;margin-top:16px;background:#C88B00;color:#1C0A00;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">
          Update Stock
        </a>
      </div>
    `,
  })
}

/**
 * Abandoned cart recovery email.
 * @param {{ to: string, name: string, items: Array, cartUrl: string }} data
 */
export async function sendAbandonedCartEmail({ to, name, items, cartUrl }) {
  const itemRows = items.slice(0, 5).map(i =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">Rs. ${((i.price || 0) / 100).toLocaleString()}</td>
    </tr>`
  ).join('')

  await sendEmail({
    to,
    subject: 'You left something behind 🧶 | StitchBazaar',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FFFCF5;padding:32px;border-radius:12px">
        <h1 style="font-family:Georgia,serif;color:#C88B00;margin-bottom:4px">StitchBazaar</h1>
        <p style="color:#7A6050;font-size:11px;letter-spacing:3px;margin-top:0">CRAFTS · KNITTING · HABERDASHERY</p>
        <hr style="border-color:#C88B0030;margin:20px 0"/>
        <h2 style="color:#1C0A00">Your cart misses you!</h2>
        <p>Hi <strong>${name}</strong>, you left some items in your cart. Come back before they sell out!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#1C0A00;color:#FFFCF5">
              <th style="padding:10px;text-align:left">Item</th>
              <th style="padding:10px">Qty</th>
              <th style="padding:10px;text-align:right">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ${items.length > 5 ? `<p style="color:#7A6050;font-size:12px">…and ${items.length - 5} more item(s)</p>` : ''}
        <a href="${cartUrl}"
           style="display:inline-block;margin-top:16px;background:#C88B00;color:#1C0A00;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">
          Complete My Purchase
        </a>
        <hr style="border-color:#C88B0030;margin:20px 0"/>
        <p style="color:#7A6050;font-size:12px">If you don't want reminders, simply ignore this email.</p>
      </div>
    `,
  })
}

/**
 * Password reset email.
 * @param {{ to: string, name: string, resetUrl: string }} data
 */
export async function sendPasswordReset({ to, name, resetUrl }) {
  await sendEmail({
    to,
    subject: 'Reset Your Password — StitchBazaar',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FFFCF5;padding:32px;border-radius:12px">
        <h1 style="font-family:Georgia,serif;color:#C88B00">StitchBazaar</h1>
        <h2 style="color:#1C0A00">Reset Your Password</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin-top:16px;background:#D85A30;color:#FFFCF5;padding:12px 24px;border-radius:8px;font-weight:bold;text-decoration:none">
          Reset Password
        </a>
        <p style="color:#7A6050;font-size:12px;margin-top:24px">
          If you didn't request this, ignore this email — your password won't change.
        </p>
      </div>
    `,
  })
}
