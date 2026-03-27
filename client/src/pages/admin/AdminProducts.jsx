/**
 * Admin — Products moderation — /admin/products
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, CheckCircle, XCircle, Search, Package } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { formatPrice } from '../../styles/theme.js'
import { adminApi } from '../../api/admin.js'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  active:    { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  label: 'Active'    },
  inactive:  { color: '#7A6050', bg: 'rgba(122,96,80,0.1)',  label: 'Inactive'  },
  suspended: { color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  label: 'Suspended' },
}

const MOCK_PRODUCTS = [
  { id: 'p1', name: 'Bamboo Knitting Needles Set', vendor: { shopName: 'CraftHub Lahore' }, category: { name: 'Needles' }, basePrice: 189000, stock: 48, status: 'active',    createdAt: '2026-01-10' },
  { id: 'p2', name: 'Merino Wool Yarn 100g',       vendor: { shopName: 'Yarn Paradise'   }, category: { name: 'Yarn'    }, basePrice: 120000, stock:  5, status: 'active',    createdAt: '2026-01-15' },
  { id: 'p3', name: 'Crochet Hook Set 10pcs',      vendor: { shopName: 'Stitch Studio'   }, category: { name: 'Hooks'   }, basePrice: 650000, stock:  0, status: 'inactive',  createdAt: '2026-02-01' },
  { id: 'p4', name: 'Fake Designer Thread',        vendor: { shopName: 'Bad Actor Shop'  }, category: { name: 'Thread'  }, basePrice:  10000, stock: 99, status: 'active',    createdAt: '2026-03-20' },
  { id: 'p5', name: 'Embroidery Hoop Set',         vendor: { shopName: 'CraftHub Lahore' }, category: { name: 'Hoops'   }, basePrice:  85000, stock: 12, status: 'suspended', createdAt: '2025-12-05' },
]

export default function AdminProducts() {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    adminApi.products(params)
      .then(d => setProducts(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
                                || p.vendor?.shopName.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  async function moderate(id, status) {
    try {
      await adminApi.moderateProduct(id, status)
      setProducts(ps => ps.map(p => p.id === id ? { ...p, status } : p))
      toast[status === 'active' ? 'success' : 'error'](`Product ${status === 'active' ? 'approved' : 'suspended'}`)
    } catch { toast.error('Action failed') }
  }

  return (
    <AdminLayout active="/admin/products" title="Products">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
          Product <span style={{ color: '#C88B00' }}>Moderation</span>
        </h1>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
          <Search size={14} style={{ color: '#C88B00' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…" className="bg-transparent text-sm outline-none"
            style={{ color: '#1C0A00', width: 160 }} />
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['all', 'active', 'inactive', 'suspended'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={filter === f
              ? { background: '#C88B00', color: '#1C0A00' }
              : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#C88B00', color: '#1C0A00' }}>
                <th className="text-left px-4 py-3 font-serif">Product</th>
                <th className="text-left px-4 py-3 font-serif hidden md:table-cell">Vendor</th>
                <th className="text-left px-4 py-3 font-serif hidden lg:table-cell">Category</th>
                <th className="text-right px-4 py-3 font-serif">Price</th>
                <th className="text-center px-4 py-3 font-serif">Status</th>
                <th className="text-right px-4 py-3 font-serif">Actions</th>
              </tr>
            </thead>
            <tbody style={{ background: '#FFF8E7' }}>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10" style={{ color: '#7A6050' }}>
                  <Package size={28} className="mx-auto mb-2 opacity-30" /> No products found
                </td></tr>
              ) : filtered.map((p, i) => {
                const sc = STATUS_COLORS[p.status]
                return (
                  <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid rgba(200,139,0,0.1)' : undefined }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: '#1C0A00' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>{p.createdAt}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: '#7A6050' }}>{p.vendor.shopName}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(200,139,0,0.1)', color: '#A07000' }}>
                        {p.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: '#C88B00' }}>{formatPrice(p.basePrice)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link to={`/products/${p.id}`}
                          className="p-1.5 rounded-lg hover:bg-amber-100" style={{ color: '#457B9D' }} title="View">
                          <Eye size={14} />
                        </Link>
                        {p.status !== 'active' && (
                          <button onClick={() => moderate(p.id, 'active')}
                            className="p-1.5 rounded-lg hover:bg-green-100" style={{ color: '#0F6E56' }} title="Approve">
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {p.status === 'active' && (
                          <button onClick={() => moderate(p.id, 'suspended')}
                            className="p-1.5 rounded-lg hover:bg-red-100" style={{ color: '#D85A30' }} title="Suspend">
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
