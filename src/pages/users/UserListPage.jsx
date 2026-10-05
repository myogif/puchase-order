import { userService } from '../../services/userService'
import { ROLE_PERMISSIONS } from '../../utils/permissions'
import { ROLE_LABELS, ROLE_VARIANTS } from '../../utils/constants'
import PageHeader from '../../components/ui/PageHeader'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'

const PERMISSION_LABELS = {
  dashboard: 'Dashboard', orders: 'Pesanan', preorders: 'Pre-Order', pos: 'POS',
  gate: 'Gate Monitor', products: 'Produk', customers: 'Pelanggan', inventory: 'Inventori',
  stockMovements: 'Pergerakan Stok', payments: 'Pembayaran', reports: 'Laporan',
  auditLogs: 'Audit Log', users: 'Pengguna',
}

export default function UserListPage() {
  const users = userService.getAll()

  return (
    <div className="space-y-6">
      <PageHeader title="Pengguna" subtitle={`${users.length} pengguna`} />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        Manajemen pengguna bersifat read-only pada versi MVP ini.
      </div>

      <Table headers={[{ key: 'name', label: 'Nama' }, { key: 'username', label: 'Username' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' }, { key: 'perms', label: 'Akses Menu' }]}>
        {users.map(u => (
          <tr key={u.id} className="hover:bg-gray-50">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">{u.name.charAt(0)}</div>
                <span className="text-sm font-medium text-gray-900">{u.name}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-sm font-mono text-gray-600">{u.username}</td>
            <td className="px-4 py-3"><Badge variant={ROLE_VARIANTS[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
            <td className="px-4 py-3"><Badge variant="success">Aktif</Badge></td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {(ROLE_PERMISSIONS[u.role] || []).map(p => (
                  <span key={p} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{PERMISSION_LABELS[p] || p}</span>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
