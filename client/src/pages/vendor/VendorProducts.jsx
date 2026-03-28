/**
 * Vendor Products management — /vendor/products
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit2, Trash2, Eye, EyeOff, Search, Package, AlertTriangle, Upload } from 'lucide-react'
import VendorLayout from './VendorLayout.jsx'
import { formatPrice, cardAccent } from '../../styles/theme.js'
import { productsApi } from '../../api/products.js'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  active:    { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',   label: 'Active'    },
  inactive:  { color: '#7A6050', bg: 'rgba(122,96,80,0.1)',   label: 'Inactive'  },
  suspended: { color: '#D85A30', bg: 'rgba(216,90,48,0.1)',   label: 'Suspended' },
  draft:     { color: '#C88B00', bg: 'rgba(200,139,0,0.1)',   label: 'Draft'     },
}
const DEFAULT_SC = { color: '#7A6050', bg: 'rgba(122,96,80,0.1)', label: 'Unknown' }

export default function VendorProducts() {
  const [products,     setProducts]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    productsApi.mine()
      .then(d => setProducts(d.data || []))
      .catch(() => { toast.error('Failed to load products'); setProducts([]) })
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
    <VendorLayout active="/vendor/products" title="My Products">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

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
                    const sc = STATUS_COLORS[p.status] || DEFAULT_SC
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
                            {p.category?.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold" style={{ color: '#C88B00' }}>
                          {formatPrice(p.basePrice)}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <span className={p.stock === 0 ? 'font-bold' : p.stock <= 5 ? 'font-semibold' : ''}
                            style={{ color: p.stock === 0 ? '#D85A30' : p.stock <= 5 ? '#C88B00' : '#1C0A00' }}>
                            {p.stock === 0 ? 'Out of stock' : p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell" style={{ color: '#7A6050' }}>
                          {p._count?.orderItems ?? 0}
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
    </VendorLayout>
  )
}
