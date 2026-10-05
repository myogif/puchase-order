import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, Eye } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { productService } from '../../services/productService'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../components/ui/ToastContext'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'

export default function PreOrderListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [ver, setVer] = useState(0)
  const q = useDebounce(search).toLowerCase()

  const pending = useMemo(() => {
    return orderService.getAll()
      .filter(o => o.status === 'PENDING')
      .filter(o => !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [q, ver])

  const stockReady = (order) => order.items.every(i => (productService.getById(i.productId)?.stock ?? 0) >= i.quantity)

  const handleAccept = (orderId) => {
    const result = orderService.acceptOrder(orderId)
    if (result.success) { showToast('Pre-order diterima', 'success'); setVer(v => v + 1) }
    else showToast(result.error, 'error')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pre-Order" subtitle={`${pending.length} pre-order`} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari order ID, pelanggan..." className="max-w-sm" />
      </div>

      {pending.length === 0 ? (
        <EmptyState icon={Clock} title="Tidak ada pre-order" description="Semua pre-order sudah diproses" />
      ) : (
        <Table headers={[{ key: 'id', label: 'Order ID' }, { key: 'customer', label: 'Pelanggan' }, { key: 'items', label: 'Item' }, { key: 'total', label: 'Total', className: 'text-right' }, { key: 'stock', label: 'Stok' }, { key: 'date', label: 'Tanggal' }, { key: 'actions', label: '', className: 'text-right' }]}>
          {pending.map(o => {
            const ready = stockReady(o)
            return (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono font-medium">{o.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{o.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{o.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3"><Badge variant={ready ? 'success' : 'danger'}>{ready ? 'Stok Cukup' : 'Stok Kurang'}</Badge></td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/orders/${o.id}`)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Detail"><Eye size={16} /></button>
                    <button onClick={() => handleAccept(o.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg"><CheckCircle size={14} /> Terima</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      )}
    </div>
  )
}
