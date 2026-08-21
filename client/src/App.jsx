import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import CodManagement from "./pages/admin/CodManagement";

const App = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected Client Area */}
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

      <Route
  path="/admin/cod"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <CodManagement />
    </ProtectedRoute>
  }
/>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
