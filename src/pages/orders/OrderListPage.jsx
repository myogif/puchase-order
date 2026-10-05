import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Plus } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { formatCurrency, formatDateTime, inDateRange } from '../../utils/format'
import { ORDER_STATUS_VARIANT, PAYMENT_STATUS_VARIANT, PAGE_SIZE } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import { usePermission } from '../../hooks/usePermission'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import SelectInput from '../../components/ui/SelectInput'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'

export default function OrderListPage() {
  const navigate = useNavigate()
  const canPOS = usePermission('pos')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounce(search).toLowerCase()

  const orders = orderService.getAll()

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter && o.status !== statusFilter) return false
      if (payFilter && o.paymentStatus !== payFilter) return false
      if ((dateFrom || dateTo) && !inDateRange(o.createdAt, dateFrom, dateTo)) return false
      if (q && !o.id.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [orders, q, statusFilter, payFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Pesanan" subtitle={`${filtered.length} pesanan`}>
        {canPOS && (
          <button onClick={() => navigate('/pos')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Order Baru</button>
        )}
      </PageHeader>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari order ID, pelanggan..." className="flex-1 min-w-[180px]" />
        <SelectInput value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1) }} placeholder="Status Order" options={['PENDING','ACCEPTED','PAID','COMPLETED'].map(s => ({ value: s, label: s }))} />
        <SelectInput value={payFilter} onChange={v => { setPayFilter(v); setPage(1) }} placeholder="Status Bayar" options={['UNPAID','PARTIAL','PAID'].map(s => ({ value: s, label: s }))} />
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="px-2 py-2 border border-gray-300 rounded-lg text-sm" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="px-2 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      {paged.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Tidak ada pesanan" description="Buat order baru melalui POS" />
      ) : (
        <>
          <Table headers={[{ key: 'id', label: 'Order ID' }, { key: 'customer', label: 'Pelanggan' }, { key: 'items', label: 'Item' }, { key: 'total', label: 'Total', className: 'text-right' }, { key: 'payment', label: 'Pembayaran' }, { key: 'status', label: 'Status' }, { key: 'date', label: 'Tanggal' }]}>
            {paged.map(o => (
              <tr key={o.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>
                <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{o.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{o.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{o.items.length} item</td>
                <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3"><Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus]}>{o.paymentStatus}</Badge></td>
                <td className="px-4 py-3"><Badge variant={ORDER_STATUS_VARIANT[o.status]}>{o.status}</Badge></td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </Table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
