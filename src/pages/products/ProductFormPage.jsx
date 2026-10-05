import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft, X } from 'lucide-react'
import { productService } from '../../services/productService'
import { PRODUCT_CATEGORIES } from '../../utils/constants'
import { useToast } from '../../components/ui/ToastContext'
import PageHeader from '../../components/ui/PageHeader'

export default function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const isEdit = !!id

  const [form, setForm] = useState({ sku: '', barcode: '', name: '', category: 'Roti', price: '', stock: '0', minimumStock: '0', isActive: true, image: null })
  const [errors, setErrors] = useState({})
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (isEdit) {
      const p = productService.getById(id)
      if (!p) { setNotFound(true); return }
      setForm({ sku: p.sku, barcode: p.barcode, name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), minimumStock: String(p.minimumStock), isActive: p.isActive, image: p.image })
    }
  }, [id, isEdit])

  if (notFound) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Produk tidak ditemukan</p>
      <button onClick={() => navigate('/products')} className="text-blue-600 hover:underline">← Kembali</button>
    </div>
  )

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) { showToast('Ukuran gambar maksimal 500KB', 'error'); return }
    const reader = new FileReader()
    reader.onload = () => set('image', reader.result)
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const e = {}
    if (!form.sku.trim()) e.sku = 'SKU wajib diisi'
    if (!form.barcode.trim()) e.barcode = 'Barcode wajib diisi'
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (form.price === '' || Number(form.price) < 0) e.price = 'Harga harus ≥ 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    try {
      const data = { ...form, price: Number(form.price), stock: Number(form.stock), minimumStock: Number(form.minimumStock) }
      const result = isEdit ? productService.update(id, data) : productService.create(data)
      if (!result.success) { showToast(result.error, 'error'); return }
      showToast(`Produk ${isEdit ? 'diperbarui' : 'ditambahkan'}`, 'success')
      navigate('/products')
    } catch (err) {
      if (err.name === 'QuotaExceededError') showToast('Penyimpanan penuh, gunakan gambar lebih kecil', 'error')
      else showToast('Terjadi kesalahan', 'error')
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm'
  const errCls = 'text-xs text-red-600 mt-1'

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? 'Edit Produk' : 'Tambah Produk'}>
        <button onClick={() => navigate('/products')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium">
          <ArrowLeft size={16} /> Kembali
        </button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input className={inputCls} value={form.sku} onChange={e => set('sku', e.target.value)} />
            {errors.sku && <p className={errCls}>{errors.sku}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Barcode *</label>
            <input className={inputCls} value={form.barcode} onChange={e => set('barcode', e.target.value)} />
            {errors.barcode && <p className={errCls}>{errors.barcode}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
            {errors.name && <p className={errCls}>{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label>
            <input type="number" min="0" className={inputCls} value={form.price} onChange={e => set('price', e.target.value)} />
            {errors.price && <p className={errCls}>{errors.price}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
            {isEdit ? (
              <div><p className="text-sm text-gray-900 py-2">{form.stock}</p><p className="text-xs text-gray-500">Stok hanya berubah via Barang Masuk / Pembayaran</p></div>
            ) : (
              <input type="number" min="0" className={inputCls} value={form.stock} onChange={e => set('stock', e.target.value)} />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stok</label>
            <input type="number" min="0" className={inputCls} value={form.minimumStock} onChange={e => set('minimumStock', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
            <div className="flex items-center gap-4">
              {form.image && (
                <div className="relative">
                  <img src={form.image} alt="" className="w-20 h-20 rounded-lg object-cover border" />
                  <button type="button" onClick={() => set('image', null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImage} className="text-sm text-gray-500" />
            </div>
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded border-gray-300" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Produk Aktif</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            <Save size={16} /> Simpan
          </button>
        </div>
      </form>
    </div>
  )
}
