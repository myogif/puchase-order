import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Clock, Monitor, Package,
  Users, ClipboardList, DollarSign, LogOut, BarChart3,
  FileText, Shield, Menu, X, Warehouse, ArrowRightLeft
} from 'lucide-react'
import { hasPermission } from '../../utils/permissions'
import Badge from '../ui/Badge'
import { useAuth } from '../../hooks/useAuth'
import { ROLE_LABELS, ROLE_VARIANTS } from '../../utils/constants'

const MENU_SECTIONS = [
  {
    label: 'UTAMA',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    ]
  },
  {
    label: 'TRANSAKSI',
    items: [
      { path: '/pos', label: 'Point of Sale', icon: ShoppingCart, permission: 'pos' },
      { path: '/orders', label: 'Pesanan', icon: ClipboardList, permission: 'orders' },
      { path: '/preorders', label: 'Pre-Order', icon: Clock, permission: 'preorders' },
      { path: '/payments', label: 'Pembayaran', icon: DollarSign, permission: 'payments' },
    ]
  },
  {
    label: 'OPERASI',
    items: [
      { path: '/gate', label: 'Gate Monitor', icon: Monitor, permission: 'gate' },
      { path: '/inventory', label: 'Inventori', icon: Warehouse, permission: 'inventory', end: true },
      { path: '/inventory/stock-in', label: 'Barang Masuk', icon: Package, permission: 'inventory' },
      { path: '/inventory/movements', label: 'Pergerakan Stok', icon: ArrowRightLeft, permission: 'stockMovements' },
    ]
  },
  {
    label: 'MASTER',
    items: [
      { path: '/products', label: 'Produk', icon: Package, permission: 'products' },
      { path: '/customers', label: 'Pelanggan', icon: Users, permission: 'customers' },
    ]
  },
  {
    label: 'LAPORAN',
    items: [
      { path: '/reports', label: 'Laporan', icon: BarChart3, permission: 'reports' },
      { path: '/audit-logs', label: 'Audit Log', icon: FileText, permission: 'auditLogs' },
    ]
  },
  {
    label: 'SISTEM',
    items: [
      { path: '/users', label: 'Pengguna', icon: Shield, permission: 'users' },
    ]
  },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const filteredSections = MENU_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => hasPermission(user?.role, item.permission))
  })).filter(section => section.items.length > 0)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Roti Distributor</h1>
          <p className="text-xs text-gray-400">Management System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredSections.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <Badge variant={ROLE_VARIANTS[user?.role] || 'neutral'}>
              {ROLE_LABELS[user?.role] || user?.role}
            </Badge>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-gray-800 shrink-0">
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">{user?.name}</span>
            <Badge variant={ROLE_VARIANTS[user?.role] || 'neutral'}>
              {ROLE_LABELS[user?.role] || user?.role}
            </Badge>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
