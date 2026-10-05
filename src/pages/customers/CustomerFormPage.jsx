import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import { customerService } from '../../services/customerService'
import { useToast } from '../../components/ui/ToastContext'
import PageHeader from '../../components/ui/PageHeader'

export default function CustomerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const isEdit = !!id
  const [form, setForm] = useState({ name: '', phone: '', address: '', isActive: true })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEdit) {
      const c = customerService.getById(id)
      if (!c) { navigate('/customers'); return }
      setForm({ name: c.name, phone: c.phone, address: c.address, isActive: c.isActive })
    }
  }, [id, isEdit, navigate])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Nama wajib diisi'
    if (!form.phone.trim()) e.phone = 'Telepon wajib diisi'
    if (!form.address.trim()) e.address = 'Alamat wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const result = isEdit ? customerService.update(id, form) : customerService.create(form)
    if (!result.success) { showToast(result.error, 'error'); return }
    showToast(`Pelanggan ${isEdit ? 'diperbarui' : 'ditambahkan'}`, 'success')
    navigate('/customers')
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm'

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}>
        <button onClick={() => navigate('/customers')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium"><ArrowLeft size={16} /> Kembali</button>
      </PageHeader>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-xl space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
          <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telepon *</label>
          <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} />
          {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat *</label>
          <textarea className={inputCls} rows={3} value={form.address} onChange={e => set('address', e.target.value)} />
          {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded border-gray-300" />
          <label htmlFor="isActive" className="text-sm text-gray-700">Pelanggan Aktif</label>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Save size={16} /> Simpan</button>
        </div>
      </form>
    </div>
  )
}
