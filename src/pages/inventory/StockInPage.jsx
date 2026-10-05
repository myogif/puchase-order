import { useState, useMemo } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { productService } from '../../services/productService'
import { stockService } from '../../services/stockService'
import { useToast } from '../../components/ui/ToastContext'
import { formatCurrency, formatDateTime, todayKey } from '../../utils/format'
import PageHeader from '../../components/ui/PageHeader'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'

export default function StockInPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [form, setForm] = useState({ productId: '', quantity: '', date: todayKey(), note: '' })
  const [productSearch, setProductSearch] = useState('')
  const [ver, setVer] = useState(0)

  const products = productService.getAll().filter(p => p.isActive)
  const recentIn = useMemo(() => stockService.getAll().filter(m => m.type === 'IN').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10), [ver])

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase()
    if (!q) return products
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, productSearch])

  const selectedProduct = products.find(p => p.id === form.productId)

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = productService.stockIn({ productId: form.productId, quantity: form.quantity, date: form.date, note: form.note })
    if (!result.success) { showToast(result.error, 'error'); return }
    showToast(`Stok ${result.product.name} bertambah ${form.quantity} (sekarang ${result.product.stock})`, 'success')
    setForm({ productId: '', quantity: '', date: todayKey(), note: '' })
    setProductSearch('')
    setVer(v => v + 1)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Barang Masuk" subtitle="Tambah stok produk">
        <button onClick={() => navigate('/inventory')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium"><ArrowLeft size={16} /> Kembali</button>
      </PageHeader>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Produk *</label>
          <input
            type="text"
            placeholder="Cari produk..."
            value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : productSearch}
            onChange={e => { setProductSearch(e.target.value); setForm(f => ({ ...f, productId: '' })) }}
            onFocus={() => { if (selectedProduct) { setProductSearch(''); setForm(f => ({ ...f, productId: '' })) } }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          {!form.productId && productSearch && (
            <div className="border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="px-3 py-2 text-sm text-gray-500">Produk tidak ditemukan</p>
              ) : filteredProducts.slice(0, 10).map(p => (
                <button key={p.id} type="button" onClick={() => { setForm(f => ({ ...f, productId: p.id })); setProductSearch('') }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between">
                  <span>{p.name} <span className="text-gray-400">({p.sku})</span></span>
                  <span className="text-gray-500">Stok: {p.stock}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
            <input type="number" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Opsional" />
        </div>
        <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Tambah Stok</button>
      </form>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Barang Masuk Terbaru</h3>
        <Table headers={[{ key: 'date', label: 'Tanggal' }, { key: 'product', label: 'Produk' }, { key: 'qty', label: 'Jumlah', className: 'text-right' }, { key: 'note', label: 'Catatan' }]}>
          {recentIn.map(m => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 text-sm text-gray-600">{formatDateTime(m.createdAt)}</td>
              <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{m.productName}</td>
              <td className="px-4 py-2.5 text-sm text-right text-green-600 font-medium">+{m.quantity}</td>
              <td className="px-4 py-2.5 text-sm text-gray-500">{m.note || '-'}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  )
}
