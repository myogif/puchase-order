import { useState, useMemo } from 'react'
import { orderService } from '../../services/orderService'
import { paymentService } from '../../services/paymentService'
import { stockService } from '../../services/stockService'
import { formatCurrency, toDateKey, todayKey, inDateRange } from '../../utils/format'
import { DollarSign, ShoppingCart, Package, TrendingUp } from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'
import Table from '../../components/ui/Table'

export default function ReportsPage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const [dateFrom, setDateFrom] = useState(sevenDaysAgo)
  const [dateTo, setDateTo] = useState(todayKey())

  const orders = orderService.getAll()
  const payments = paymentService.getAll()
  const movements = stockService.getAll()

  const rangeOrders = useMemo(() => orders.filter(o => o.status !== 'PENDING' && inDateRange(o.createdAt, dateFrom, dateTo)), [orders, dateFrom, dateTo])
  const rangePayments = useMemo(() => payments.filter(p => inDateRange(p.createdAt, dateFrom, dateTo)), [payments, dateFrom, dateTo])
  const rangeOutMovements = useMemo(() => movements.filter(m => m.type === 'OUT' && inDateRange(m.createdAt, dateFrom, dateTo)), [movements, dateFrom, dateTo])

  const summary = useMemo(() => ({
    totalSales: rangePayments.reduce((s, p) => s + p.amount, 0),
    orderCount: rangeOrders.length,
    avgOrder: rangeOrders.length > 0 ? Math.round(rangeOrders.reduce((s, o) => s + o.total, 0) / rangeOrders.length) : 0,
    itemsSold: rangeOutMovements.reduce((s, m) => s + m.quantity, 0),
  }), [rangeOrders, rangePayments, rangeOutMovements])

  // Daily sales
  const dailySales = useMemo(() => {
    const map = new Map()
    rangePayments.forEach(p => {
      const key = toDateKey(p.createdAt)
      map.set(key, (map.get(key) || 0) + p.amount)
    })
    const dailyOrders = new Map()
    rangeOrders.forEach(o => {
      const key = toDateKey(o.createdAt)
      dailyOrders.set(key, (dailyOrders.get(key) || 0) + 1)
    })
    const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    const maxVal = Math.max(...entries.map(([, v]) => v), 1)
    return entries.map(([date, amount]) => ({ date, amount, orders: dailyOrders.get(date) || 0, pct: (amount / maxVal) * 100 }))
  }, [rangePayments, rangeOrders])

  const totalDailySales = dailySales.reduce((s, d) => s + d.amount, 0)

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map()
    rangeOrders.forEach(o => {
      o.items.forEach(i => {
        const cur = map.get(i.productId) || { name: i.productName, qty: 0, revenue: 0 }
        cur.qty += i.quantity; cur.revenue += i.subtotal
        map.set(i.productId, cur)
      })
    })
    return [...map.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.qty - a.qty).slice(0, 10)
  }, [rangeOrders])

  // Top customers
  const topCustomers = useMemo(() => {
    const map = new Map()
    rangeOrders.forEach(o => {
      const cur = map.get(o.customerId) || { name: o.customerName, count: 0, total: 0, paid: 0 }
      cur.count++; cur.total += o.total; cur.paid += o.paidAmount
      map.set(o.customerId, cur)
    })
    return [...map.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total).slice(0, 10)
  }, [rangeOrders])

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan" subtitle="Ringkasan penjualan dan performa">
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <span className="text-gray-400">-</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Penjualan" value={formatCurrency(summary.totalSales)} color="green" />
        <StatCard icon={ShoppingCart} label="Jumlah Order" value={summary.orderCount} color="blue" />
        <StatCard icon={TrendingUp} label="Rata-rata Order" value={formatCurrency(summary.avgOrder)} color="purple" />
        <StatCard icon={Package} label="Item Terjual" value={summary.itemsSold} color="blue" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Penjualan Harian</h3>
        {dailySales.length === 0 ? <p className="text-sm text-gray-500">Tidak ada data</p> : (
          <Table headers={[{ key: 'date', label: 'Tanggal' }, { key: 'orders', label: 'Order', className: 'text-right' }, { key: 'amount', label: 'Penjualan', className: 'text-right' }, { key: 'bar', label: '' }]}>
            {dailySales.map(d => (
              <tr key={d.date}>
                <td className="px-4 py-2.5 text-sm text-gray-900">{d.date}</td>
                <td className="px-4 py-2.5 text-sm text-right">{d.orders}</td>
                <td className="px-4 py-2.5 text-sm text-right font-medium">{formatCurrency(d.amount)}</td>
                <td className="px-4 py-2.5 w-40"><div className="bg-blue-100 rounded-full h-4"><div className="bg-blue-500 rounded-full h-4 transition-all" style={{ width: `${d.pct}%` }} /></div></td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2.5 text-sm">Total</td>
              <td className="px-4 py-2.5 text-sm text-right">{dailySales.reduce((s, d) => s + d.orders, 0)}</td>
              <td className="px-4 py-2.5 text-sm text-right">{formatCurrency(totalDailySales)}</td>
              <td />
            </tr>
          </Table>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Produk Terlaris</h3>
          <Table headers={[{ key: 'name', label: 'Produk' }, { key: 'qty', label: 'Qty', className: 'text-right' }, { key: 'rev', label: 'Pendapatan', className: 'text-right' }]}>
            {topProducts.map(p => (
              <tr key={p.id}><td className="px-4 py-2 text-sm">{p.name}</td><td className="px-4 py-2 text-sm text-right">{p.qty}</td><td className="px-4 py-2 text-sm text-right">{formatCurrency(p.revenue)}</td></tr>
            ))}
          </Table>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Pelanggan Teratas</h3>
          <Table headers={[{ key: 'name', label: 'Pelanggan' }, { key: 'count', label: 'Order', className: 'text-right' }, { key: 'total', label: 'Total', className: 'text-right' }, { key: 'paid', label: 'Dibayar', className: 'text-right' }]}>
            {topCustomers.map(c => (
              <tr key={c.id}><td className="px-4 py-2 text-sm">{c.name}</td><td className="px-4 py-2 text-sm text-right">{c.count}</td><td className="px-4 py-2 text-sm text-right">{formatCurrency(c.total)}</td><td className="px-4 py-2 text-sm text-right text-green-600">{formatCurrency(c.paid)}</td></tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  )
}
