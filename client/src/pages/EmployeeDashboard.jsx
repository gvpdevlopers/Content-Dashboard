import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import adminOrderService from "../services/adminOrderService";

const EmployeeDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await adminOrderService.getAdminOrders(true);
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (loadError) {
        console.error("Load employee dashboard error:", loadError);
        setError(
          loadError.response?.data?.message ||
            "Unable to load order dashboard.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const counts = useMemo(
    () => ({
      active: orders.filter((order) =>
        ["pending", "processing", "in_progress"].includes(order.orderStatus),
      ).length,
      awaitingDelivery: orders.filter(
        (order) => order.orderStatus === "completed" && !order.deliveryLink,
      ).length,
      completed: orders.filter((order) => order.orderStatus === "completed")
        .length,
    }),
    [orders],
  );

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
          Employee workspace
        </p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight text-zinc-900">
          Orders
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Review and process customer orders.
        </p>
      </header>

      {error && (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <EmployeeMetric label="Active orders" value={counts.active} />
            <EmployeeMetric
              label="Awaiting delivery"
              value={counts.awaitingDelivery}
            />
            <EmployeeMetric label="Completed" value={counts.completed} />
          </div>

          <Link
            to="/staff/orders"
            className="mt-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:shadow-sm"
          >
            <span className="flex items-center gap-3">
              <ClipboardList size={18} className="text-zinc-500" />
              View and manage all orders
            </span>
            <span className="text-zinc-400">{orders.length}</span>
          </Link>
        </>
      )}
    </div>
  );
};

const EmployeeMetric = ({ label, value }) => (
  <div className="rounded-2xl border border-zinc-200 bg-white p-5">
    <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
      {label}
    </p>
    <p className="mt-2 text-3xl font-semibold text-zinc-900">{value}</p>
  </div>
);

export default EmployeeDashboard;
