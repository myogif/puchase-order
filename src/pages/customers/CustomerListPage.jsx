import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Pencil } from 'lucide-react'
import { customerService } from '../../services/customerService'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../components/ui/ToastContext'
import { PAGE_SIZE } from '../../utils/constants'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import SelectInput from '../../components/ui/SelectInput'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmModal from '../../components/ui/ConfirmModal'

export default function CustomerListPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [ver, setVer] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const debouncedSearch = useDebounce(search)

  const customers = customerService.getAll()

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return customers.filter(c => {
      if (status === 'active' && !c.isActive) return false
      if (status === 'inactive' && c.isActive) return false
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q) && !c.address.toLowerCase().includes(q)) return false
      return true
    })
  }, [customers, debouncedSearch, status, ver])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = () => {
    if (!deleteTarget) return
    const result = customerService.delete(deleteTarget.id)
    if (result.success) { showToast(`${deleteTarget.name} dinonaktifkan`, 'success'); setVer(v => v + 1) }
    else showToast(result.error, 'error')
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pelanggan" subtitle={`${filtered.length} pelanggan`}>
        <button onClick={() => navigate('/customers/new')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Tambah Pelanggan
        </button>
      </PageHeader>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, telepon, alamat..." className="flex-1 min-w-[200px]" />
        <SelectInput value={status} onChange={v => { setStatus(v); setPage(1) }} placeholder="Semua Status" options={[{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }]} />
      </div>

      {paged.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada pelanggan" actionLabel="Tambah Pelanggan" onAction={() => navigate('/customers/new')} />
      ) : (
        <>
          <Table headers={[{ key: 'name', label: 'Nama' }, { key: 'phone', label: 'Telepon' }, { key: 'address', label: 'Alamat' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '', className: 'text-right' }]}>
            {paged.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{c.address}</td>
                <td className="px-4 py-3"><Badge variant={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Aktif' : 'Nonaktif'}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/customers/${c.id}/edit`)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded" title="Edit"><Pencil size={16} /></button>
                    {c.isActive && (
                      <button onClick={() => setDeleteTarget(c)} className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">Nonaktifkan</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Nonaktifkan Pelanggan" message={`Apakah Anda yakin ingin menonaktifkan pelanggan "${deleteTarget?.name}"?`}
        confirmText="Nonaktifkan" variant="danger" />
    </div>
  )
}
