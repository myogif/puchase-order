import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Package } from 'lucide-react'
import { productService, getStockStatus } from '../../services/productService'
import { stockService } from '../../services/stockService'
import { userService } from '../../services/userService'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { usePermission } from '../../hooks/usePermission'
import PageHeader from '../../components/ui/PageHeader'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'

const STATUS_MAP = { SAFE: { label: 'SAFE', v: 'success' }, LOW_STOCK: { label: 'LOW STOCK', v: 'warning' }, OUT_OF_STOCK: { label: 'OUT OF STOCK', v: 'danger' } }

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const canOrders = usePermission('orders')
  const product = productService.getById(id)

  if (!product) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Produk tidak ditemukan</p>
      <button onClick={() => navigate('/products')} className="text-blue-600 hover:underline">← Kembali</button>
    </div>
  )

  const st = STATUS_MAP[getStockStatus(product)]
  const movements = stockService.getByProduct(id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-6">
      <PageHeader title={product.name} subtitle={product.sku}>
        <div className="flex gap-2">
          <button onClick={() => navigate('/products')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium"><ArrowLeft size={16} /> Kembali</button>
          <button onClick={() => navigate(`/products/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"><Pencil size={16} /> Edit</button>
        </div>
      </PageHeader>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex gap-6 flex-wrap">
          <div className="shrink-0">
            {product.image ? (
              <img src={product.image} alt="" className="w-32 h-32 rounded-lg object-cover border" />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={40} className="text-gray-300" /></div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-sm flex-1">
            <div><p className="text-gray-500">SKU</p><p className="font-medium">{product.sku}</p></div>
            <div><p className="text-gray-500">Barcode</p><p className="font-medium font-mono">{product.barcode}</p></div>
            <div><p className="text-gray-500">Kategori</p><p className="font-medium">{product.category}</p></div>
            <div><p className="text-gray-500">Harga</p><p className="font-medium">{formatCurrency(product.price)}</p></div>
            <div><p className="text-gray-500">Stok</p><p className={`font-medium ${product.stock <= product.minimumStock ? 'text-red-600' : ''}`}>{product.stock}</p></div>
            <div><p className="text-gray-500">Min. Stok</p><p className="font-medium">{product.minimumStock}</p></div>
            <div><p className="text-gray-500">Status Stok</p><Badge variant={st.v}>{st.label}</Badge></div>
            <div><p className="text-gray-500">Status</p><Badge variant={product.isActive ? 'success' : 'neutral'}>{product.isActive ? 'Aktif' : 'Nonaktif'}</Badge></div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Riwayat Pergerakan Stok</h3>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada pergerakan stok</p>
        ) : (
          <Table headers={[{ key: 'date', label: 'Tanggal' }, { key: 'type', label: 'Tipe' }, { key: 'qty', label: 'Jumlah', className: 'text-right' }, { key: 'ref', label: 'Referensi' }, { key: 'user', label: 'User' }, { key: 'note', label: 'Catatan' }]}>
            {movements.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5 text-sm text-gray-600">{formatDateTime(m.createdAt)}</td>
                <td className="px-4 py-2.5"><Badge variant={m.type === 'IN' ? 'success' : 'danger'}>{m.type}</Badge></td>
                <td className={`px-4 py-2.5 text-sm text-right font-medium ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'IN' ? '+' : '-'}{m.quantity}</td>
                <td className="px-4 py-2.5 text-sm">
                  {m.referenceType === 'ORDER' && m.referenceId ? (
                    canOrders ? <Link to={`/orders/${m.referenceId}`} className="text-blue-600 hover:underline">{m.referenceId}</Link> : <span>{m.referenceId}</span>
                  ) : 'STOCK_IN'}
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{userService.getById(m.createdBy)?.name ?? '-'}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{m.note || '-'}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  )
}
