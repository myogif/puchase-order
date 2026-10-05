import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil, Package } from 'lucide-react'
import { productService } from '../../services/productService'
import { formatCurrency } from '../../utils/format'
import { PRODUCT_CATEGORIES, PAGE_SIZE } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import SelectInput from '../../components/ui/SelectInput'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'

export default function ProductListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search)

  const products = productService.getAll()

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return products.filter(p => {
      if (category && p.category !== category) return false
      if (status === 'active' && !p.isActive) return false
      if (status === 'inactive' && p.isActive) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q) && !p.barcode.includes(q)) return false
      return true
    })
  }, [products, debouncedSearch, category, status])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const headers = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Nama' },
    { key: 'category', label: 'Kategori' },
    { key: 'price', label: 'Harga', className: 'text-right' },
    { key: 'stock', label: 'Stok', className: 'text-right' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '', className: 'text-right' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Produk" subtitle={`${filtered.length} produk`}>
        <button onClick={() => navigate('/products/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Tambah Produk
        </button>
      </PageHeader>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, SKU, barcode..." className="flex-1 min-w-[200px]" />
        <SelectInput value={category} onChange={v => { setCategory(v); setPage(1) }} placeholder="Semua Kategori" options={PRODUCT_CATEGORIES.map(c => ({ value: c, label: c }))} />
        <SelectInput value={status} onChange={v => { setStatus(v); setPage(1) }} placeholder="Semua Status" options={[{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }]} />
      </div>

      {paged.length === 0 ? (
        <EmptyState icon={Package} title="Belum ada produk" description="Tambah produk baru untuk memulai" actionLabel="Tambah Produk" onAction={() => navigate('/products/new')} />
      ) : (
        <>
          <Table headers={headers}>
            {paged.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-600">{p.sku}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center"><Package size={14} className="text-gray-400" /></div>
                    )}
                    <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(p.price)}</td>
                <td className={`px-4 py-3 text-sm text-right font-medium ${p.stock <= p.minimumStock ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</td>
                <td className="px-4 py-3"><Badge variant={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Aktif' : 'Nonaktif'}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/products/${p.id}`)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Detail"><Eye size={16} /></button>
                    <button onClick={() => navigate(`/products/${p.id}/edit`)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Pencil size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
