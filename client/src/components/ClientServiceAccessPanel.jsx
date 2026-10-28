import { useState } from "react";
import { toast } from "sonner";
import ServiceAccessEditor from "./ServiceAccessEditor";
import { getEditableServiceAccess } from "../utils/serviceAccess";
import adminUserService from "../services/adminUserService";

export default function ClientServiceAccessPanel({ user, onSaved }) {
  const [access, setAccess] = useState(() => getEditableServiceAccess(user.serviceAccess));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return <form className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-5" onSubmit={async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await adminUserService.updateServiceAccess(user._id, access);
      onSaved(response.user); toast.success(response.message);
    } catch (failure) { setError(failure.response?.data?.message || "Unable to save service access."); }
    finally { setSaving(false); }
  }}>
    <ServiceAccessEditor value={access} onChange={setAccess} disabled={saving} />
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button className="dashboard-action dashboard-action--primary" disabled={saving} type="submit">{saving ? "Saving..." : "Save service access"}</button>
  </form>;
}
