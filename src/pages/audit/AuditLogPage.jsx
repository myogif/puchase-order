import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { auditService } from '../../services/auditService'
import { formatDateTime, inDateRange } from '../../utils/format'
import { PAGE_SIZE } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import SelectInput from '../../components/ui/SelectInput'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'

const ACTION_VARIANT = {
  LOGIN: 'neutral', CREATE_ORDER: 'info', ACCEPT_ORDER: 'warning', CREATE_PAYMENT: 'success',
  STOCK_IN: 'info', GATE_COMPLETED: 'success', CREATE_PRODUCT: 'info', UPDATE_PRODUCT: 'warning',
  CREATE_CUSTOMER: 'info', UPDATE_CUSTOMER: 'warning', DEACTIVATE_CUSTOMER: 'danger',
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounce(search).toLowerCase()

  const logs = auditService.getAll()

  const actionOptions = useMemo(() => [...new Set(logs.map(l => l.action))].sort().map(a => ({ value: a, label: a })), [logs])
  const userOptions = useMemo(() => {
    const seen = new Map()
    logs.forEach(l => { if (l.userName && !seen.has(l.userId)) seen.set(l.userId, l.userName) })
    return [...seen.entries()].map(([v, l]) => ({ value: v, label: l }))
  }, [logs])

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (actionFilter && l.action !== actionFilter) return false
      if (userFilter && l.userId !== userFilter) return false
      if ((dateFrom || dateTo) && !inDateRange(l.createdAt, dateFrom, dateTo)) return false
      if (q && !l.description.toLowerCase().includes(q) && !(l.referenceId ?? '').toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [logs, q, actionFilter, userFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Log" subtitle={`${filtered.length} catatan`} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari deskripsi, referensi..." className="flex-1 min-w-[180px]" />
        <SelectInput value={actionFilter} onChange={v => { setActionFilter(v); setPage(1) }} placeholder="Semua Aksi" options={actionOptions} />
        <SelectInput value={userFilter} onChange={v => { setUserFilter(v); setPage(1) }} placeholder="Semua User" options={userOptions} />
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} className="px-2 py-2 border border-gray-300 rounded-lg text-sm" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} className="px-2 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      {paged.length === 0 ? (
        <EmptyState icon={FileText} title="Tidak ada log" description="Tidak ada catatan audit yang cocok dengan filter" />
      ) : (
        <>
          <Table headers={[{ key: 'date', label: 'Tanggal' }, { key: 'user', label: 'User' }, { key: 'action', label: 'Aksi' }, { key: 'ref', label: 'Referensi' }, { key: 'desc', label: 'Deskripsi' }]}>
            {paged.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-sm text-gray-600 whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
                <td className="px-4 py-2.5 text-sm text-gray-900">{l.userName ?? '-'}</td>
                <td className="px-4 py-2.5"><Badge variant={ACTION_VARIANT[l.action] || 'neutral'}>{l.action}</Badge></td>
                <td className="px-4 py-2.5 text-sm">
                  {l.referenceType === 'ORDER' && l.referenceId ? <Link to={`/orders/${l.referenceId}`} className="text-blue-600 hover:underline">{l.referenceType} {l.referenceId}</Link>
                    : l.referenceType ? `${l.referenceType} ${l.referenceId ?? ''}` : '-'}
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-600 max-w-sm truncate">{l.description}</td>
              </tr>
            ))}
          </Table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
