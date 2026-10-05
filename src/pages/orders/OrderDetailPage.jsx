import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, CreditCard, CheckCircle, AlertTriangle } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { paymentService } from '../../services/paymentService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { userService } from '../../services/userService'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { ORDER_STATUS_VARIANT, PAYMENT_STATUS_VARIANT } from '../../utils/constants'
import { useToast } from '../../components/ui/ToastContext'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import ReceiptModal from '../../components/ui/Receipt'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [ver, setVer] = useState(0)
  const [payOpen, setPayOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [receiptOpen, setReceiptOpen] = useState(false)

  const order = orderService.getById(id)
  if (!order) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Order tidak ditemukan</p>
      <button onClick={() => navigate('/orders')} className="text-blue-600 hover:underline">← Kembali</button>
    </div>
  )

  const customer = customerService.getById(order.customerId)
  const payments = paymentService.getByOrder(id)
  const createdByUser = userService.getById(order.createdBy)

  const handleAccept = () => {
    const result = orderService.acceptOrder(id)
    if (result.success) { showToast('Order diterima', 'success'); setVer(v => v + 1) }
    else showToast(result.error, 'error')
  }

  const handlePay = () => {
    const amount = Number(payAmount)
    const result = paymentService.createPayment(id, amount)
    if (result.success) {
      const msg = result.stockDeducted ? 'Pembayaran berhasil, stok dikurangi' : 'Pembayaran berhasil'
      showToast(msg, 'success')
      setPayOpen(false)
      setPayAmount('')
      setVer(v => v + 1)
    } else {
      showToast(result.error, 'error')
    }
  }

  const isPending = order.status === 'PENDING'
  const canPay = (order.status === 'ACCEPTED' || order.paymentStatus === 'PARTIAL') && order.paymentStatus !== 'PAID'

  // Check insufficient stock for pending orders
  const insufficientItems = isPending ? order.items.map(item => {
    const p = productService.getById(item.productId)
    return { ...item, available: p?.stock ?? 0 }
  }).filter(i => i.quantity > i.available) : []

  return (
    <div className="space-y-6">
      <PageHeader title={`Order ${order.id}`}>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('/orders')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium"><ArrowLeft size={16} /> Kembali</button>
          <button onClick={() => setReceiptOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium"><Printer size={16} /> Cetak Struk</button>
          {isPending && <button onClick={handleAccept} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"><CheckCircle size={16} /> Terima Order</button>}
          {canPay && <button onClick={() => { setPayAmount(''); setPayOpen(true) }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><CreditCard size={16} /> Tambah Pembayaran</button>}
        </div>
      </PageHeader>

      <div className="flex gap-2 flex-wrap">
        <Badge variant={ORDER_STATUS_VARIANT[order.status]}>{order.status}</Badge>
        <Badge variant={PAYMENT_STATUS_VARIANT[order.paymentStatus]}>{order.paymentStatus}</Badge>
      </div>

      {isPending && insufficientItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-800 font-medium text-sm mb-2"><AlertTriangle size={16} /> Stok tidak mencukupi untuk beberapa item:</div>
          {insufficientItems.map(i => (
            <p key={i.productId} className="text-sm text-amber-700 ml-6">• {i.productName}: diminta {i.quantity}, tersedia {i.available}</p>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3 text-sm">
          <h3 className="font-semibold text-gray-900">Informasi Order</h3>
          <div className="grid grid-cols-2 gap-2">
            <p className="text-gray-500">Pelanggan</p><p className="font-medium">{order.customerName}</p>
            {customer && <><p className="text-gray-500">Telepon</p><p>{customer.phone}</p></>}
            {customer && <><p className="text-gray-500">Alamat</p><p>{customer.address}</p></>}
            <p className="text-gray-500">Tanggal</p><p>{formatDateTime(order.createdAt)}</p>
            <p className="text-gray-500">Dibuat oleh</p><p>{createdByUser?.name ?? '-'}</p>
            {order.completedAt && <><p className="text-gray-500">Selesai</p><p>{formatDateTime(order.completedAt)}</p></>}
            {order.completedBy && <><p className="text-gray-500">Oleh</p><p>{userService.getById(order.completedBy)?.name ?? '-'}</p></>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3 text-sm">
          <h3 className="font-semibold text-gray-900">Ringkasan Pembayaran</h3>
          <div className="grid grid-cols-2 gap-2">
            <p className="text-gray-500">Subtotal</p><p className="text-right">{formatCurrency(order.subtotal)}</p>
            <p className="text-gray-500">Diskon</p><p className="text-right">{formatCurrency(order.discount)}</p>
            <p className="text-gray-500 font-semibold">Total</p><p className="text-right font-bold">{formatCurrency(order.total)}</p>
            <p className="text-gray-500">Dibayar</p><p className="text-right text-green-600">{formatCurrency(order.paidAmount)}</p>
            <p className="text-gray-500">Sisa</p><p className="text-right text-red-600 font-semibold">{formatCurrency(order.remainingAmount)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Item Pesanan</h3>
        <Table headers={[{ key: 'product', label: 'Produk' }, { key: 'qty', label: 'Qty', className: 'text-right' }, { key: 'price', label: 'Harga', className: 'text-right' }, { key: 'subtotal', label: 'Subtotal', className: 'text-right' }]}>
          {order.items.map(i => (
            <tr key={i.productId}>
              <td className="px-4 py-2.5 text-sm">{i.productName}</td>
              <td className="px-4 py-2.5 text-sm text-right">{i.quantity}</td>
              <td className="px-4 py-2.5 text-sm text-right">{formatCurrency(i.price)}</td>
              <td className="px-4 py-2.5 text-sm text-right font-medium">{formatCurrency(i.subtotal)}</td>
            </tr>
          ))}
        </Table>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Riwayat Pembayaran</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Belum ada pembayaran</p>
        ) : (
          <Table headers={[{ key: 'id', label: 'ID' }, { key: 'date', label: 'Tanggal' }, { key: 'amount', label: 'Jumlah', className: 'text-right' }, { key: 'method', label: 'Metode' }, { key: 'user', label: 'Kasir' }]}>
            {payments.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 text-sm font-mono">{p.id}</td>
                <td className="px-4 py-2.5 text-sm">{formatDateTime(p.createdAt)}</td>
                <td className="px-4 py-2.5 text-sm text-right font-medium text-green-600">{formatCurrency(p.amount)}</td>
                <td className="px-4 py-2.5 text-sm">{p.method}</td>
                <td className="px-4 py-2.5 text-sm">{userService.getById(p.createdBy)?.name ?? '-'}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      <Modal isOpen={payOpen} onClose={() => setPayOpen(false)} title="Tambah Pembayaran" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Sisa tagihan: <span className="font-bold text-gray-900">{formatCurrency(order.remainingAmount)}</span></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Pembayaran</label>
            <input type="number" min="1" max={order.remainingAmount} value={payAmount} onChange={e => setPayAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPayAmount(String(order.remainingAmount))} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">Lunasi</button>
            <button type="button" onClick={() => setPayAmount(String(Math.ceil(order.remainingAmount / 2)))} className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50">50%</button>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setPayOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
            <button onClick={handlePay} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Simpan</button>
          </div>
        </div>
      </Modal>

      <ReceiptModal isOpen={receiptOpen} order={order} onClose={() => setReceiptOpen(false)} />
    </div>
  )
}
