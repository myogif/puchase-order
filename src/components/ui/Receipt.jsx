import { Printer } from 'lucide-react'
import Modal from './Modal'
import { paymentService } from '../../services/paymentService'
import { userService } from '../../services/userService'
import { formatCurrency, formatDateTime } from '../../utils/format'

const LINE = '-'.repeat(40)

function Row({ label, value, bold }) {
  return (
    <div className={`flex justify-between gap-2 ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

// Printable receipt for an order. Reads the latest payments so it reflects DP / settlement history.
export function Receipt({ order }) {
  const payments = paymentService.getByOrder(order.id)
  const cashier = userService.getById(order.createdBy)

  return (
    <div className="print-area mx-auto w-full max-w-[42ch] font-mono text-xs leading-relaxed text-gray-900">
      <div className="text-center">
        <p className="text-sm font-bold">ROTI DISTRIBUTOR</p>
        <p>Jl. Industri Roti No. 1</p>
        <p>Telp. 021-555-0101</p>
      </div>
      <p className="overflow-hidden whitespace-nowrap">{LINE}</p>
      <Row label="No" value={order.id} />
      <Row label="Tanggal" value={formatDateTime(order.createdAt)} />
      <Row label="Pelanggan" value={order.customerName} />
      <Row label="Kasir" value={cashier?.name ?? '-'} />
      <p className="overflow-hidden whitespace-nowrap">{LINE}</p>
      {order.items.map(item => (
        <div key={item.productId}>
          <p>{item.productName}</p>
          <Row label={`  ${item.quantity} x ${formatCurrency(item.price)}`} value={formatCurrency(item.subtotal)} />
        </div>
      ))}
      <p className="overflow-hidden whitespace-nowrap">{LINE}</p>
      <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
      <Row label="Diskon" value={formatCurrency(order.discount)} />
      <Row label="TOTAL" value={formatCurrency(order.total)} bold />
      <p className="overflow-hidden whitespace-nowrap">{LINE}</p>
      {payments.map(p => (
        <Row key={p.id} label={`Bayar ${formatDateTime(p.createdAt)}`} value={formatCurrency(p.amount)} />
      ))}
      <Row label="Dibayar" value={formatCurrency(order.paidAmount)} />
      <Row label="Sisa" value={formatCurrency(order.remainingAmount)} bold />
      <Row label="Status" value={order.paymentStatus} />
      <p className="overflow-hidden whitespace-nowrap">{LINE}</p>
      <p className="text-center">Terima kasih atas pesanan Anda</p>
    </div>
  )
}

export default function ReceiptModal({ isOpen, order, onClose }) {
  if (!order) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Struk ${order.id}`} size="sm">
      <Receipt order={order} />
      <div className="mt-4 flex justify-end gap-2 print:hidden">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          Tutup
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Printer size={16} /> Cetak
        </button>
      </div>
    </Modal>
  )
}
