import { useState, useMemo, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { orderService, getGateStatus } from '../../services/orderService'
import { formatCurrency } from '../../utils/format'
import { ORDER_STATUS_VARIANT, PAYMENT_STATUS_VARIANT } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../components/ui/ToastContext'
import PageHeader from '../../components/ui/PageHeader'
import SearchInput from '../../components/ui/SearchInput'
import SelectInput from '../../components/ui/SelectInput'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import StatCard from '../../components/ui/StatCard'

const GATE_VARIANT = { READY_TO_EXIT: 'success', HOLD: 'danger', COMPLETED: 'neutral' }
const GATE_LABEL = { READY_TO_EXIT: 'READY TO EXIT', HOLD: 'HOLD', COMPLETED: 'COMPLETED' }
const GATE_SORT = { READY_TO_EXIT: 0, HOLD: 1, COMPLETED: 2 }

export default function GatePage() {
  const { showToast } = useToast()
  const [ver, setVer] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmOrder, setConfirmOrder] = useState(null)
  const q = useDebounce(search).toLowerCase()

  // Auto-refresh every 10s
  useEffect(() => {
    const id = setInterval(() => setVer(v => v + 1), 10000)
    return () => clearInterval(id)
  }, [])

  const orders = orderService.getAll()

  const enriched = useMemo(() => {
    return orders.map(o => ({ ...o, gateStatus: getGateStatus(o) }))
      .filter(o => {
        if (statusFilter && o.gateStatus !== statusFilter) return false
        if (q && !o.id.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        const d = GATE_SORT[a.gateStatus] - GATE_SORT[b.gateStatus]
        if (d !== 0) return d
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [orders, q, statusFilter, ver])

  const counts = useMemo(() => {
    const all = orders.map(o => getGateStatus(o))
    return { ready: all.filter(s => s === 'READY_TO_EXIT').length, hold: all.filter(s => s === 'HOLD').length, completed: all.filter(s => s === 'COMPLETED').length }
  }, [orders, ver])

  const handleConfirm = () => {
    if (!confirmOrder) return
    const result = orderService.completeAtGate(confirmOrder.id)
    if (result.success) { showToast(`Barang order ${confirmOrder.id} dikonfirmasi keluar`, 'success') }
    else showToast(result.error, 'error')
    setConfirmOrder(null)
    setVer(v => v + 1)
  }

  const holdReason = (o) => {
    if (o.status === 'PENDING') return 'Pre-order belum diterima'
    if (o.paymentStatus !== 'PAID') return 'Belum lunas'
    return ''
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gate Monitor" subtitle="Konfirmasi barang keluar">
        <button onClick={() => setVer(v => v + 1)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium"><RefreshCw size={16} /> Refresh</button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Siap Keluar" value={counts.ready} color="green" />
        <StatCard label="Hold" value={counts.hold} color="red" />
        <StatCard label="Selesai" value={counts.completed} color="blue" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari order ID, pelanggan..." className="flex-1 min-w-[200px]" />
        <SelectInput value={statusFilter} onChange={setStatusFilter} placeholder="Semua Status" options={[{ value: 'READY_TO_EXIT', label: 'Ready to Exit' }, { value: 'HOLD', label: 'Hold' }, { value: 'COMPLETED', label: 'Completed' }]} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Order ID', 'Pelanggan', 'Total', 'Pembayaran', 'Status Order', 'Gate', 'Aksi'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enriched.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono font-medium">{o.id}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{o.customerName}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3"><Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus]}>{o.paymentStatus}</Badge></td>
                <td className="px-4 py-3"><Badge variant={ORDER_STATUS_VARIANT[o.status]}>{o.status}</Badge></td>
                <td className="px-4 py-3">
                  <Badge variant={o.status === 'PENDING' && o.gateStatus === 'HOLD' ? 'warning' : GATE_VARIANT[o.gateStatus]}>
                    {GATE_LABEL[o.gateStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {o.gateStatus === 'READY_TO_EXIT' && (
                    <button onClick={() => setConfirmOrder(o)} className="px-3 py-1.5 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg">Konfirmasi Barang Keluar</button>
                  )}
                  {o.gateStatus === 'HOLD' && (
                    <button disabled title={holdReason(o)} className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">Konfirmasi Barang Keluar</button>
                  )}
                  {o.gateStatus === 'COMPLETED' && (
                    <span className="text-xs text-gray-500">{new Date(o.completedAt).toLocaleString('id-ID')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!confirmOrder} onClose={() => setConfirmOrder(null)} title="Konfirmasi Barang Keluar" size="md">
        {confirmOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-gray-500">Order ID</p><p className="font-medium">{confirmOrder.id}</p></div>
              <div><p className="text-gray-500">Pelanggan</p><p className="font-medium">{confirmOrder.customerName}</p></div>
              <div><p className="text-gray-500">Total Item</p><p className="font-medium">{confirmOrder.items.reduce((s, i) => s + i.quantity, 0)} pcs</p></div>
              <div><p className="text-gray-500">Pembayaran</p><Badge variant={PAYMENT_STATUS_VARIANT[confirmOrder.paymentStatus]}>{confirmOrder.paymentStatus}</Badge></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Detail Item:</p>
              {confirmOrder.items.map(i => (
                <p key={i.productId} className="text-sm text-gray-600">{i.productName} × {i.quantity}</p>
              ))}
            </div>
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg p-3 font-medium">Apakah barang benar-benar sudah keluar?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmOrder(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleConfirm} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">Konfirmasi</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
