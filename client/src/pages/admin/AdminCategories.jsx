/**
 * Admin — Categories management — /admin/categories
 */

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import AdminLayout from './AdminLayout.jsx'
import { adminApi } from '../../api/admin.js'
import toast from 'react-hot-toast'

const COLORS = ['#C88B00','#D85A30','#0F6E56','#6A4C93','#457B9D','#2DC653','#E63946','#F4A261']

const BLANK = { name: '', nameUrdu: '', slug: '', image: '', color: '#C88B00' }

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminCategories() {
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(BLANK)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    adminApi.categories()
      .then(d => setCats(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function openNew()   { setForm(BLANK); setEditing('new') }
  function openEdit(c) { setForm({ name: c.name, nameUrdu: c.nameUrdu || '', slug: c.slug, image: c.image || '', color: c.color }); setEditing(c.id) }
  function cancel()    { setEditing(null) }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name required'); return }
    if (!form.slug.trim()) { toast.error('Slug required'); return }
    setSaving(true)
    try {
      if (editing === 'new') {
        const d = await adminApi.createCategory(form)
        setCats(cs => [...cs, d.data])
        toast.success('Category created')
      } else {
        const d = await adminApi.updateCategory(editing, form)
        setCats(cs => cs.map(c => c.id === editing ? d.data : c))
        toast.success('Category updated')
      }
      setEditing(null)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return
    try {
      await adminApi.deleteCategory(id)
      setCats(cs => cs.filter(c => c.id !== id))
      toast.success('Category deleted')
    } catch { toast.error('Delete failed') }
  }


  return (
    <AdminLayout active="/admin/categories" title="Categories">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif font-bold text-2xl" style={{ color: '#1C0A00' }}>
          <span style={{ color: '#C88B00' }}>Category</span> Management
        </h1>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: '#C88B00', color: '#1C0A00' }}>
          <Plus size={15} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* List */}
        <div className="flex flex-col gap-2">
          {cats.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
              <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden"
                style={{ background: c.color + '20' }}>
                {c.image
                  ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Tag size={16} style={{ color: c.color }} /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{c.name}</p>
                <p className="text-xs" style={{ color: '#7A6050' }}>
                  /{c.slug} · {c._count?.products ?? c.products ?? 0} products
                  {c.nameUrdu && <span className="ml-1" dir="rtl"> · {c.nameUrdu}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(c)}
                  className="p-1.5 rounded-lg hover:bg-amber-100" style={{ color: '#C88B00' }}>
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(c.id)}
                  className="p-1.5 rounded-lg hover:bg-red-100" style={{ color: '#D85A30' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        {editing && (
          <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
            <p className="font-serif font-bold text-sm mb-4" style={{ color: '#C88B00' }}>
              {editing === 'new' ? 'New Category' : 'Edit Category'}
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#7A6050' }}>Name (English) *</label>
                <input value={form.name}
                  onChange={e => { set('name', e.target.value); if (editing === 'new') set('slug', slugify(e.target.value)) }}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#7A6050' }}>Name (Urdu)</label>
                <input value={form.nameUrdu} onChange={e => set('nameUrdu', e.target.value)} dir="rtl"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#7A6050' }}>Slug *</label>
                <input value={form.slug} onChange={e => set('slug', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none font-mono"
                  style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: '#7A6050' }}>Image URL</label>
                {form.image && (
                  <img src={form.image} alt="preview" className="w-full h-24 object-cover rounded-xl mb-2" onError={e => { e.target.style.display = 'none' }} />
                )}
                <input value={form.image} onChange={e => set('image', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }}
                  placeholder="https://images.unsplash.com/…" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A6050' }}>Colour</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => set('color', c)} type="button"
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{ background: c, borderColor: form.color === c ? '#1C0A00' : 'transparent',
                               transform: form.color === c ? 'scale(1.2)' : 'scale(1)' }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <button onClick={cancel}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(200,139,0,0.1)', color: '#7A6050' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                  style={{ background: '#C88B00', color: '#1C0A00' }}>
                  {saving ? 'Saving…' : editing === 'new' ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
