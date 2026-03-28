/**
 * VendorImport — Bulk product CSV import page
 * /vendor/import
 */

import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileText, CheckCircle, XCircle, Download, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import VendorLayout from './VendorLayout.jsx'
import api from '../../api/client.js'

const TEMPLATE_CSV = `name,categorySlug,basePrice,stock,description,tags,images
Merino Wool Yarn 100g,yarn,850,50,Soft merino wool for knitting,merino|wool|yarn,
Bamboo Knitting Needles 4mm,needles-hooks,350,30,Smooth bamboo needles,bamboo|needles,
Cotton Embroidery Thread Set,thread-floss,450,100,24-color embroidery thread set,embroidery|thread|cotton,`

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = 'stitchbazaar_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function VendorImport() {
  const fileRef  = useRef(null)
  const [file,     setFile]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)   // { created, failed, errors }
  const [dragging, setDragging] = useState(false)

  function pickFile(f) {
    if (!f) return
    if (!f.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return }
    setFile(f)
    setResult(null)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post('/import/products', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data.data)
      if (res.data.data.created > 0) {
        toast.success(`${res.data.data.created} products imported!`)
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <VendorLayout active="/vendor/import" title="Import">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/vendor/products" className="flex items-center gap-2 text-sm mb-6 hover:underline"
          style={{ color: '#C88B00' }}>
          <ArrowLeft size={14} /> Back to Products
        </Link>

        <h1 className="font-serif font-bold text-2xl mb-2" style={{ color: '#1C0A00' }}>
          Bulk Import <span style={{ color: '#C88B00' }}>Products</span>
        </h1>
        <p className="text-sm mb-6" style={{ color: '#7A6050' }}>
          Upload a CSV file to add up to 200 products at once.
        </p>

        {/* Download template */}
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-6 transition-all hover:-translate-y-0.5"
          style={{ background: 'rgba(200,139,0,0.1)', color: '#C88B00', border: '1.5px solid rgba(200,139,0,0.3)' }}>
          <Download size={15} /> Download CSV Template
        </button>

        {/* Column reference */}
        <div className="rounded-xl p-4 mb-6" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
          <p className="font-semibold text-sm mb-3" style={{ color: '#1C0A00' }}>CSV Columns</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ color: '#5A4030' }}>
            {[
              ['name', 'Required — product name'],
              ['categorySlug', 'Required — e.g. "yarn", "needles-hooks"'],
              ['basePrice', 'Required — price in Rs. (not paisa)'],
              ['stock', 'Optional — quantity (default 0)'],
              ['description', 'Optional — product description'],
              ['tags', 'Optional — pipe-separated e.g. wool|soft'],
              ['images', 'Optional — pipe-separated URLs'],
            ].map(([col, desc]) => (
              <div key={col} className="contents">
                <code className="font-mono font-bold" style={{ color: '#C88B00' }}>{col}</code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-12 gap-3 cursor-pointer transition-all"
          style={{
            borderColor: dragging ? '#C88B00' : 'rgba(200,139,0,0.3)',
            background:  dragging ? 'rgba(200,139,0,0.06)' : '#FFF8E7',
          }}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]) }}
        >
          {file ? (
            <>
              <FileText size={36} style={{ color: '#C88B00' }} />
              <p className="font-semibold text-sm" style={{ color: '#1C0A00' }}>{file.name}</p>
              <p className="text-xs" style={{ color: '#7A6050' }}>{(file.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <Upload size={36} style={{ color: 'rgba(200,139,0,0.5)' }} />
              <p className="font-medium text-sm" style={{ color: '#5A4030' }}>
                Drop your CSV here or <span style={{ color: '#C88B00' }}>click to browse</span>
              </p>
              <p className="text-xs" style={{ color: '#A07000' }}>Max 2 MB · .csv only</p>
            </>
          )}
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={e => pickFile(e.target.files?.[0])} />
        </div>

        {/* Upload button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#C88B00', color: '#1C0A00' }}>
            {loading ? 'Importing…' : <><Upload size={15} /> Import Products</>}
          </button>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 rounded-xl p-5" style={{ background: '#FFF8E7', border: '2px solid rgba(200,139,0,0.15)' }}>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} style={{ color: '#0F6E56' }} />
                <span className="font-bold" style={{ color: '#0F6E56' }}>{result.created} created</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle size={18} style={{ color: '#D85A30' }} />
                  <span className="font-bold" style={{ color: '#D85A30' }}>{result.failed} failed</span>
                </div>
              )}
            </div>
            {result.errors?.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold mb-1" style={{ color: '#D85A30' }}>Errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(216,90,48,0.08)', color: '#D85A30' }}>
                    Row {e.row}: {e.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </VendorLayout>
  )
}
