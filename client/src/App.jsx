import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import CodManagement from "./pages/admin/CodManagement";
import AdminCreateUser from "./pages/admin/AdminCreateUser";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

const App = () => {
  return (
    <Routes>
      {/* =====================================================
          PUBLIC
      ====================================================== */}

      <Route path="/login" element={<Login />} />

      {/* =====================================================
          CLIENT AREA
      ====================================================== */}

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/dashboard/new-order" element={<NewOrder />} />

        <Route path="/dashboard/orders" element={<OrderHistory />} />

        <Route path="/dashboard/orders/:id" element={<OrderDetails />} />
      </Route>

      {/* =====================================================
          ADMIN AREA
      ====================================================== */}

      <Route
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        {/* Admin Dashboard */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Admin Orders */}
        <Route path="/admin/orders" element={<AdminOrders />} />

        {/* Admin Order Details */}
        <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />

        {/* Admin Users */}
        <Route path="/admin/users" element={<AdminUsers />} />

        <Route path="/admin/users/new" element={<AdminCreateUser />} />

        {/* Admin User Details */}
        <Route path="/admin/users/:id" element={<AdminUserDetails />} />

        {/* COD Management */}
        <Route path="/admin/cod" element={<CodManagement />} />
      </Route>

      {/* =====================================================
          FALLBACK
      ====================================================== */}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
