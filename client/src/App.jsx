import { Navigate, Route, Routes } from "react-router-dom";

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

// Route Guards
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

const PublicPlaceholder = ({ title }) => {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
          Glow Ventures
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--color-text-muted)]">
          This page is currently being developed.
        </p>
      </div>
    </section>
  );
};

const App = () => {
  return (
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
        <Route
          path="/refund-cancellation"
          element={<RefundCancellation />}
        />
      </Route>

      {/* =====================================================
          AUTHENTICATION
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

        <Route
          path="/dashboard/new-order"
          element={<NewOrder />}
        />

        <Route
          path="/dashboard/orders"
          element={<OrderHistory />}
        />

        <Route
          path="/dashboard/orders/:id"
          element={<OrderDetails />}
        />
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
        <Route path="/admin" element={<AdminDashboard />} />

        <Route
          path="/admin/orders"
          element={<AdminOrders />}
        />

        <Route
          path="/admin/orders/:id"
          element={<AdminOrderDetails />}
        />

        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

        <Route
          path="/admin/users/new"
          element={<AdminCreateUser />}
        />

        <Route
          path="/admin/users/:id"
          element={<AdminUserDetails />}
        />

        <Route
          path="/admin/cod"
          element={<CodManagement />}
        />
      </Route>

      {/* =====================================================
          FALLBACK
      ====================================================== */}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;