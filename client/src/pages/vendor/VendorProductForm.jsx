/**
 * Add / Edit Product Form — /vendor/products/new  |  /vendor/products/:id/edit
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, Trash2, ArrowLeft, Save, Package, Upload } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper.jsx'
import { formatPrice } from '../../styles/theme.js'
import { productsApi } from '../../api/products.js'
import { categoriesApi } from '../../api/categories.js'
import api from '../../api/client.js'
import toast from 'react-hot-toast'

const DEFAULT_CATEGORIES = [
  'Knitting Needles', 'Crochet Hooks', 'Yarn & Wool', 'Thread & Floss',
  'Embroidery Hoops', 'Fabric & Cloth', 'Buttons & Notions', 'Patterns',
  'Storage & Accessories', 'Gift Sets',
]

const inputCls   = "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
const inputStyle = { background: '#FFFCF5', border: '2px solid rgba(200,139,0,0.2)', color: '#1C0A00' }

function Field({ label, children, required, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#7A6050' }}>
        {label} {required && <span style={{ color: '#D85A30' }}>*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] mt-1" style={{ color: '#7A6050' }}>{hint}</p>}
    </div>
  )
}

export default function VendorProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminEdit = location.pathname.startsWith('/admin/')
  const returnPath = location.state?.returnPath || (isAdminEdit ? '/admin/products' : '/vendor/products')
  const isEdit = Boolean(id)
  const fileInputRef = useRef(null)

  const [loading,  setLoading]  = useState(isEdit)
  const [saving,   setSaving]   = useState(false)
  const [uploading,setUploading]= useState(false)
  const [categories, setCategories] = useState([])

  const [form, setForm] = useState({
    name:        '',
    nameUrdu:    '',
    categoryId:  '',
    description: '',
    basePrice:   '',
    salePrice:   '',
    saleEndsAt:  '',
    stock:       '',
    tags:        '',
    status:      'active',
  })

  const [variants, setVariants] = useState([])
  const [images,   setImages]   = useState([])

  const [catError, setCatError] = useState(false)

  // Load categories
  useEffect(() => {
    categoriesApi.list()
      .then(d => { setCategories(d.data || []); setCatError(false) })
      .catch(() => setCatError(true))
  }, [])

  // Load product for editing
  useEffect(() => {
    if (!isEdit) return
    productsApi.get(id)
      .then(d => {
        const p = d.data
        if (!p) return
        setForm({
          name:        p.name        || '',
          nameUrdu:    p.nameUrdu    || '',
          categoryId:  p.categoryId  || p.category?.id || '',
          description: p.description || '',
          basePrice:   p.basePrice ? (p.basePrice / 100).toString() : '',
          salePrice:   p.salePrice ? (p.salePrice / 100).toString() : '',
          saleEndsAt:  p.saleEndsAt ? new Date(p.saleEndsAt).toISOString().slice(0, 16) : '',
          stock:       p.stock?.toString() || '0',
          tags:        (p.tags || []).join(', '),
          status:      p.status || 'active',
        })
        setVariants((p.variants || []).map(v => ({ ...v, _key: v.id })))
        setImages(p.images || [])
      })
      .catch(() => toast.error('Could not load product'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addVariant() {
    setVariants(vs => [...vs, { _key: Date.now(), label: '', priceModifier: 0, stock: 0, sku: '' }])
  }
  function updateVariant(key, k, v) {
    setVariants(vs => vs.map(x => x._key === key ? { ...x, [k]: v } : x))
  }
  function removeVariant(key) {
    setVariants(vs => vs.filter(x => x._key !== key))
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (images.length >= 8) { toast.error('Maximum 8 images'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setImages(imgs => [...imgs, data.data.url || data.url])
      toast.success('Image uploaded!')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!form.name.trim()) { toast.error('Product name is required'); return }
    if (!form.categoryId) { toast.error('Please select a category'); return }
    if (!form.basePrice || isNaN(form.basePrice)) { toast.error('Valid price is required'); return }
    if (!form.stock && form.stock !== 0) { toast.error('Stock quantity is required'); return }

    setSaving(true)
    const payload = {
      name:        form.name.trim(),
      nameUrdu:    form.nameUrdu.trim() || undefined,
      categoryId:  form.categoryId || undefined,
      description: form.description.trim() || undefined,
      basePrice:   Math.round(parseFloat(form.basePrice) * 100),
      salePrice:   form.salePrice ? Math.round(parseFloat(form.salePrice) * 100) : null,
      saleEndsAt:  form.saleEndsAt ? new Date(form.saleEndsAt).toISOString() : null,
      stock:       parseInt(form.stock, 10),
      tags:        form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      images,
      status:      form.status,
      variants:    variants.filter(v => v.label.trim()).map(({ label, priceModifier, stock, sku }) => ({
        label, priceModifier, stock, sku: sku || undefined,
      })),
    }

    try {
      if (isEdit) {
        await productsApi.update(id, payload)
        toast.success('Product updated!')
      } else {
        await productsApi.create(payload)
        toast.success('Product created!')
      }
      navigate(returnPath)
    } catch (err) {
      const data = err?.response?.data
      if (data?.errors) {
        const first = Object.values(data.errors).flat()[0]
        toast.error(first || 'Validation error — check your inputs')
      } else {
        toast.error(data?.message || 'Save failed')
      }
    } finally { setSaving(false) }
  }

  const priceInPaisa = Math.round(parseFloat(form.basePrice || 0) * 100)

  if (loading) return (
    <PageWrapper title="Product">
      <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton rounded-xl" style={{ height: 300 }} />
      </div>
    </PageWrapper>
  )

  return (
    <PageWrapper title={isEdit ? 'Edit Product' : 'Add Product'}>
      <div className="min-h-screen" style={{ background: '#FFFCF5' }}>

        {/* Top bar */}
        <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
          style={{ background: '#1C0A00', borderBottom: '2px solid rgba(200,139,0,0.2)' }}>
          <div className="flex items-center gap-3">
            <Link to={isAdminEdit ? '/admin/products' : '/vendor/products'} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: '#C8B89A' }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="font-serif font-bold text-sm" style={{ color: '#C88B00' }}>
                {isEdit ? 'Edit Product' : 'New Product'}
              </p>
              <p className="text-[10px]" style={{ color: '#7A6050' }}>Vendor Panel · StitchBazaar</p>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
            style={{ background: '#C88B00', color: '#1C0A00' }}>
            <Save size={14} />
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Publish'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: main fields */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Basic info */}
              <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <p className="font-serif font-bold text-sm mb-4" style={{ color: '#C88B00' }}>Basic Information</p>
                <div className="flex flex-col gap-4">
                  <Field label="Product Name" required>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="e.g. Bamboo Knitting Needle Set" />
                  </Field>

                  <Field label="Name in Urdu" hint="Optional — helps with Urdu search">
                    <input value={form.nameUrdu} onChange={e => set('nameUrdu', e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="مثلاً بانس کی سلائیاں" dir="rtl" />
                  </Field>

                  <Field label="Category" required>
                    <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}
                      className={inputCls} style={inputStyle}>
                      <option value="">-- Select category --</option>
                      {catError
                        ? <option disabled>Failed to load — refresh page</option>
                        : categories.length === 0
                          ? <option disabled>Loading categories…</option>
                          : categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                      }
                    </select>
                  </Field>

                  <Field label="Description">
                    <textarea value={form.description} rows={4} onChange={e => set('description', e.target.value)}
                      className={inputCls} style={inputStyle}
                      placeholder="Describe your product — materials, dimensions, included items…" />
                  </Field>

                  <Field label="Tags" hint="Comma-separated (e.g. knitting, bamboo, needles)">
                    <input value={form.tags} onChange={e => set('tags', e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="knitting, bamboo, gift" />
                  </Field>
                </div>
              </div>

              {/* Pricing & stock */}
              <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <p className="font-serif font-bold text-sm mb-4" style={{ color: '#C88B00' }}>Pricing & Stock</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Price (Rs.)" required hint={priceInPaisa > 0 ? `= ${priceInPaisa} paisa stored` : ''}>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#C88B00' }}>Rs.</span>
                      <input type="number" min="0" step="0.01" value={form.basePrice}
                        onChange={e => set('basePrice', e.target.value)}
                        className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                        placeholder="0.00" />
                    </div>
                  </Field>

                  <Field label="Stock Quantity" required>
                    <input type="number" min="0" value={form.stock}
                      onChange={e => set('stock', e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="0" />
                  </Field>

                  <Field label="Sale Price (Rs.)" hint="Leave blank for no sale">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#C88B00' }}>Rs.</span>
                      <input type="number" min="0" step="0.01" value={form.salePrice}
                        onChange={e => set('salePrice', e.target.value)}
                        className={inputCls} style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                        placeholder="0.00" />
                    </div>
                  </Field>

                  <Field label="Sale Ends At" hint="Leave blank for no expiry">
                    <input type="datetime-local" value={form.saleEndsAt}
                      onChange={e => set('saleEndsAt', e.target.value)}
                      className={inputCls} style={inputStyle} />
                  </Field>
                </div>
              </div>

              {/* Variants */}
              <div className="rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-serif font-bold text-sm" style={{ color: '#C88B00' }}>
                    Variants <span className="text-xs font-normal" style={{ color: '#7A6050' }}>(optional)</span>
                  </p>
                  <button type="button" onClick={addVariant}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: 'rgba(200,139,0,0.1)', color: '#C88B00' }}>
                    <Plus size={12} /> Add Variant
                  </button>
                </div>

                {variants.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: '#7A6050' }}>
                    No variants — customers will buy the base product. Add variants for different colours, sizes, or bundles.
                  </p>
                ) : variants.map(v => (
                  <div key={v._key} className="flex gap-2 items-start mb-3 p-3 rounded-lg"
                    style={{ background: 'rgba(200,139,0,0.05)', border: '1px solid rgba(200,139,0,0.1)' }}>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input placeholder="Label (e.g. Colour: Red)" value={v.label}
                        onChange={e => updateVariant(v._key, 'label', e.target.value)}
                        className="px-2.5 py-2 rounded-lg text-xs" style={inputStyle} />
                      <input type="number" placeholder="Price delta (Rs.)" value={v.priceModifier / 100}
                        onChange={e => updateVariant(v._key, 'priceModifier', Math.round(parseFloat(e.target.value || 0) * 100))}
                        className="px-2.5 py-2 rounded-lg text-xs" style={inputStyle} />
                      <input type="number" placeholder="Stock" value={v.stock}
                        onChange={e => updateVariant(v._key, 'stock', Number(e.target.value))}
                        className="px-2.5 py-2 rounded-lg text-xs" style={inputStyle} />
                      <input placeholder="SKU (optional)" value={v.sku || ''}
                        onChange={e => updateVariant(v._key, 'sku', e.target.value)}
                        className="px-2.5 py-2 rounded-lg text-xs" style={inputStyle} />
                    </div>
                    <button type="button" onClick={() => removeVariant(v._key)}
                      className="p-1.5 rounded-lg mt-0.5" style={{ color: '#D85A30' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: images + status */}
            <div className="flex flex-col gap-4">
              {/* Images */}
              <div className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <p className="font-serif font-bold text-sm mb-3" style={{ color: '#C88B00' }}>Images</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#D85A30', color: '#FFFCF5' }}>
                        ×
                      </button>
                    </div>
                  ))}
                  {images.length < 8 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-xs border-2 border-dashed transition-colors disabled:opacity-50"
                      style={{ borderColor: 'rgba(200,139,0,0.3)', color: '#C88B00' }}>
                      {uploading ? (
                        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload size={18} />
                          <span>Upload</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={handleImageUpload} />
                <p className="text-[10px]" style={{ color: '#7A6050' }}>Up to 8 images. First image is the main photo.</p>
              </div>

              {/* Status */}
              <div className="rounded-xl p-4" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
                <p className="font-serif font-bold text-sm mb-3" style={{ color: '#C88B00' }}>Status</p>
                {[
                  { value: 'active',   label: 'Active',    hint: 'Visible to customers' },
                  { value: 'inactive', label: 'Inactive',  hint: 'Hidden from shop' },
                  ...(isAdminEdit ? [{ value: 'suspended', label: 'Suspended', hint: 'Admin moderation hold' }] : []),
                ].map(s => (
                  <label key={s.value} className="flex items-center gap-2.5 py-2 cursor-pointer">
                    <input type="radio" name="status" value={s.value} checked={form.status === s.value}
                      onChange={() => set('status', s.value)}
                      className="accent-amber-500" />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#1C0A00' }}>{s.label}</p>
                      <p className="text-[10px]" style={{ color: '#7A6050' }}>{s.hint}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Price preview */}
              {form.basePrice && (
                <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(200,139,0,0.08)', border: '1px solid rgba(200,139,0,0.2)' }}>
                  <p className="text-xs" style={{ color: '#7A6050' }}>Price preview</p>
                  <p className="font-serif font-bold text-xl" style={{ color: '#C88B00' }}>
                    {formatPrice(priceInPaisa)}
                  </p>
                  <p className="text-[10px]" style={{ color: '#7A6050' }}>stored as {priceInPaisa} paisa</p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </PageWrapper>
  )
}
