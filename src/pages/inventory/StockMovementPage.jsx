import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { stockService } from '../../services/stockService'
import { productService } from '../../services/productService'
import { userService } from '../../services/userService'
import { formatDateTime, inDateRange } from '../../utils/format'
import { PAGE_SIZE } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import { usePermission } from '../../hooks/usePermission'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import SelectInput from '../../components/ui/SelectInput'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'

export default function StockMovementPage() {
  const canOrders = usePermission('orders')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounce(search).toLowerCase()

  const movements = stockService.getAll()
  const products = productService.getAll()
  const productOptions = useMemo(() => [...new Set(movements.map(m => m.productId))].map(id => {
    const p = products.find(x => x.id === id)
    return { value: id, label: p?.name ?? id }
  }), [movements, products])

  const filtered = useMemo(() => {
    return movements.filter(m => {
      if (typeFilter && m.type !== typeFilter) return false
      if (productFilter && m.productId !== productFilter) return false
      if ((dateFrom || dateTo) && !inDateRange(m.createdAt, dateFrom, dateTo)) return false
      if (q && !m.productName.toLowerCase().includes(q) && !(m.referenceId ?? '').toLowerCase().includes(q) && !(m.note ?? '').toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [movements, q, typeFilter, productFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Pergerakan Stok" subtitle={`${filtered.length} catatan`} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari produk, referensi..." className="flex-1 min-w-[180px]" />
        <SelectInput value={typeFilter} onChange={v => { setTypeFilter(v); setPage(1) }} placeholder="Semua Tipe" options={[{ value: 'IN', label: 'Masuk' }, { value: 'OUT', label: 'Keluar' }]} />
        <SelectInput value={productFilter} onChange={v => { setProductFilter(v); setPage(1) }} placeholder="Semua Produk" options={productOptions} />
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="px-2 py-2 border border-gray-300 rounded-lg text-sm" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="px-2 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      <Table headers={[{ key: 'date', label: 'Tanggal' }, { key: 'product', label: 'Produk' }, { key: 'type', label: 'Tipe' }, { key: 'qty', label: 'Jumlah', className: 'text-right' }, { key: 'ref', label: 'Referensi' }, { key: 'user', label: 'User' }, { key: 'note', label: 'Catatan' }]}>
        {paged.map(m => (
          <tr key={m.id} className="hover:bg-gray-50">
            <td className="px-4 py-2.5 text-sm text-gray-600">{formatDateTime(m.createdAt)}</td>
            <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{m.productName}</td>
            <td className="px-4 py-2.5"><Badge variant={m.type === 'IN' ? 'success' : 'danger'}>{m.type === 'IN' ? 'Masuk' : 'Keluar'}</Badge></td>
            <td className={`px-4 py-2.5 text-sm text-right font-medium ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'IN' ? '+' : '-'}{m.quantity}</td>
            <td className="px-4 py-2.5 text-sm">
              {m.referenceType === 'ORDER' && m.referenceId ? (
                canOrders ? <Link to={`/orders/${m.referenceId}`} className="text-blue-600 hover:underline">{m.referenceId}</Link> : <span>{m.referenceId}</span>
              ) : 'STOCK_IN'}
            </td>
            <td className="px-4 py-2.5 text-sm text-gray-600">{userService.getById(m.createdBy)?.name ?? '-'}</td>
            <td className="px-4 py-2.5 text-sm text-gray-500 max-w-xs truncate">{m.note || '-'}</td>
          </tr>
        ))}
      </Table>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
