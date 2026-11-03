import { useState } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "./ConfirmDialog";
import adminOrderService from "../services/adminOrderService";

export default function OrderArchiveAction({ order, user, onUpdated }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user?.role !== "admin") return null;
  const archived = Boolean(order.archivedAt);
  const reference = order.orderNumber || order._id;
  const protectedOrder = ["paid", "collected", "processing"].includes(order.paymentStatus) ||
    ["processing", "in_progress", "completed"].includes(order.orderStatus) || order.codPinStatus === "active" ||
  ["active", "in_progress", "completed"].includes(order.serviceProgress?.status) ||
    (order.items || []).some(item => ["active", "in_progress", "completed"].includes(item.serviceProgress?.status));
  const confirm = async () => {
    if (busy) return;
    if (!archived && protectedOrder && step === 1) { setStep(2); return; }
    setBusy(true); setError("");
    try {
      const response = archived ? await adminOrderService.restoreOrder(order._id) : await adminOrderService.archiveOrder(order._id, reference, step === 2);
      setStep(0);
      toast.success(response.message);
      window.dispatchEvent(new Event("orders:archive-changed"));
      onUpdated?.();
    } catch (error) {
      if (error.response?.data?.requiresAdditionalConfirmation) setStep(2);
      setError(error.response?.data?.message || "Unable to update this order. Please try again.");
    } finally { setBusy(false); }
  };
  return <div className="relative z-[2]">
    <button type="button" className={`dashboard-action ${archived ? "dashboard-action--secondary" : "dashboard-action--destructive"}`} onClick={() => { setError(""); setStep(1); }} aria-label={`${archived ? "Restore" : "Delete"} order ${reference}`}>
      {archived ? <ArchiveRestore size={15} aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
      {archived ? "Restore" : "Delete"}
    </button>
    <ConfirmDialog open={step > 0} title={archived ? "Restore this order?" : step === 2 ? "Confirm paid or active order archive" : "Delete order from the active admin list?"}
      description={`Order ${reference} (ID: ${order._id}). ${archived ? "Restore this order to the active admin list." : step === 2 ? "Warning: this order has payment, fulfilment, or completed work to retain. Archiving does not cancel work, payments, or collection requests, and does not issue a refund. Explicitly confirm that you want to archive it." : "This moves the order to the recoverable archive. It does not permanently delete the order. Invoices, delivery links, financial records and client history are preserved."}`}
      confirmLabel={archived ? "Restore order" : step === 2 ? "Confirm and archive" : protectedOrder ? "Review additional warning" : "Move to archive"}
      destructive={!archived} loading={busy} error={error} onConfirm={confirm} onCancel={() => { if (!busy) setStep(0); }} />
  </div>;
}
