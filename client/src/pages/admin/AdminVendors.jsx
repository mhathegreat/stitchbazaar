/**
 * Admin — Vendors management — /admin/vendors
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Eye, Search, Store } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { adminApi } from '../../api/admin.js'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending:   { color: '#C88B00', bg: 'rgba(200,139,0,0.1)',  label: 'Pending'   },
  active:    { color: '#0F6E56', bg: 'rgba(15,110,86,0.1)',  label: 'Active'    },
  suspended: { color: '#D85A30', bg: 'rgba(216,90,48,0.1)',  label: 'Suspended' },
}

const MOCK_VENDORS = [
  { id: 'v1', shopName: 'CraftHub Lahore',   user: { name: 'Ali Hassan',   email: 'ali@crafthub.pk',  phone: '03001234567' }, city: 'Lahore',    status: 'active',    products: 48, createdAt: '2025-06-10' },
  { id: 'v2', shopName: 'Yarn Paradise',     user: { name: 'Sara Ahmed',   email: 'sara@yarn.pk',     phone: '03119876543' }, city: 'Karachi',   status: 'active',    products: 32, createdAt: '2025-07-02' },
  { id: 'v3', shopName: 'Stitch Studio',     user: { name: 'Fatima Malik', email: 'fatima@stitch.pk', phone: '03451111222' }, city: 'Islamabad', status: 'pending',   products: 0,  createdAt: '2026-03-25' },
  { id: 'v4', shopName: 'The Knit Corner',   user: { name: 'Zara Butt',    email: 'zara@knit.pk',     phone: '03217654321' }, city: 'Multan',    status: 'pending',   products: 0,  createdAt: '2026-03-26' },
  { id: 'v5', shopName: 'Crafty Hands',      user: { name: 'Nida Shah',    email: 'nida@crafty.pk',   phone: '03320001111' }, city: 'Faisalabad',status: 'suspended', products: 12, createdAt: '2025-09-15' },
]

export default function AdminVendors() {
  const [vendors, setVendors] = useState(MOCK_VENDORS)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    adminApi.vendors(params)
      .then(d => setVendors(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = vendors.filter(v => {
    const matchSearch = !search || v.shopName.toLowerCase().includes(search.toLowerCase())
                                || v.user?.name.toLowerCase().includes(search.toLowerCase())
    return matchSearch
  })

  async function approve(id) {
    try {
      await adminApi.approveVendor(id)
      setVendors(vs => vs.map(v => v.id === id ? { ...v, status: 'active' } : v))
      toast.success('Vendor approved — email sent')
    } catch { toast.error('Action failed') }
  }
  async function reject(id) {
    try {
      await adminApi.rejectVendor(id)
      setVendors(vs => vs.map(v => v.id === id ? { ...v, status: 'suspended' } : v))
      toast.error('Vendor rejected — email sent')
    } catch { toast.error('Action failed') }
  }

  return (
    <AdminLayout active="/admin/vendors" title="Vendors">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
          Vendor <span style={{ color: '#C88B00' }}>Management</span>
        </h1>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.2)' }}>
          <Search size={14} style={{ color: '#C88B00' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors…" className="bg-transparent text-sm outline-none"
            style={{ color: '#1C0A00', width: 180 }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['all', 'pending', 'active', 'suspended'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={filter === f
              ? { background: '#C88B00', color: '#1C0A00' }
              : { background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
            {f}
            {f === 'pending' && vendors.filter(v => v.status === 'pending').length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: '#D85A30', color: '#FFFCF5' }}>
                {vendors.filter(v => v.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '2px solid rgba(200,139,0,0.15)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#C88B00', color: '#1C0A00' }}>
                <th className="text-left px-4 py-3 font-serif">Shop</th>
                <th className="text-left px-4 py-3 font-serif hidden md:table-cell">Owner</th>
                <th className="text-left px-4 py-3 font-serif hidden lg:table-cell">City</th>
                <th className="text-right px-4 py-3 font-serif hidden sm:table-cell">Products</th>
                <th className="text-center px-4 py-3 font-serif">Status</th>
                <th className="text-right px-4 py-3 font-serif">Actions</th>
              </tr>
            </thead>
            <tbody style={{ background: '#FFF8E7' }}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10" style={{ color: '#7A6050' }}>
                    <Store size={28} className="mx-auto mb-2 opacity-30" /> No vendors found
                  </td>
                </tr>
              ) : filtered.map((v, i) => {
                const sc = STATUS_COLORS[v.status]
                return (
                  <tr key={v.id} style={{ borderTop: i > 0 ? '1px solid rgba(200,139,0,0.1)' : undefined }}>
                    <td className="px-4 py-3">
                      <p className="font-semibold" style={{ color: '#1C0A00' }}>{v.shopName}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>{v.createdAt}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm" style={{ color: '#1C0A00' }}>{v.user.name}</p>
                      <p className="text-xs" style={{ color: '#7A6050' }}>{v.user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell" style={{ color: '#7A6050' }}>{v.city}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell" style={{ color: '#1C0A00' }}>{v._count?.products ?? v.products ?? 0}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: sc.bg, color: sc.color }}>
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Link to={`/vendors/${v.id}`}
                          className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors" title="View Shop"
                          style={{ color: '#457B9D' }}>
                          <Eye size={14} />
                        </Link>
                        {v.status === 'pending' && <>
                          <button onClick={() => approve(v.id)}
                            className="p-1.5 rounded-lg hover:bg-green-100 transition-colors" title="Approve"
                            style={{ color: '#0F6E56' }}>
                            <CheckCircle size={14} />
                          </button>
                          <button onClick={() => reject(v.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 transition-colors" title="Reject"
                            style={{ color: '#D85A30' }}>
                            <XCircle size={14} />
                          </button>
                        </>}
                        {v.status === 'active' && (
                          <button onClick={() => reject(v.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold px-2"
                            style={{ color: '#D85A30' }}>
                            Suspend
                          </button>
                        )}
                        {v.status === 'suspended' && (
                          <button onClick={() => approve(v.id)}
                            className="p-1.5 rounded-lg hover:bg-green-100 transition-colors text-xs font-semibold px-2"
                            style={{ color: '#0F6E56' }}>
                            Reinstate
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
