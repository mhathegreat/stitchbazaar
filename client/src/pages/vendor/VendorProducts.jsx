/**
 * Vendor Products management — /vendor/products
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Package, Store, ShoppingBag, DollarSign, AlertTriangle, LayoutDashboard, Upload } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { formatPrice, cardAccent } from '../../styles/theme.js'
import { productsApi } from '../../api/products.js'
import toast from 'react-hot-toast'

const VENDOR_NAV = [
  { to: '/vendor/dashboard', label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
  { to: '/vendor/products',  label: 'Products',   icon: <Package size={16} />    },
  { to: '/vendor/orders',    label: 'Orders',     icon: <ShoppingBag size={16} />},
  { to: '/vendor/earnings',  label: 'Earnings',   icon: <DollarSign size={16} /> },
  { to: '/vendor/settings',  label: 'Settings',   icon: <Store size={16} />      },
]

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Bamboo Knitting Needles Set', sku: 'BKN-001', category: 'Needles', price: 1890, stock: 48, status: 'active',  image: null, sales: 89 },
  { id: 'p2', name: 'Merino Wool Yarn 100g',       sku: 'MWY-050', category: 'Yarn',    price: 1200, stock:  5, status: 'active',  image: null, sales: 67 },
  { id: 'p3', name: 'Crochet Hook Set 10pcs',      sku: 'CHS-010', category: 'Hooks',   price: 6500, stock:  0, status: 'draft',   image: null, sales: 43 },
  { id: 'p4', name: 'Linen Thread White 200m',     sku: 'LTW-200', category: 'Thread',  price:  850, stock: 30, status: 'active',  image: null, sales: 21 },
  { id: 'p5', name: 'Embroidery Hoop 10 inch',     sku: 'EHO-010', category: 'Hoops',   price:  450, stock: 12, status: 'inactive',image: null, sales: 15 },
]

const STATUS_COLORS = {
  active:   { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  label: 'Active'   },
  inactive: { color: '#7A6050', bg: 'rgba(122,96,80,0.1)',  label: 'Inactive' },
  draft:    { color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  label: 'Draft'    },
}

export default function VendorProducts() {
  const [products,     setProducts]     = useState(MOCK_PRODUCTS)
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    productsApi.mine()
      .then(d => setProducts(d.data || []))
      .catch(() => { /* keep mock data as fallback */ })
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  async function toggleStatus(id) {
    const p = products.find(x => x.id === id)
    const newStatus = p.status === 'active' ? 'inactive' : 'active'
    try {
      await productsApi.update(id, { status: newStatus })
      setProducts(ps => ps.map(x => x.id === id ? { ...x, status: newStatus } : x))
      toast.success('Product status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function deleteProduct(id) {
    try {
      await productsApi.delete(id)
      setProducts(ps => ps.filter(p => p.id !== id))
      toast.error('Product deleted')
    } catch {
      toast.error('Failed to delete product')
    }
  }

  return (
    <PageWrapper title="My Products">
      <div className="flex min-h-screen" style={{ background: '#FFFCF5' }}>

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 py-6 px-3 gap-1"
          style={{ background: '#1C0A00', minHeight: '100vh' }}>
          <div className="px-3 mb-5">
            <p className="font-serif font-bold text-base" style={{ color: '#C88B00' }}>Vendor Panel</p>
            <p className="text-[10px] tracking-widest mt-0.5" style={{ color: '#7A6050' }}>STITCHBAZAAR</p>
          </div>
          {VENDOR_NAV.map(n => (
            <Link key={n.to} to={n.to}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
              style={{ color: n.to === '/vendor/products' ? '#C88B00' : '#C8B89A',
                       background: n.to === '/vendor/products' ? 'rgba(200,139,0,0.15)' : 'transparent' }}>
              <span style={{ color: '#C88B00' }}>{n.icon}</span> {n.label}
            </Link>
          ))}
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
              My <span style={{ color: '#C88B00' }}>Products</span>
            </h1>
            <div className="flex gap-2">
              <Link to="/vendor/import"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(200,139,0,0.15)', color: '#C88B00', border: '1.5px solid rgba(200,139,0,0.3)' }}>
                <Upload size={16} /> Import CSV
              </Link>
              <Link to="/vendor/products/new"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: '#C88B00', color: '#1C0A00' }}>
                <Plus size={16} /> Add Product
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-48"
              style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
              <Search size={15} style={{ color: '#C88B00' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products…"
                className="bg-transparent text-sm outline-none flex-1"
                style={{ color: '#1C0A00' }} />
            </div>
            <div className="flex gap-2">
              {['all','active','inactive','draft'].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
                  style={filterStatus === s
                    ? { background: '#C88B00', color: '#1C0A00' }
                    : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Products', value: products.length, color: '#C88B00' },
              { label: 'Active',         value: products.filter(p => p.status === 'active').length, color: '#0F6E56' },
              { label: 'Low Stock (≤5)', value: products.filter(p => p.stock <= 5).length,          color: '#D85A30' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <p className="font-bold text-xl font-serif" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: '#7A6050' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#C88B00', color: '#1C0A00' }}>
                    <th className="text-left px-4 py-3 font-serif font-bold">Product</th>
                    <th className="text-left px-4 py-3 font-serif font-bold hidden sm:table-cell">Category</th>
                    <th className="text-right px-4 py-3 font-serif font-bold">Price</th>
                    <th className="text-right px-4 py-3 font-serif font-bold hidden md:table-cell">Stock</th>
                    <th className="text-center px-4 py-3 font-serif font-bold hidden lg:table-cell">Sales</th>
                    <th className="text-center px-4 py-3 font-serif font-bold">Status</th>
                    <th className="text-right px-4 py-3 font-serif font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody style={{ background: '#FFF8E7' }}>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12" style={{ color: '#7A6050' }}>
                        <Package size={32} className="mx-auto mb-2 opacity-40" />
                        No products found
                      </td>
                    </tr>
                  ) : filtered.map((p, i) => {
                    const sc = STATUS_COLORS[p.status]
                    return (
                      <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid rgba(200,139,0,0.1)' : undefined }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg"
                              style={{ background: cardAccent(i) + '30' }}>
                              🧶
                            </div>
                            <div>
                              <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{p.name}</p>
                              <p className="text-xs" style={{ color: '#7A6050' }}>{p.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(200,139,0,0.1)', color: '#A07000' }}>
                            {p.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: '#C88B00' }}>
                          {formatPrice(p.price)}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className={p.stock === 0 ? 'font-bold' : p.stock <= 5 ? 'font-semibold' : ''}
                            style={{ color: p.stock === 0 ? '#D85A30' : p.stock <= 5 ? '#C88B00' : '#1C0A00' }}>
                            {p.stock === 0 ? 'Out of stock' : p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell" style={{ color: '#7A6050' }}>
                          {p.sales}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Link to={`/vendor/products/${p.id}/edit`}
                              className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                              style={{ color: '#C88B00' }} title="Edit">
                              <Edit2 size={14} />
                            </Link>
                            <button onClick={() => toggleStatus(p.id)}
                              className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                              style={{ color: p.status === 'active' ? '#7A6050' : '#0F6E56' }}
                              title={p.status === 'active' ? 'Deactivate' : 'Activate'}>
                              {p.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => deleteProduct(p.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                              style={{ color: '#D85A30' }} title="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low stock alert */}
          {products.some(p => p.stock > 0 && p.stock <= 5) && (
            <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(200,139,0,0.1)', border: '1px solid rgba(200,139,0,0.3)' }}>
              <AlertTriangle size={15} style={{ color: '#C88B00' }} />
              <p className="text-sm" style={{ color: '#A07000' }}>
                {products.filter(p => p.stock > 0 && p.stock <= 5).length} product(s) are running low on stock.
              </p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
