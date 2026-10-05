import { useState, useMemo, useRef, useCallback } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, X, Search } from 'lucide-react'
import { productService } from '../../services/productService'
import { customerService } from '../../services/customerService'
import { orderService } from '../../services/orderService'
import { paymentService } from '../../services/paymentService'
import { formatCurrency } from '../../utils/format'
import { PRODUCT_CATEGORIES } from '../../utils/constants'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../components/ui/ToastContext'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import ReceiptModal from '../../components/ui/Receipt'

export default function POSPage() {
  const { showToast } = useToast()
  const barcodeRef = useRef(null)

  const [cart, setCart] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [payAmount, setPayAmount] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [ver, setVer] = useState(0)

  // Pre-order flow
  const [preOrderModal, setPreOrderModal] = useState(null)
  const [receiptOrder, setReceiptOrder] = useState(null)

  const products = productService.getAll().filter(p => p.isActive)
  const customers = customerService.getAll().filter(c => c.isActive)
  const selectedCustomer = customers.find(c => c.id === customerId)
  const q = useDebounce(productSearch).toLowerCase()

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter && p.category !== categoryFilter) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false
      return true
    })
  }, [products, q, categoryFilter, ver])

  const filteredCustomers = useMemo(() => {
    const cq = customerSearch.toLowerCase()
    if (!cq) return customers.slice(0, 10)
    return customers.filter(c => c.name.toLowerCase().includes(cq)).slice(0, 10)
  }, [customers, customerSearch])

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(c => c.productId === product.id)
      if (existing) return prev.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { productId: product.id, productName: product.name, price: product.price, quantity: 1, stock: product.stock }]
    })
  }, [])

  const updateQty = (productId, qty) => {
    if (qty < 1) return
    setCart(prev => prev.map(c => c.productId === productId ? { ...c, quantity: qty } : c))
  }

  const removeFromCart = (productId) => setCart(prev => prev.filter(c => c.productId !== productId))

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0)
  const clampedDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal)
  const grandTotal = subtotal - clampedDiscount
  const payValue = Number(payAmount) || 0
  const remaining = grandTotal - payValue

  const handleBarcode = (e) => {
    if (e.key !== 'Enter') return
    const code = barcodeInput.trim()
    if (!code) return
    const product = productService.findByBarcode(code)
    if (product && product.isActive) { addToCart(product); showToast(`${product.name} ditambahkan`, 'info') }
    else showToast('Produk tidak ditemukan', 'error')
    setBarcodeInput('')
    barcodeRef.current?.focus()
  }

  const resetAll = () => {
    setCart([]); setCustomerId(''); setCustomerSearch(''); setDiscount(0); setPayAmount(''); setVer(v => v + 1)
  }

  const handleSave = () => {
    if (!customerId) { showToast('Anda belum pilih pelanggan', 'error'); return }
    if (cart.length === 0) { showToast('Keranjang kosong', 'error'); return }

    const orderData = { customerId, items: cart.map(c => ({ productId: c.productId, quantity: c.quantity })), discount: clampedDiscount }
    const result = orderService.create(orderData)

    if (!result.success) {
      if (result.preOrderRequired) {
        setPreOrderModal({ orderData, insufficientItems: result.insufficientItems })
        return
      }
      showToast(result.error, 'error')
      return
    }

    processPaymentAndFinish(result.order)
  }

  const handlePreOrder = () => {
    if (!preOrderModal) return
    const result = orderService.create(preOrderModal.orderData, { forcePreOrder: true })
    setPreOrderModal(null)
    if (!result.success) { showToast(result.error, 'error'); return }
    showToast('Pre-order dibuat. Pembayaran dapat dilakukan setelah order diterima.', 'success')
    setReceiptOrder(orderService.getById(result.order.id))
    resetAll()
  }

  const processPaymentAndFinish = (order) => {
    if (payValue > 0) {
      const payResult = paymentService.createPayment(order.id, payValue)
      if (!payResult.success) {
        showToast(`Order tersimpan (${order.id}), tapi pembayaran gagal: ${payResult.error}`, 'error')
        setReceiptOrder(orderService.getById(order.id))
        resetAll()
        return
      }
    }
    showToast(`Order ${order.id} berhasil disimpan`, 'success')
    setReceiptOrder(orderService.getById(order.id))
    resetAll()
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)]">
      {/* Left: Product Grid */}
      <div className="flex-1 lg:w-3/5 flex flex-col min-h-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={barcodeRef} type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcode}
                placeholder="Scan barcode (Enter)..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" autoFocus />
            </div>
            <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="Cari produk..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setCategoryFilter('')} className={`px-3 py-1 text-xs rounded-full ${!categoryFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Semua</button>
            {PRODUCT_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1 text-xs rounded-full ${categoryFilter === c ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 auto-rows-min content-start">
          {filteredProducts.map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              className={`text-left bg-white rounded-lg border p-3 hover:border-blue-400 hover:shadow-sm transition-all ${p.stock === 0 ? 'opacity-50' : ''}`}>
              <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{p.sku}</p>
              <p className="text-sm font-semibold text-blue-600 mt-1">{formatCurrency(p.price)}</p>
              <div className="mt-1">
                {p.stock === 0 ? <Badge variant="danger">Habis</Badge>
                  : p.stock <= p.minimumStock ? <Badge variant="warning">Stok: {p.stock}</Badge>
                  : <span className="text-xs text-gray-500">Stok: {p.stock}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="lg:w-2/5 flex flex-col min-h-0 bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Customer */}
        <div className="p-3 border-b border-gray-200">
          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-blue-900">{selectedCustomer.name}</span>
              <button onClick={() => { setCustomerId(''); setCustomerSearch('') }} className="text-blue-500 hover:text-blue-700"><X size={16} /></button>
            </div>
          ) : (
            <div className="relative">
              <input type="text" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                onFocus={() => setIsCustomerDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                placeholder="Pilih pelanggan..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              {isCustomerDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredCustomers.length === 0 ? <p className="px-3 py-2 text-sm text-gray-500">Tidak ditemukan</p>
                    : filteredCustomers.map(c => (
                      <button key={c.id} onClick={() => { setCustomerId(c.id); setCustomerSearch(''); setIsCustomerDropdownOpen(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50">{c.name}</button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <ShoppingCart size={40} className="mx-auto mb-2" />
              <p className="text-sm">Keranjang kosong</p>
            </div>
          ) : cart.map(item => (
            <div key={item.productId} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.productName}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.price)}</p>
                {item.quantity > item.stock && <p className="text-xs text-red-500">Stok tersedia {item.stock}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-1 rounded hover:bg-gray-200"><Minus size={14} /></button>
                <input type="number" min="1" value={item.quantity} onChange={e => updateQty(item.productId, Number(e.target.value) || 1)}
                  className="w-12 text-center text-sm border border-gray-300 rounded py-0.5" />
                <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-1 rounded hover:bg-gray-200"><Plus size={14} /></button>
              </div>
              <p className="text-sm font-medium w-20 text-right">{formatCurrency(item.price * item.quantity)}</p>
              <button onClick={() => removeFromCart(item.productId)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        {/* Totals + Payment */}
        <div className="border-t border-gray-200 p-3 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Diskon</span>
              <input type="number" min="0" max={subtotal} value={discount} onChange={e => setDiscount(e.target.value)}
                className="w-28 text-right px-2 py-1 border border-gray-300 rounded text-sm" />
            </div>
            <div className="flex justify-between font-bold text-base"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pembayaran</label>
            <input type="number" min="0" value={payAmount} onChange={e => setPayAmount(e.target.value)}
              placeholder="Jumlah bayar" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setPayAmount(String(grandTotal))} className="flex-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">Bayar Penuh</button>
              <button type="button" onClick={() => setPayAmount(String(Math.ceil(grandTotal / 2)))} className="flex-1 px-2 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600">DP 50%</button>
              <button type="button" onClick={() => setPayAmount('0')} className="flex-1 px-2 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600">Tanpa Bayar</button>
            </div>
            {payValue > 0 && (
              remaining < 0
                ? <p className="text-xs text-green-600 font-medium">Kembalian: {formatCurrency(Math.abs(remaining))}</p>
                : <p className="text-xs text-gray-500">Sisa: {formatCurrency(remaining)}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={resetAll} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Reset</button>
            <button onClick={handleSave} disabled={cart.length === 0}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium">Simpan Order</button>
          </div>
        </div>
      </div>

      {/* Pre-order modal */}
      <Modal isOpen={!!preOrderModal} onClose={() => setPreOrderModal(null)} title="Stok Tidak Mencukupi" size="md">
        {preOrderModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Beberapa produk memiliki stok yang tidak mencukupi:</p>
            <div className="bg-red-50 rounded-lg p-3 space-y-1">
              {preOrderModal.insufficientItems.map(i => (
                <p key={i.productId} className="text-sm text-red-700">• {i.productName}: diminta {i.requested}, tersedia {i.available}</p>
              ))}
            </div>
            <p className="text-sm text-gray-600">Pembayaran dapat dilakukan setelah pre-order diterima.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setPreOrderModal(null)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handlePreOrder} className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium">Buat Pre-Order</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt modal */}
      <ReceiptModal isOpen={!!receiptOrder} order={receiptOrder} onClose={() => setReceiptOrder(null)} />
    </div>
  )
}
