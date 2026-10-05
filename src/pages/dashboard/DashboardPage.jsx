import { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DollarSign, ShoppingCart, Clock, ArrowDownToLine, ArrowUpFromLine, Warehouse, AlertTriangle, CreditCard, CheckCircle } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { paymentService } from '../../services/paymentService'
import { productService } from '../../services/productService'
import { stockService } from '../../services/stockService'
import { getCurrentUser } from '../../services/storageService'
import { formatCurrency, formatDateTime, isToday } from '../../utils/format'
import { ORDER_STATUS_VARIANT, PAYMENT_STATUS_VARIANT } from '../../utils/constants'
import { hasPermission } from '../../utils/permissions'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const role = user?.role

  const orders = orderService.getAll()
  const payments = paymentService.getAll()
  const products = productService.getAll().filter(p => p.isActive)
  const movements = stockService.getAll()

  const stats = useMemo(() => ({
    salesToday: payments.filter(p => isToday(p.createdAt)).reduce((s, p) => s + p.amount, 0),
    ordersToday: orders.filter(o => isToday(o.createdAt)).length,
    preOrders: orders.filter(o => o.status === 'PENDING').length,
    stockIn: movements.filter(m => m.type === 'IN' && isToday(m.createdAt)).reduce((s, m) => s + m.quantity, 0),
    stockOut: movements.filter(m => m.type === 'OUT' && isToday(m.createdAt)).reduce((s, m) => s + m.quantity, 0),
    totalStock: products.reduce((s, p) => s + p.stock, 0),
    critical: products.filter(p => p.stock <= p.minimumStock),
    unpaid: orders.filter(o => o.paymentStatus === 'UNPAID').length,
    partial: orders.filter(o => o.paymentStatus === 'PARTIAL').length,
    readyToExit: orders.filter(o => o.status === 'PAID' && o.paymentStatus === 'PAID').length,
  }), [orders, payments, products, movements])

  const recentOrders = useMemo(() => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [orders])
  const criticalProducts = stats.critical.slice(0, 5)

  const nav = (perm, path) => hasPermission(role, perm) ? () => navigate(path) : undefined

  const isManager = role === 'manager'
  const isCashier = role === 'cashier'

  return (
    <div className="space-y-6">
      <PageHeader title={`Selamat datang, ${user?.name}`} subtitle={new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />

      <div className={`grid gap-4 ${isManager ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
        <StatCard icon={DollarSign} label="Penjualan Hari Ini" value={formatCurrency(stats.salesToday)} color="green" />
        <StatCard icon={ShoppingCart} label="Order Hari Ini" value={stats.ordersToday} color="blue" />
        {isManager && <StatCard icon={Clock} label="Pre-Order" value={stats.preOrders} color="yellow" onClick={nav('preorders', '/preorders')} />}
        {isManager && <StatCard icon={ArrowDownToLine} label="Barang Masuk" value={stats.stockIn} color="blue" />}
        {isManager && <StatCard icon={ArrowUpFromLine} label="Barang Keluar" value={stats.stockOut} color="blue" />}
        {isManager && <StatCard icon={Warehouse} label="Total Stok" value={stats.totalStock} color="purple" />}
        {isManager && <StatCard icon={AlertTriangle} label="Stok Kritis" value={stats.critical.length} color="red" onClick={nav('inventory', '/inventory')} />}
        {isManager && <StatCard icon={CreditCard} label="Belum Bayar" value={stats.unpaid} color="red" onClick={nav('payments', '/payments')} />}
        {isManager && <StatCard icon={DollarSign} label="DP" value={stats.partial} color="yellow" />}
        <StatCard icon={CheckCircle} label="Siap Keluar" value={stats.readyToExit} color="green" onClick={nav('gate', '/gate')} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Order Terbaru</h3>
          {recentOrders.length === 0 ? <p className="text-sm text-gray-500">Belum ada order</p> : (
            <Table headers={[{ key: 'id', label: 'ID' }, { key: 'customer', label: 'Pelanggan' }, { key: 'total', label: 'Total', className: 'text-right' }, { key: 'pay', label: 'Bayar' }, { key: 'status', label: 'Status' }]}>
              {recentOrders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{hasPermission(role, 'orders') ? <Link to={`/orders/${o.id}`} className="text-blue-600 hover:underline font-mono">{o.id}</Link> : <span className="font-mono">{o.id}</span>}</td>
                  <td className="px-4 py-2 text-sm">{o.customerName}</td>
                  <td className="px-4 py-2 text-sm text-right">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-2"><Badge variant={PAYMENT_STATUS_VARIANT[o.paymentStatus]}>{o.paymentStatus}</Badge></td>
                  <td className="px-4 py-2"><Badge variant={ORDER_STATUS_VARIANT[o.status]}>{o.status}</Badge></td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        {isManager && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Stok Kritis</h3>
            {criticalProducts.length === 0 ? <p className="text-sm text-gray-500">Tidak ada stok kritis</p> : (
              <Table headers={[{ key: 'name', label: 'Produk' }, { key: 'stock', label: 'Stok', className: 'text-right' }, { key: 'min', label: 'Min', className: 'text-right' }]}>
                {criticalProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium">{p.name}</td>
                    <td className="px-4 py-2 text-sm text-right text-red-600 font-medium">{p.stock}</td>
                    <td className="px-4 py-2 text-sm text-right text-gray-500">{p.minimumStock}</td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
