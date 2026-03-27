/**
 * App — root component
 * Sets up router, context providers, and all page routes.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from './context/AuthContext.jsx'
import { CartProvider  } from './context/CartContext.jsx'

import Navbar  from './components/layout/Navbar.jsx'
import Footer  from './components/layout/Footer.jsx'

// ── Public pages ─────────────────────────────────────────────────
import Home           from './pages/Home.jsx'
import Products       from './pages/Products.jsx'
import ProductDetail  from './pages/ProductDetail.jsx'
import Vendors        from './pages/Vendors.jsx'
import Categories     from './pages/Categories.jsx'

// ── Auth pages ────────────────────────────────────────────────────
import Login          from './pages/auth/Login.jsx'
import Register       from './pages/auth/Register.jsx'
import ForgotPassword from './pages/auth/ForgotPassword.jsx'
import ResetPassword  from './pages/auth/ResetPassword.jsx'

// ── Vendor pages ─────────────────────────────────────────────────
import VendorShop         from './pages/vendor/VendorShop.jsx'
import VendorRegister     from './pages/vendor/VendorRegister.jsx'
import VendorDashboard    from './pages/vendor/VendorDashboard.jsx'
import VendorProducts     from './pages/vendor/VendorProducts.jsx'
import VendorProductForm  from './pages/vendor/VendorProductForm.jsx'
import VendorOrders       from './pages/vendor/VendorOrders.jsx'
import VendorEarnings     from './pages/vendor/VendorEarnings.jsx'
import VendorSettings     from './pages/vendor/VendorSettings.jsx'
import VendorImport      from './pages/vendor/VendorImport.jsx'

// ── Cart / Checkout ───────────────────────────────────────────────
import Cart              from './pages/Cart.jsx'
import Checkout          from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'

// ── Customer pages ────────────────────────────────────────────────
import CustomerOrders  from './pages/customer/Orders.jsx'
import CustomerProfile from './pages/customer/Profile.jsx'
import CustomerWishlist from './pages/customer/Wishlist.jsx'
import OrderDetail     from './pages/customer/OrderDetail.jsx'
import Dispute         from './pages/customer/Dispute.jsx'

// ── Admin pages ───────────────────────────────────────────────────
import AdminDashboard  from './pages/admin/AdminDashboard.jsx'
import AdminVendors    from './pages/admin/AdminVendors.jsx'
import AdminProducts   from './pages/admin/AdminProducts.jsx'
import AdminOrders     from './pages/admin/AdminOrders.jsx'
import AdminPayouts    from './pages/admin/AdminPayouts.jsx'
import AdminDisputes   from './pages/admin/AdminDisputes.jsx'
import AdminCategories from './pages/admin/AdminCategories.jsx'
import AdminCoupons    from './pages/admin/AdminCoupons.jsx'
import AdminShipping   from './pages/admin/AdminShipping.jsx'
import AdminRefunds    from './pages/admin/AdminRefunds.jsx'
import AdminAuditLog   from './pages/admin/AdminAuditLog.jsx'

// ── 404 ───────────────────────────────────────────────────────────
function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center flex-col gap-4 pt-16"
      style={{ background: '#FFFCF5' }}>
      <span className="text-6xl">🧶</span>
      <p className="font-serif text-3xl font-bold" style={{ color: '#C88B00' }}>404</p>
      <p className="text-sm" style={{ color: '#7A6050' }}>This page got tangled up — let's go back.</p>
      <a href="/" className="px-5 py-2.5 rounded-xl text-sm font-bold"
        style={{ background: '#C88B00', color: '#1C0A00' }}>
        Go Home
      </a>
    </main>
  )
}

function AppShell() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* ── Public ── */}
        <Route path="/"                          element={<Home />} />
        <Route path="/products"                  element={<Products />} />
        <Route path="/products/:id"              element={<ProductDetail />} />
        <Route path="/vendors"                   element={<Vendors />} />
        <Route path="/vendors/:id"               element={<VendorShop />} />
        <Route path="/categories"                element={<Categories />} />

        {/* ── Auth ── */}
        <Route path="/login"                     element={<Login />} />
        <Route path="/register"                  element={<Register />} />
        <Route path="/forgot-password"           element={<ForgotPassword />} />
        <Route path="/reset-password"            element={<ResetPassword />} />

        {/* ── Vendor ── */}
        <Route path="/vendor/register"           element={<VendorRegister />} />
        <Route path="/vendor/dashboard"          element={<VendorDashboard />} />
        <Route path="/vendor/products"           element={<VendorProducts />} />
        <Route path="/vendor/products/new"       element={<VendorProductForm />} />
        <Route path="/vendor/products/:id/edit"  element={<VendorProductForm />} />
        <Route path="/vendor/orders"             element={<VendorOrders />} />
        <Route path="/vendor/earnings"           element={<VendorEarnings />} />
        <Route path="/vendor/settings"           element={<VendorSettings />} />
        <Route path="/vendor/import"             element={<VendorImport />} />

        {/* ── Cart / Checkout ── */}
        <Route path="/cart"                      element={<Cart />} />
        <Route path="/checkout"                  element={<Checkout />} />
        <Route path="/order-confirmation/:id"    element={<OrderConfirmation />} />

        {/* ── Customer ── */}
        <Route path="/customer/orders"           element={<CustomerOrders />} />
        <Route path="/customer/orders/:id"       element={<OrderDetail />} />
        <Route path="/customer/orders/:id/dispute" element={<Dispute />} />
        <Route path="/customer/wishlist"         element={<CustomerWishlist />} />
        <Route path="/customer/profile"          element={<CustomerProfile />} />

        {/* ── Admin ── */}
        <Route path="/admin"                     element={<AdminDashboard />} />
        <Route path="/admin/vendors"             element={<AdminVendors />} />
        <Route path="/admin/products"            element={<AdminProducts />} />
        <Route path="/admin/orders"              element={<AdminOrders />} />
        <Route path="/admin/payouts"             element={<AdminPayouts />} />
        <Route path="/admin/disputes"            element={<AdminDisputes />} />
        <Route path="/admin/categories"          element={<AdminCategories />} />
        <Route path="/admin/coupons"             element={<AdminCoupons />} />
        <Route path="/admin/shipping"            element={<AdminShipping />} />
        <Route path="/admin/refunds"             element={<AdminRefunds />} />
        <Route path="/admin/audit"               element={<AdminAuditLog />} />

        {/* ── 404 ── */}
        <Route path="*"                          element={<NotFound />} />
      </Routes>
      <Footer />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background:  '#1C0A00',
            color:       '#FFFCF5',
            border:      '1px solid #C88B00',
            fontFamily:  'Inter, sans-serif',
            fontSize:    13,
          },
          success: { iconTheme: { primary: '#C88B00', secondary: '#1C0A00' } },
          error:   { iconTheme: { primary: '#D85A30', secondary: '#FFFCF5' } },
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
