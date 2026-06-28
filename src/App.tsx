import { Navigate, Route, Routes } from 'react-router-dom'
import { ADMIN_BASE } from './config'
import Landing from './pages/Landing'
import Catalog from './pages/Catalog'
import Login from './pages/admin/Login'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import AddProduct from './pages/admin/AddProduct'
import Inventory from './pages/admin/Inventory'
import POS from './pages/admin/POS'
import Orders from './pages/admin/Orders'
import Machines from './pages/admin/Machines'
import Reports from './pages/admin/Reports'
import Restock from './pages/admin/Restock'
import Collaborators from './pages/admin/Collaborators'
import { RequirePermission } from './components/RequirePermission'

function Guard({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  return <RequirePermission routeKey={routeKey}>{children}</RequirePermission>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/tienda" element={<Catalog />} />

      <Route path={`${ADMIN_BASE}/login`} element={<Login />} />
      <Route path={ADMIN_BASE} element={<AdminLayout />}>
        <Route index element={<Guard routeKey=""><Dashboard /></Guard>} />
        <Route path="catalogo" element={<Guard routeKey="catalogo"><Products /></Guard>} />
        <Route path="inventario" element={<Guard routeKey="inventario"><Inventory /></Guard>} />
        <Route path="ventas" element={<Guard routeKey="ventas"><POS /></Guard>} />
        <Route path="pedidos" element={<Guard routeKey="pedidos"><Orders /></Guard>} />
        <Route path="maquinas" element={<Guard routeKey="maquinas"><Machines /></Guard>} />
        <Route path="reportes" element={<Guard routeKey="reportes"><Reports /></Guard>} />
        <Route path="resurtido" element={<Guard routeKey="resurtido"><Restock /></Guard>} />
        <Route path="alta" element={<Guard routeKey="alta"><AddProduct /></Guard>} />
        <Route path="colaboradores" element={<Guard routeKey="colaboradores"><Collaborators /></Guard>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
