import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProductListPage from './pages/products/ProductListPage'
import ProductFormPage from './pages/products/ProductFormPage'
import ProductDetailPage from './pages/products/ProductDetailPage'
import CustomerListPage from './pages/customers/CustomerListPage'
import CustomerFormPage from './pages/customers/CustomerFormPage'
import InventoryPage from './pages/inventory/InventoryPage'
import StockInPage from './pages/inventory/StockInPage'
import StockMovementPage from './pages/inventory/StockMovementPage'
import OrderListPage from './pages/orders/OrderListPage'
import OrderDetailPage from './pages/orders/OrderDetailPage'
import PreOrderListPage from './pages/preorders/PreOrderListPage'
import POSPage from './pages/pos/POSPage'
import PaymentListPage from './pages/payments/PaymentListPage'
import GatePage from './pages/gate/GatePage'
import ReportsPage from './pages/reports/ReportsPage'
import AuditLogPage from './pages/audit/AuditLogPage'
import UserListPage from './pages/users/UserListPage'
import { getDefaultRoute } from './utils/permissions'

function DefaultRedirect() {
  const stored = localStorage.getItem('auth_user')
  if (!stored) return <Navigate to="/login" replace />
  const user = JSON.parse(stored)
  return <Navigate to={getDefaultRoute(user.role)} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<DefaultRedirect />} />
          <Route path="/dashboard" element={<ProtectedRoute permission="dashboard"><DashboardPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute permission="products"><ProductListPage /></ProtectedRoute>} />
          <Route path="/products/new" element={<ProtectedRoute permission="products"><ProductFormPage /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProtectedRoute permission="products"><ProductDetailPage /></ProtectedRoute>} />
          <Route path="/products/:id/edit" element={<ProtectedRoute permission="products"><ProductFormPage /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute permission="customers"><CustomerListPage /></ProtectedRoute>} />
          <Route path="/customers/new" element={<ProtectedRoute permission="customers"><CustomerFormPage /></ProtectedRoute>} />
          <Route path="/customers/:id/edit" element={<ProtectedRoute permission="customers"><CustomerFormPage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute permission="inventory"><InventoryPage /></ProtectedRoute>} />
          <Route path="/inventory/stock-in" element={<ProtectedRoute permission="inventory"><StockInPage /></ProtectedRoute>} />
          <Route path="/inventory/movements" element={<ProtectedRoute permission="stockMovements"><StockMovementPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute permission="orders"><OrderListPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute permission="orders"><OrderDetailPage /></ProtectedRoute>} />
          <Route path="/preorders" element={<ProtectedRoute permission="preorders"><PreOrderListPage /></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute permission="pos"><POSPage /></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute permission="payments"><PaymentListPage /></ProtectedRoute>} />
          <Route path="/gate" element={<ProtectedRoute permission="gate"><GatePage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute permission="reports"><ReportsPage /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute permission="auditLogs"><AuditLogPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute permission="users"><UserListPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
