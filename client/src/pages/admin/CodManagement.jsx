import { useEffect, useState } from "react";
import { Copy, Check, KeyRound } from "lucide-react";
import codService from "../../services/codService";

const CodManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await codService.getAdminCodOrders();

      setOrders(response.orders || []);
    } catch (error) {
      console.error("Load COD orders error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load COD orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-10 text-sm text-white/50">
        Loading COD orders...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/30">
          Payments
        </p>

        <h1 className="mt-2 text-2xl font-medium">
          COD Management
        </h1>

        <p className="mt-2 text-sm text-white/40">
          Generate COD payment PINs and share them with the
          payment collector.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-white/40">
            No pending COD orders.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <CodOrderCard
              key={order._id || order.id}
              order={order}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CodOrderCard = ({ order }) => {
  const [pin, setPin] = useState(order.codPin || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generatePin = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await codService.generateCodPin(
        order._id || order.id
      );

      setPin(response.codPin);

      setMessage(
        "COD PIN generated successfully. Share this PIN with the payment collector."
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to generate PIN."
      );
    } finally {
      setLoading(false);
    }
  };

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Copy PIN error:", error);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Order Information */}
        <div>
          <p className="text-xs text-white/40">
            Order
          </p>

          <p className="mt-1 font-medium">
            {order.orderNumber}
          </p>

          <p className="mt-2 text-sm text-white/40">
            Amount: ₹
            {Number(order.amount || 0).toLocaleString("en-IN")}
          </p>
        </div>

        {/* PIN */}
        {!pin ? (
          <button
            type="button"
            onClick={generatePin}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound size={17} />

            {loading ? "Generating..." : "Generate PIN"}
          </button>
        ) : (
          <div>
            <p className="mb-2 text-xs text-white/40">
              COD PIN
            </p>

            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-black px-5 py-3 font-mono text-lg tracking-[0.25em]">
                {pin}
              </div>

              <button
                type="button"
                onClick={copyPin}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/50 transition hover:bg-white/10 hover:text-white"
                title="Copy PIN"
                aria-label="Copy COD PIN"
              >
                {copied ? (
                  <Check size={17} />
                ) : (
                  <Copy size={17} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Success Message */}
      {message && (
        <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
};

export default CodManagement;