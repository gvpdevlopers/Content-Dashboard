import { useEffect, useMemo, useState } from "react";

import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import adminUserService from "../../services/adminUserService";
import CustomSelect from "../../components/CustomSelect";

const USERS_PER_BATCH = 20;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const navigate = useNavigate();

  // Progressive loading
  const [visibleCount, setVisibleCount] = useState(USERS_PER_BATCH);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await adminUserService.getUsers();

      setUsers(data.users || []);

      // Reset visible users after refresh
      setVisibleCount(USERS_PER_BATCH);
    } catch (error) {
      console.error("Get admin users error:", error);

      setError(error.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /*
   * Search + filters
   *
   * Filtering happens BEFORE progressive loading so
   * search/filter always works across the complete user list.
   */
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  /*
   * Only render the currently visible batch.
   */
  const visibleUsers = useMemo(() => {
    return filteredUsers.slice(0, visibleCount);
  }, [filteredUsers, visibleCount]);

  const hasMoreUsers = visibleCount < filteredUsers.length;

  /*
   * Reset visible count whenever search/filter changes.
   */
  useEffect(() => {
    setVisibleCount(USERS_PER_BATCH);
  }, [search, statusFilter, roleFilter]);

  /*
   * Infinite / scroll-based loading.
   */
  useEffect(() => {
    if (!hasMoreUsers || loading) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;

      const threshold = document.documentElement.scrollHeight - 500;

      if (scrollPosition >= threshold) {
        setVisibleCount((current) => {
          if (current >= filteredUsers.length) {
            return current;
          }

          return Math.min(current + USERS_PER_BATCH, filteredUsers.length);
        });
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasMoreUsers, loading, filteredUsers.length]);

  const activeUsers = users.filter((user) => user.isActive).length;

  const inactiveUsers = users.filter((user) => !user.isActive).length;

  const clientUsers = users.filter((user) => user.role === "client").length;

  const adminUsers = users.filter((user) => user.role === "admin").length;

  return (
    <div className="mx-auto max-w-[1500px]">
      {/* Page Header */}
      <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.035] blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 -left-20 h-56 w-56 rounded-full bg-white/[0.02] blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  border border-white/10
                  bg-white/[0.04]
                  text-white/60
                "
              >
                <Users size={18} strokeWidth={1.6} />
              </div>

              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">
                Administration
              </p>
            </div>

            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
              Accounts
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/40 sm:text-base">
              Manage client accounts and monitor account access from one place.
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex flex-col gap-3 sm:flex-row lg:self-center">
            {/* Add User */}
            <button
              type="button"
              onClick={() => navigate("/admin/users/new")}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                px-4
                py-3
                text-sm
                font-medium
                text-black
                transition
                duration-300
                hover:bg-white/90
              "
            >
              <Plus size={16} />
              Add User
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadUsers}
              disabled={loading}
              className="
                group
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border border-white/10
                bg-white/[0.03]
                px-4
                py-3
                text-sm
                text-white/60
                transition
                duration-300
                hover:border-white/20
                hover:bg-white/[0.07]
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <RefreshCw
                size={16}
                className={`transition-transform duration-500 ${
                  loading ? "animate-spin" : "group-hover:rotate-180"
                }`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Users" value={users.length} />

        <StatCard icon={UserRound} label="Clients" value={clientUsers} />

        <StatCard icon={ShieldCheck} label="Admins" value={adminUsers} />

        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={activeUsers}
          secondary={`${inactiveUsers} inactive`}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-300">{error}</p>

          <button
            type="button"
            onClick={loadUsers}
            className="self-start text-sm text-red-200 underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 rounded-2xl border border-white/10 bg-[#111111] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={17}
              strokeWidth={1.7}
              className="
          pointer-events-none
          absolute
          left-4
          top-1/2
          z-10
          -translate-y-1/2
          text-white/30
        "
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or username..."
              className="
          h-[50px]
          w-full
          rounded-xl
          border
          border-white/10
          bg-white/[0.03]
          pl-11
          pr-4
          text-sm
          text-white
          outline-none
          transition
          placeholder:text-white/25
          focus:border-white/25
          focus:bg-white/[0.05]
        "
            />
          </div>

          {/* Status */}
          <div className="w-full lg:w-[176px] lg:shrink-0">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                {
                  value: "all",
                  label: "All Status",
                },
                {
                  value: "active",
                  label: "Active",
                },
                {
                  value: "inactive",
                  label: "Inactive",
                },
              ]}
            />
          </div>

          {/* Role */}
          <div className="w-full lg:w-[176px] lg:shrink-0">
            <CustomSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                {
                  value: "all",
                  label: "All Roles",
                },
                {
                  value: "client",
                  label: "Clients",
                },
                {
                  value: "admin",
                  label: "Admins",
                },
              ]}
            />
          </div>
        </div>

        {/* Results / Clear Filters */}
        <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4">
          <p className="text-xs text-white/35">
            Showing <span className="text-white/60">{visibleUsers.length}</span>{" "}
            of <span className="text-white/60">{filteredUsers.length}</span>{" "}
            matching users
          </p>

          {(search || statusFilter !== "all" || roleFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setRoleFilter("all");
              }}
              className="text-xs text-white/40 transition hover:text-white"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[350px] items-center justify-center rounded-[24px] border border-white/10 bg-[#111111]">
          <div className="flex items-center gap-3 text-sm text-white/40">
            <Loader2 size={18} className="animate-spin" />
            Loading users...
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyUsers
          hasFilters={Boolean(
            search || statusFilter !== "all" || roleFilter !== "all",
          )}
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-[24px] border border-white/10 bg-[#111111] md:block">
            <div className="grid grid-cols-[1.5fr_1.4fr_1fr_0.8fr_0.8fr_70px] border-b border-white/10 px-6 py-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span>Status</span>
              <span>Joined</span>
              <span />
            </div>

            <div>
              {visibleUsers.map((user) => (
                <UserTableRow
                  key={user._id}
                  user={user}
                  onStatusChange={loadUsers}
                />
              ))}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {visibleUsers.map((user) => (
              <UserMobileCard
                key={user._id}
                user={user}
                onStatusChange={loadUsers}
              />
            ))}
          </div>

          {/* Loading More */}
          {hasMoreUsers && (
            <div className="flex items-center justify-center py-10">
              <div className="flex items-center gap-3 text-sm text-white/35">
                <Loader2 size={17} className="animate-spin" />
                Loading more users...
              </div>
            </div>
          )}

          {/* All Users Loaded */}
          {!hasMoreUsers && filteredUsers.length > USERS_PER_BATCH && (
            <div className="py-8 text-center">
              <p className="text-xs text-white/25">
                Showing all {filteredUsers.length} users
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, secondary }) => {
  return (
    <div
      className="
        group
        rounded-2xl
        border border-white/10
        bg-[#111111]
        p-5
        transition duration-300
        hover:-translate-y-0.5
        hover:border-white/20
        hover:bg-[#141414]
      "
    >
      <div className="flex items-start justify-between">
        <div
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl
            border border-white/10
            bg-white/[0.03]
          "
        >
          <Icon
            size={18}
            strokeWidth={1.6}
            className="text-white/55 transition group-hover:text-white/75"
          />
        </div>

        <span className="text-2xl font-medium">{value}</span>
      </div>

      <p className="mt-5 text-sm font-medium">{label}</p>

      {secondary && <p className="mt-1 text-xs text-white/30">{secondary}</p>}
    </div>
  );
};

const UserTableRow = ({ user, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);

  const toggleStatus = async () => {
    try {
      setUpdating(true);

      await adminUserService.updateUserStatus(user._id, !user.isActive);

      await onStatusChange();
    } catch (error) {
      console.error("Update user status error:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="
        grid
        grid-cols-[1.5fr_1.4fr_1fr_0.8fr_0.8fr_70px]
        items-center
        border-b border-white/[0.07]
        px-6 py-5
        last:border-b-0
        transition
        hover:bg-white/[0.025]
      "
    >
      {/* User */}
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar user={user} />

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {user.name || "Unnamed User"}
          </p>

          <p className="mt-1 truncate text-xs text-white/30">
            @{user.username || "—"}
          </p>
        </div>
      </div>

      {/* Email */}
      <p className="truncate pr-4 text-sm text-white/55">{user.email || "—"}</p>

      {/* Role */}
      <div>
        <RoleBadge role={user.role} />
      </div>

      {/* Status */}
      <div>
        <StatusBadge isActive={user.isActive} />
      </div>

      {/* Joined */}
      <p className="text-sm text-white/45">{formatDate(user.createdAt)}</p>

      {/* Action */}
      <Link
        to={`/admin/users/${user._id}`}
        className="
          flex h-9 w-9
          items-center justify-center
          rounded-lg
          border border-white/10
          text-white/40
          transition
          hover:border-white/20
          hover:bg-white/10
          hover:text-white
        "
        aria-label={`View ${user.name || "user"}`}
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  );
};

const UserMobileCard = ({ user, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);

  const toggleStatus = async () => {
    try {
      setUpdating(true);

      await adminUserService.updateUserStatus(user._id, !user.isActive);

      await onStatusChange();
    } catch (error) {
      console.error("Update user status error:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="
        rounded-2xl
        border border-white/10
        bg-[#111111]
        p-5
        transition
        hover:border-white/20
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={user} />

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {user.name || "Unnamed User"}
            </p>

            <p className="mt-1 truncate text-xs text-white/35">
              {user.email || "—"}
            </p>
          </div>
        </div>

        <StatusBadge isActive={user.isActive} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Username
          </p>

          <p className="mt-1 truncate text-sm text-white/65">
            @{user.username || "—"}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Role
          </p>

          <div className="mt-1">
            <RoleBadge role={user.role} />
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Joined
          </p>

          <p className="mt-1 text-sm text-white/60">
            {formatDate(user.createdAt)}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/30">
            Account
          </p>

          <p className="mt-1 text-sm text-white/60">
            {user.isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Link
          to={`/admin/users/${user._id}`}
          className="
            flex flex-1
            items-center justify-center
            gap-2
            rounded-xl
            border border-white/10
            py-3
            text-sm text-white/65
            transition
            hover:bg-white/[0.05]
            hover:text-white
          "
        >
          View User
          <ChevronRight size={16} />
        </Link>

        {user.role !== "admin" && (
          <button
            type="button"
            onClick={toggleStatus}
            disabled={updating}
            className="
              flex items-center justify-center
              rounded-xl
              border border-white/10
              px-4
              text-sm text-white/50
              transition
              hover:bg-white/[0.05]
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {updating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : user.isActive ? (
              "Disable"
            ) : (
              "Enable"
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const UserAvatar = ({ user }) => {
  const initial = user.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div
      className="
        flex h-10 w-10
        shrink-0
        items-center justify-center
        rounded-xl
        border border-white/10
        bg-white/[0.05]
        text-sm font-semibold
        text-white/70
      "
    >
      {initial}
    </div>
  );
};

const StatusBadge = ({ isActive }) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        border
        px-2.5 py-1
        text-[11px]
        font-medium
        ${
          isActive
            ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
            : "border-red-400/20 bg-red-400/[0.08] text-red-300"
        }
      `}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-400" : "bg-red-400"
        }`}
      />

      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const RoleBadge = ({ role }) => {
  const isAdmin = role === "admin";

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        border
        px-2.5 py-1
        text-[11px]
        font-medium
        ${
          isAdmin
            ? "border-purple-400/20 bg-purple-400/[0.08] text-purple-300"
            : "border-white/10 bg-white/[0.04] text-white/55"
        }
      `}
    >
      {isAdmin && <ShieldCheck size={12} strokeWidth={1.7} />}

      {isAdmin ? "Admin" : "Client"}
    </span>
  );
};

const EmptyUsers = ({ hasFilters }) => {
  return (
    <div
      className="
        flex min-h-[350px]
        flex-col items-center justify-center
        rounded-[24px]
        border border-white/10
        bg-[#111111]
        px-6
        text-center
      "
    >
      <div
        className="
          flex h-14 w-14
          items-center justify-center
          rounded-full
          border border-white/10
          bg-white/[0.03]
        "
      >
        <Users size={22} className="text-white/40" />
      </div>

      <h2 className="mt-5 text-lg font-medium">
        {hasFilters ? "No users found" : "No users yet"}
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Registered users will appear here."}
      </p>
    </div>
  );
};

const formatDate = (date) => {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default AdminUsers;
