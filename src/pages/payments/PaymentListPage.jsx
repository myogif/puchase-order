import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { paymentService } from '../../services/paymentService'
import { userService } from '../../services/userService'
import { formatCurrency, formatDateTime, inDateRange } from '../../utils/format'
import { PAYMENT_STATUS_VARIANT, PAGE_SIZE } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import SelectInput from '../../components/ui/SelectInput'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import StatCard from '../../components/ui/StatCard'

export default function PaymentListPage() {
  const [search, setSearch] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounce(search).toLowerCase()

  const orders = orderService.getAll()
  const allPayments = paymentService.getAll()

  const enriched = useMemo(() => {
    return orders.map(o => {
      const oPayments = allPayments.filter(p => p.orderId === o.id)
      const lastPayment = oPayments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      return { ...o, lastPaymentDate: lastPayment?.createdAt, lastPaymentUser: lastPayment ? userService.getById(lastPayment.createdBy)?.name : (userService.getById(o.createdBy)?.name ?? '-') }
    })
  }, [orders, allPayments])

  const stats = useMemo(() => ({
    totalReceived: allPayments.reduce((s, p) => s + p.amount, 0),
    totalOutstanding: orders.filter(o => o.status !== 'PENDING').reduce((s, o) => s + o.remainingAmount, 0),
    unpaidCount: orders.filter(o => o.paymentStatus === 'UNPAID').length,
    partialCount: orders.filter(o => o.paymentStatus === 'PARTIAL').length,
  }), [orders, allPayments])

  const filtered = useMemo(() => {
    return enriched.filter(o => {
      if (payFilter && o.paymentStatus !== payFilter) return false
      if ((dateFrom || dateTo) && !inDateRange(o.createdAt, dateFrom, dateTo)) return false
      if (q && !o.id.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [enriched, q, payFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Pembayaran" subtitle={`${filtered.length} order`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Diterima" value={formatCurrency(stats.totalReceived)} color="green" />
        <StatCard icon={DollarSign} label="Total Piutang" value={formatCurrency(stats.totalOutstanding)} color="red" />
        <StatCard label="Belum Bayar" value={stats.unpaidCount} color="red" />
        <StatCard label="DP/Cicilan" value={stats.partialCount} color="yellow" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari order ID, pelanggan..." className="flex-1 min-w-[180px]" />
        <SelectInput value={payFilter} onChange={v => { setPayFilter(v); setPage(1) }} placeholder="Semua Status" options={['UNPAID','PARTIAL','PAID'].map(s => ({ value: s, label: s }))} />
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="px-2 py-2 border border-gray-300 rounded-lg text-sm" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="px-2 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      <Table headers={[{ key: 'id', label: 'Order ID' }, { key: 'customer', label: 'Pelanggan' }, { key: 'total', label: 'Total', className: 'text-right' }, { key: 'paid', label: 'Dibayar', className: 'text-right' }, { key: 'remaining', label: 'Sisa', className: 'text-right' }, { key: 'status', label: 'Status' }, { key: 'lastPay', label: 'Bayar Terakhir' }, { key: 'user', label: 'Kasir' }]}>
        {paged.map(o => (
          <tr key={o.id} className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm"><Link to={`/orders/${o.id}`} className="font-mono text-blue-600 hover:underline">{o.id}</Link></td>
            <td className="px-4 py-3 text-sm text-gray-900">{o.customerName}</td>
            <td className="px-4 py-3 text-sm text-right">{formatCurrency(o.total)}</td>
            <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(o.paidAmount)}</td>
            <td className="px-4 py-3 text-sm text-right text-red-600">{formatCurrency(o.remainingAmount)}</td>
            <td className="px-4 py-3"><Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus]}>{o.paymentStatus}</Badge></td>
            <td className="px-4 py-3 text-sm text-gray-600">{o.lastPaymentDate ? formatDateTime(o.lastPaymentDate) : '-'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{o.lastPaymentUser}</td>
          </tr>
        ))}
      </Table>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
