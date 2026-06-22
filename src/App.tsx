import { Navigate, Route, Routes } from 'react-router-dom'
import { ADMIN_BASE } from './config'
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

export default function App() {
  return (
    <Routes>
      {/* Página pública */}
      <Route path="/" element={<Catalog />} />

      {/* Panel de administración (ruta secreta, ver src/config.ts) */}
      <Route path={`${ADMIN_BASE}/login`} element={<Login />} />
      <Route path={ADMIN_BASE} element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="catalogo" element={<Products />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="ventas" element={<POS />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="maquinas" element={<Machines />} />
        <Route path="alta" element={<AddProduct />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
