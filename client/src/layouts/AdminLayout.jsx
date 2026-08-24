import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
  Users,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() || "G";

  return (
    <div className="min-h-screen bg-[#080808] text-white">

      {/* =====================================================
          MOBILE HEADER
      ====================================================== */}

      <header
        className="
          fixed left-0 right-0 top-0 z-40
          flex h-16 items-center justify-between
          border-b border-white/10
          bg-[#080808]/85
          px-5
          backdrop-blur-xl
          lg:hidden
        "
      >
        {/* Menu */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl
            border border-white/10
            bg-white/[0.02]
            text-white/70
            transition-all duration-300
            hover:border-white/20
            hover:bg-white/[0.06]
            hover:text-white
            active:scale-95
          "
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Title */}
        <div className="text-sm font-medium tracking-tight">
          Admin Dashboard
        </div>

        {/* Avatar */}
        <div
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-full
            bg-white
            text-sm font-semibold
            text-black
            shadow-[0_5px_20px_rgba(255,255,255,0.08)]
          "
        >
          {userInitial}
        </div>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeSidebar}
          className="
            fixed inset-0 z-40
            bg-black/60
            backdrop-blur-sm
            lg:hidden
          "
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[270px] flex-col
          border-r border-white/10
          bg-[#0a0a0a]
          transition-transform duration-300
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        {/* =================================================
            SIDEBAR BRAND
        ================================================== */}

        <div
          className="
            flex h-20
            items-center justify-between
            border-b border-white/10
            px-6
          "
        >
          <div className="flex items-center gap-3">

            {/* Logo */}
            <div
              className="
                relative
                flex h-10 w-10
                shrink-0
                items-center justify-center
                overflow-hidden
                rounded-xl
                border border-white/10
                bg-white/[0.04]
                p-1
                shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                transition-all duration-500
                hover:border-cyan-300/20
                hover:shadow-[0_8px_35px_rgba(34,211,238,0.10)]
              "
            >
              <img
                src="/favicon.png"
                alt="Glow Ventures"
                className="
                  h-full
                  w-full
                  rounded-lg
                  object-cover
                  transition-transform
                  duration-500
                  hover:scale-105
                "
              />
            </div>

            {/* Brand */}
            <div>
              <p className="text-sm font-medium tracking-tight text-white">
                Glow Ventures
              </p>

              <p className="mt-0.5 text-[11px] text-white/35">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Mobile Close */}
          <button
            type="button"
            onClick={closeSidebar}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              text-white/40
              transition
              hover:bg-white/10
              hover:text-white
              lg:hidden
            "
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}

        <nav className="flex-1 px-4 py-6">

          <p
            className="
              mb-3 px-3
              text-[10px]
              font-medium
              uppercase
              tracking-[0.2em]
              text-white/30
            "
          >
            Administration
          </p>

          <div className="space-y-1">

            <AdminSidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              to="/admin"
              end
              onClick={closeSidebar}
            />

            <AdminSidebarItem
              icon={ShoppingBag}
              label="Orders"
              to="/admin/orders"
              onClick={closeSidebar}
            />

            <AdminSidebarItem
              icon={Users}
              label="Users"
              to="/admin/users"
              onClick={closeSidebar}
            />

            <AdminSidebarItem
              icon={KeyRound}
              label="COD Payments"
              to="/admin/cod"
              onClick={closeSidebar}
            />

          </div>
        </nav>

        {/* =================================================
            SIDEBAR FOOTER
        ================================================== */}

        <div className="border-t border-white/10 p-4">

          {/* User Card */}
          <div
            className="
              mb-3
              rounded-xl
              border border-white/10
              bg-white/[0.025]
              p-3
              transition
              hover:border-white/[0.15]
              hover:bg-white/[0.04]
            "
          >
            <div className="flex items-center gap-3">

              <div
                className="
                  flex h-9 w-9
                  shrink-0
                  items-center justify-center
                  rounded-full
                  bg-white
                  text-sm font-semibold
                  text-black
                "
              >
                {userInitial}
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-medium text-white">
                  {user?.name || "Glow Ventures"}
                </p>

                <p className="truncate text-xs text-white/40">
                  {user?.email ||
                    user?.username ||
                    "Administrator"}
                </p>

              </div>

            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="
              group
              flex w-full
              items-center gap-3
              rounded-xl
              px-3 py-3
              text-sm
              text-white/50
              transition-all duration-300
              hover:bg-red-500/10
              hover:text-red-300
            "
          >
            <LogOut
              size={18}
              strokeWidth={1.7}
              className="
                transition-transform
                duration-300
                group-hover:-translate-x-0.5
              "
            />

            <span>Logout</span>
          </button>

        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
      ====================================================== */}

      <div className="min-h-screen lg:pl-[270px]">

        {/* =================================================
            DESKTOP HEADER
        ================================================== */}

        <header
          className="
            hidden h-20
            items-center justify-between
            border-b border-white/10
            px-8
            lg:flex
            xl:px-10
          "
        >

          {/* Page Title */}
          <div>
            <h1 className="text-lg font-medium tracking-tight">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-xs text-white/35">
              Manage orders, users and payments
            </p>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">

            {/* <div className="text-right">
              <p className="text-sm font-medium text-white">
                {user?.name}
              </p>

              <p className="text-xs text-white/40">
                Administrator
              </p>
            </div> */}

            <div
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-full
                bg-white
                text-sm font-semibold
                text-black
                shadow-[0_5px_20px_rgba(255,255,255,0.08)]
              "
            >
              {userInitial}
            </div>

          </div>

        </header>

        {/* =================================================
            PAGE CONTENT
        ================================================== */}

        <main
          className="
            px-5
            pb-10
            pt-24
            lg:px-8
            lg:pt-8
            xl:px-10
          "
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
};

/* =========================================================
   ADMIN SIDEBAR ITEM
========================================================= */

const AdminSidebarItem = ({
  icon: Icon,
  label,
  to,
  end,
  onClick,
}) => {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `
        group
        flex items-center gap-3
        rounded-xl
        px-3 py-3
        text-sm
        transition-all duration-300
        ${
          isActive
            ? "bg-white text-black shadow-[0_8px_25px_rgba(255,255,255,0.05)]"
            : "text-white/50 hover:bg-white/[0.06] hover:text-white"
        }
        `
      }
    >
      <Icon
        size={18}
        strokeWidth={1.7}
        className="
          transition-transform
          duration-200
          group-hover:scale-105
        "
      />

      <span>{label}</span>
    </NavLink>
  );
};

export default AdminLayout;