import { useEffect } from "react";

export function notifyOrderStatusChange() {
  window.dispatchEvent(new Event("orders:status-changed"));
  try { localStorage.setItem("orders:status-changed", String(Date.now())); } catch { /* Storage can be disabled. */ }
}

// Read-only views refresh across tabs and staff/client sessions. Editor drafts
// are deliberately excluded so background reads cannot erase unsaved changes.
export default function useOrderStatusRefresh(reload) {
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") reload(true); };
    const storage = event => { if (event.key === "orders:status-changed") refresh(); };
    const interval = setInterval(refresh, 30000);
    window.addEventListener("orders:status-changed", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", storage);
    return () => {
      clearInterval(interval);
      window.removeEventListener("orders:status-changed", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", storage);
    };
  }, [reload]);
}
