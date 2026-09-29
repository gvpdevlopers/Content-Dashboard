import { useEffect, useMemo, useState } from "react";

import { ArrowRight, ClipboardList, Loader2, Package } from "lucide-react";

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

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || 0) -
          new Date(a.createdAt || a.updatedAt || 0),
      )
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="mx-auto w-full max-w-[1500px]">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <header className="mb-7">
        <p
          className="
            text-xs
            font-medium
            uppercase
            tracking-[0.18em]
            text-zinc-400
          "
        >
          Employee workspace
        </p>

        <h1
          className="
            mt-1
            text-3xl
            font-medium
            tracking-tight
            text-zinc-900
          "
        >
          Orders
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Review and process customer orders.
        </p>
      </header>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <p
          className="
            mb-5
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-4
            text-sm
            text-red-700
          "
        >
          {error}
        </p>
      )}

      {/* =====================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="animate-spin text-zinc-400" size={22} />
        </div>
      ) : (
        <>
          {/* =================================================
              METRICS
          ================================================== */}

          <div className="grid gap-4 sm:grid-cols-3">
            <EmployeeMetric label="Active orders" value={counts.active} />

            <EmployeeMetric
              label="Awaiting delivery"
              value={counts.awaitingDelivery}
            />

            <EmployeeMetric label="Completed" value={counts.completed} />
          </div>

          {/* =================================================
              RECENT ORDERS
          ================================================== */}

          <section
            className="
              mt-6
              rounded-2xl
              border
              border-zinc-200
              bg-white
              p-5
              sm:p-6
            "
          >
            {/* Section Header */}

            <div
              className="
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-[0.16em]
                    text-zinc-400
                  "
                >
                  Recent activity
                </p>

                <h2
                  className="
                    mt-1
                    text-lg
                    font-medium
                    text-zinc-900
                  "
                >
                  Recent Orders
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Latest customer orders that need attention.
                </p>
              </div>

              {/* View All */}

              <Link
                to="/staff/orders"
                className="
                  inline-flex
                  h-10
                  shrink-0
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-zinc-200
                  bg-white
                  px-4
                  text-sm
                  font-medium
                  text-zinc-700
                  transition-all
                  duration-200
                  hover:border-zinc-300
                  hover:bg-zinc-50
                  hover:text-zinc-900
                  active:scale-[0.98]
                "
              >
                <ClipboardList size={16} className="text-zinc-500" />

                <span>View all</span>

                <ArrowRight size={15} className="text-zinc-400" />
              </Link>
            </div>

            {/* Recent Orders List */}

            {recentOrders.length > 0 ? (
              <div
                className="
                  mt-5
                  overflow-hidden
                  rounded-xl
                  border
                  border-zinc-100
                "
              >
                {recentOrders.map((order) => (
                  <Link
                    key={order._id}
                    to={`/staff/orders/${order._id}`}
                    className="
                      group
                      flex
                      min-w-0
                      flex-col
                      gap-3
                      border-b
                      border-zinc-100
                      p-4
                      transition
                      duration-200
                      last:border-b-0
                      hover:bg-zinc-50
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "
                  >
                    {/* Order / Client */}

                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-zinc-100
                          text-zinc-500
                        "
                      >
                        <Package size={17} />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            truncate
                            text-sm
                            font-semibold
                            text-zinc-900
                          "
                        >
                          {order.orderNumber || "Order"}
                        </p>

                        <p
                          className="
                            mt-0.5
                            truncate
                            text-xs
                            text-zinc-500
                          "
                        >
                          {order.client?.name ||
                            order.client?.username ||
                            order.client?.email ||
                            "Client"}
                        </p>
                      </div>
                    </div>

                    {/* Amount / Status / Arrow */}

                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        sm:justify-end
                      "
                    >
                      <div className="text-left sm:text-right">
                        <p
                          className="
                            text-sm
                            font-medium
                            text-zinc-900
                          "
                        >
                          ₹{Number(order.amount || 0).toLocaleString("en-IN")}
                        </p>

                        <span
                          className="
                            mt-1
                            inline-flex
                            rounded-full
                            bg-zinc-100
                            px-2.5
                            py-1
                            text-[11px]
                            font-medium
                            capitalize
                            text-zinc-600
                          "
                        >
                          {String(order.orderStatus || "pending").replace(
                            /_/g,
                            " ",
                          )}
                        </span>
                      </div>

                      <ArrowRight
                        size={16}
                        className="
                          shrink-0
                          text-zinc-300
                          transition
                          duration-200
                          group-hover:translate-x-0.5
                          group-hover:text-zinc-600
                        "
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty State */

              <div
                className="
                  mt-5
                  rounded-xl
                  border
                  border-dashed
                  border-zinc-200
                  bg-zinc-50
                  px-5
                  py-10
                  text-center
                "
              >
                <Package size={22} className="mx-auto text-zinc-400" />

                <p
                  className="
                    mt-3
                    text-sm
                    font-medium
                    text-zinc-700
                  "
                >
                  No recent orders
                </p>

                <p className="mt-1 text-xs text-zinc-400">
                  New customer orders will appear here.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

/* =========================================================
   EMPLOYEE METRIC
========================================================= */

const EmployeeMetric = ({ label, value }) => (
  <div
    className="
      rounded-2xl
      border
      border-zinc-200
      bg-white
      p-5
      transition
      duration-200
      hover:border-zinc-300
      hover:shadow-sm
    "
  >
    <p
      className="
        text-xs
        font-medium
        uppercase
        tracking-wide
        text-zinc-400
      "
    >
      {label}
    </p>

    <p
      className="
        mt-2
        text-3xl
        font-semibold
        text-zinc-900
      "
    >
      {value}
    </p>
  </div>
);

export default EmployeeDashboard;
