# StitchBazaar API Documentation

**Base URL:** `https://api.stitchbazaar.pk/api/v1`
**Auth:** Bearer token in `Authorization: Bearer <accessToken>` header
**Money:** All prices are integers in **paisa** (100 paisa = Rs. 1)
**Response format:**
```json
{ "success": true, "data": {}, "message": "optional", "meta": { "total": 0, "page": 1 } }
```

---

## Authentication

### `POST /auth/register`
Create a new user account.

**Body:**
```json
{
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "password": "securepass123",
  "phone": "03001234567",
  "role": "customer"
}
```
`role` is `customer` (default) or `vendor`.

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "...", "name": "Ayesha Khan", "email": "...", "role": "customer" }
  }
}
```
Refresh token set as `sb_refresh` HttpOnly cookie.

---

### `POST /auth/login`
```json
{ "email": "ayesha@example.com", "password": "securepass123" }
```
**Response `200`:** Same as register.

---

### `POST /auth/logout`
Clears refresh cookie. No body required. Auth optional.

---

### `POST /auth/refresh`
Uses `sb_refresh` cookie. Returns new `accessToken`. Rotates refresh token.

---

### `POST /auth/forgot-password`
```json
{ "email": "ayesha@example.com" }
```
Sends password reset email. Always returns success (prevents enumeration).

---

### `POST /auth/reset-password`
```json
{ "token": "...", "password": "newpass123" }
```

---

## Products

### `GET /products`
Public. Supports query params:

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search name/description/tags |
| `categoryId` | string | Filter by category ID |
| `vendorId` | string | Filter by vendor |
| `minPrice` | number | Min price (paisa) |
| `maxPrice` | number | Max price (paisa) |
| `inStock` | boolean | `true` = in-stock only |
| `sort` | string | `newest` / `price_asc` / `price_desc` / `popular` |
| `page` | number | Default 1 |
| `limit` | number | Default 24 |

---

### `GET /products/:id`
Public. Full product detail including variants and reviews.

---

### `POST /products`
**Auth: vendor**. Create a product.

```json
{
  "categoryId": "cuid",
  "name": "Bamboo Needles Set",
  "description": "Premium bamboo knitting needles",
  "basePrice": 189000,
  "stock": 50,
  "images": ["https://res.cloudinary.com/..."],
  "tags": ["bamboo", "knitting"],
  "status": "active"
}
```

---

### `PUT /products/:id`
**Auth: vendor/admin**. Partial update. Vendor can only edit their own products.

---

### `DELETE /products/:id`
**Auth: vendor/admin**. Soft delete (sets status to `inactive`).

---

### `GET /products/vendor/mine`
**Auth: vendor**. List vendor's own products (all statuses).

Query: `?status=active&page=1&limit=50`

---

## Vendors

### `GET /vendors`
Public. List active vendors.

Query: `?city=Lahore&q=craft&page=1&limit=20`

---

### `GET /vendors/:id`
Public. Vendor profile + first 12 active products.

---

### `POST /vendors/register`
**Auth required**. Register the authenticated user as a vendor.

```json
{
  "shopName": "CraftHub Lahore",
  "shopDescription": "Premium supplies...",
  "city": "Lahore",
  "colorTheme": "#C88B00",
  "bankAccountName": "Ali Hassan",
  "bankAccountNumber": "0123456789",
  "bankName": "HBL"
}
```
Creates vendor with `pending` status. Admin must approve.

---

### `PUT /vendors/profile`
**Auth: vendor**. Update shop info (partial update).

---

### `GET /vendors/dashboard`
**Auth: vendor**. Returns:
- `vendor` — shop details
- `stats` — totalProducts, totalOrders, grossRevenue, netRevenue, paidOut, pendingPayout
- `recentOrders` — last 10 order items

---

### `GET /vendors/earnings`
**Auth: vendor**. Earnings breakdown + payout history.

---

### `POST /vendors/payout-request`
**Auth: vendor**. Requests payout of available balance.

---

## Orders

### `POST /orders`
Auth optional (supports guest checkout).

**Guest checkout** (unauthenticated) requires `guestName` and `guestPhone`.

```json
{
  "items": [
    { "productId": "cuid", "variantId": "cuid", "quantity": 2 }
  ],
  "deliveryAddress": "House 42, Gulberg III",
  "city": "Lahore",
  "paymentMethod": "cash_on_delivery",
  "notes": "Please pack carefully",
  "guestName": "Ayesha Khan",
  "guestPhone": "03001234567",
  "guestEmail": "ayesha@example.com"
}
```
`paymentMethod`: `cash_on_delivery` (default) or `bank_transfer`

---

### `GET /orders`
**Auth required**. Customer sees own orders; admin sees all.

Query: `?status=pending&page=1&limit=20`

---

### `GET /orders/:id`
**Auth required**. Full order detail. Customer can only view their own.

---

### `PUT /orders/:id/status`
**Auth: vendor/admin**.

- Vendor: updates `vendorStatus` on their order items.
  Valid: `confirmed` → `packed` → `shipped` → `delivered` / `cancelled`
- Admin: updates overall order `status`.

```json
{ "status": "shipped" }
```

---

### `POST /orders/:id/dispute`
**Auth required**. Customer raises a dispute (only on `delivered` orders).

```json
{ "reason": "Item received was damaged on arrival..." }
```

---

## Reviews

### `GET /reviews/product/:productId`
Public. Returns reviews + `meta.avgRating`.

---

### `POST /reviews`
**Auth required**. Customer must have purchased the product.

```json
{ "productId": "cuid", "rating": 5, "comment": "Excellent quality!" }
```
One review per user per product (upserts).

---

## Wishlist

### `GET /wishlist`
**Auth required**. Customer's wishlist with product details.

---

### `POST /wishlist`
**Auth required**.
```json
{ "productId": "cuid" }
```

---

### `DELETE /wishlist/:productId`
**Auth required**. Remove from wishlist.

---

## Categories

### `GET /categories`
Public. All categories with product count.

---

### `GET /categories/:slug`
Public. Category detail + first 24 active products.

---

## Admin

All `/admin/*` routes require **Auth: admin**.

### `GET /admin/dashboard`
Platform overview: stats, pending vendors, pending payouts, open disputes, recent orders.

---

### `GET /admin/vendors`
All vendors. Query: `?status=pending&page=1&limit=20`

---

### `PUT /admin/vendors/:id/approve`
Approve a pending vendor (sets status to `active`).

---

### `PUT /admin/vendors/:id/reject`
Reject/suspend a vendor.

---

### `GET /admin/payouts`
All payout requests. Query: `?status=pending`

---

### `PUT /admin/payouts/:id/process`
```json
{ "status": "paid", "adminNote": "Transferred via HBL" }
```
`status`: `paid` or `rejected`

---

### `GET /admin/disputes`
All disputes. Query: `?status=open`

---

### `PUT /admin/disputes/:id/resolve`
```json
{ "status": "resolved", "resolution": "Refund issued to customer" }
```
`status`: `investigating` | `resolved` | `closed`

---

### `GET /admin/orders`
All orders. Query: `?status=pending`

---

### `GET /admin/products`
All products. Query: `?status=active`

---

### `PUT /admin/products/:id/moderate`
```json
{ "status": "suspended" }
```
`status`: `active` or `suspended`

---

### `GET /admin/categories`
All categories (admin view with product counts).

---

### `POST /admin/categories`
```json
{
  "name": "Knitting Needles",
  "nameUrdu": "سلائیاں",
  "slug": "knitting-needles",
  "icon": "🧶",
  "color": "#C88B00"
}
```

---

### `PUT /admin/categories/:id`
Partial update of a category.

---

### `DELETE /admin/categories/:id`
Delete a category.

---

## Upload

### `POST /upload/image`
**Auth: vendor/admin**. Upload a product or shop image to Cloudinary.

**Multipart form:** `file` field (image/jpeg, image/png, max 5MB)

```json
{ "success": true, "data": { "url": "https://res.cloudinary.com/...", "publicId": "..." } }
```

---

## Sitemap

### `GET /sitemap.xml`
Returns dynamic XML sitemap for all public products, vendors, and categories.

---

## Error Responses

| Status | Meaning |
|--------|---------|
| `400` | Bad request / validation error |
| `401` | Missing or invalid auth token |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (duplicate) |
| `422` | Validation failed (Zod) — includes `errors` object |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Rate Limits

| Endpoint group | Limit |
|----------------|-------|
| `/auth/*` | 10 req / 15 min per IP |
| `POST /orders` | 5 req / 15 min per IP |
| `POST /upload/*` | 20 req / hour per user |
| All other routes | 100 req / min per IP |

---

## Notes

- **Paisa rule:** All prices in the DB and API are integers in paisa. Divide by 100 to get PKR.
- **Guest checkout:** Omit `Authorization` header, include `guestName` + `guestPhone`.
- **WhatsApp:** Use `wa.me/{phone}?text={encodedMessage}` on the client. No server-side WhatsApp API needed.
- **Payments:** Phase 1 = COD + bank transfer (manual). Phase 2 = JazzCash / Easypaisa webhook integration.
- **Language:** All models have optional `nameUrdu`/`descriptionUrdu` fields. Set `Accept-Language: ur` in future for auto-switching.
