import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import ScrollToTop from "./components/ScrollToTop";

// Authentication
import Login from "./pages/Login";

// Public Layout
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/Home";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsConditions from "./pages/legal/TermsConditions";
import RefundCancellation from "./pages/legal/RefundCancellation";

// Client Pages
import Dashboard from "./pages/Dashboard";
import NewOrder from "./pages/NewOrder";
import OrderHistory from "./pages/OrderHistory";
import OrderDetails from "./pages/OrderDetails";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminCreateUser from "./pages/admin/AdminCreateUser";
import CodManagement from "./pages/admin/CodManagement";
import AdminServices from "./pages/admin/AdminServices";
import AdminCreateService from "./pages/admin/AdminCreateService";
import AdminEditService from "./pages/admin/AdminEditService";

// Route Guards
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import OrderStaffRoute from "./components/OrderStaffRoute";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import EmployeeDashboard from "./pages/EmployeeDashboard";

const App = () => {
  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" richColors closeButton />

      <Routes>
        {/* =====================================================
            PUBLIC WEBSITE
        ====================================================== */}

        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          <Route path="/terms-conditions" element={<TermsConditions />} />

          <Route path="/refund-cancellation" element={<RefundCancellation />} />
        </Route>

        {/* AUTHENTICATION */}

        <Route path="/login" element={<Login />} />

        {/* CLIENT AREA */}

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

        {/* EMPLOYEE ORDER OPERATIONS */}

        <Route
          element={
            <OrderStaffRoute>
              <AdminLayout />
            </OrderStaffRoute>
          }
        >
          <Route path="/staff" element={<EmployeeDashboard />} />
          <Route path="/staff/orders" element={<AdminOrders />} />
          <Route path="/staff/orders/:id" element={<AdminOrderDetails />} />
        </Route>

        {/* ADMIN AREA */}

        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />

          <Route path="/admin/services" element={<AdminServices />} />

          <Route path="/admin/services/new" element={<AdminCreateService />} />

          <Route path="/admin/services/:id/edit" element={<AdminEditService />} />

          <Route path="/admin/orders" element={<AdminOrders />} />

          <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />

          <Route path="/admin/users" element={<AdminUsers />} />

          <Route path="/admin/users/new" element={<AdminCreateUser />} />

          <Route path="/admin/users/:id" element={<AdminUserDetails />} />

          <Route path="/admin/cod" element={<CodManagement />} />
        </Route>

        {/* FALLBACK */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};
export default App;
