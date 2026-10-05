import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, AlertTriangle, XCircle, ArrowDownToLine, ArrowUpFromLine, Warehouse } from 'lucide-react'
import { productService, getStockStatus } from '../../services/productService'
import { stockService } from '../../services/stockService'
import { isToday } from '../../utils/format'
import { PAGE_SIZE } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import { usePermission } from '../../hooks/usePermission'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import SelectInput from '../../components/ui/SelectInput'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import StatCard from '../../components/ui/StatCard'

const STATUS_LABELS = { SAFE: { l: 'SAFE', v: 'success' }, LOW_STOCK: { l: 'LOW STOCK', v: 'warning' }, OUT_OF_STOCK: { l: 'OUT OF STOCK', v: 'danger' } }

export default function InventoryPage() {
  const navigate = useNavigate()
  const canMovements = usePermission('stockMovements')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounce(search).toLowerCase()

  const products = productService.getAll().filter(p => p.isActive)
  const movements = stockService.getAll()

  const stats = useMemo(() => {
    const todayIn = movements.filter(m => m.type === 'IN' && isToday(m.createdAt)).reduce((s, m) => s + m.quantity, 0)
    const todayOut = movements.filter(m => m.type === 'OUT' && isToday(m.createdAt)).reduce((s, m) => s + m.quantity, 0)
    return {
      total: products.length,
      totalStock: products.reduce((s, p) => s + p.stock, 0),
      critical: products.filter(p => p.stock > 0 && p.stock <= p.minimumStock).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      todayIn,
      todayOut,
    }
  }, [products, movements])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const st = getStockStatus(p)
      if (statusFilter && st !== statusFilter) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, q, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Inventori" subtitle="Manajemen stok produk">
        <div className="flex gap-2">
          {canMovements && <button onClick={() => navigate('/inventory/movements')} className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium">Riwayat</button>}
          <button onClick={() => navigate('/inventory/stock-in')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><ArrowDownToLine size={16} /> Barang Masuk</button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Package} label="Total Produk" value={stats.total} color="blue" />
        <StatCard icon={Warehouse} label="Total Stok" value={stats.totalStock} color="purple" />
        <StatCard icon={AlertTriangle} label="Stok Kritis" value={stats.critical} color="yellow" />
        <StatCard icon={XCircle} label="Out of Stock" value={stats.outOfStock} color="red" />
        <StatCard icon={ArrowDownToLine} label="Masuk Hari Ini" value={stats.todayIn} color="green" />
        <StatCard icon={ArrowUpFromLine} label="Keluar Hari Ini" value={stats.todayOut} color="red" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, SKU..." className="flex-1 min-w-[200px]" />
        <SelectInput value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1) }} placeholder="Semua Status"
          options={[{ value: 'SAFE', label: 'Safe' }, { value: 'LOW_STOCK', label: 'Low Stock' }, { value: 'OUT_OF_STOCK', label: 'Out of Stock' }]} />
      </div>

      <Table headers={[{ key: 'name', label: 'Produk' }, { key: 'cat', label: 'Kategori' }, { key: 'stock', label: 'Stok', className: 'text-right' }, { key: 'min', label: 'Min. Stok', className: 'text-right' }, { key: 'status', label: 'Status' }]}>
        {paged.map(p => {
          const s = STATUS_LABELS[getStockStatus(p)]
          return (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3"><span className="text-sm font-medium text-gray-900">{p.name}</span><br /><span className="text-xs text-gray-500">{p.sku}</span></td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
              <td className={`px-4 py-3 text-sm text-right font-medium ${p.stock <= p.minimumStock ? 'text-red-600' : ''}`}>{p.stock}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{p.minimumStock}</td>
              <td className="px-4 py-3"><Badge variant={s.v}>{s.l}</Badge></td>
            </tr>
          )
        })}
      </Table>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  )
}
