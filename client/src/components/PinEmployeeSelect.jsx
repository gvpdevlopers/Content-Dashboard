import CustomSelect from "./CustomSelect";
import { choosePinEmployee } from "../utils/pinAssignment";

export default function PinEmployeeSelect({ assignment, disabled = false }) {
  const { data: employees, loading, error, reload, employeeId, setEmployeeId } = assignment;
  return <div className="mb-4 space-y-2">
    <CustomSelect label="Employee responsible for collection" value={employeeId} onChange={setEmployeeId}
      disabled={disabled || loading || Boolean(error) || !employees.length}
      placeholder={loading ? "Loading employees..." : employees.length ? "Select an employee" : "No active employees"}
      options={employees.map((employee) => ({ value: String(employee._id), label: `${employee.name || employee.username} (@${employee.username})` }))} />
    {loading && <p role="status" className="text-xs text-zinc-500">Loading employees...</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error} <button type="button" onClick={() => reload()} className="underline" disabled={disabled}>Retry</button></p>}
    {!loading && !error && !employees.length && <p role="status" className="text-xs text-amber-700">Create or activate an employee account before generating a PIN.</p>}
    {!loading && !error && employees.length > 0 && !choosePinEmployee(employees) && <p className="text-xs text-zinc-500">An eligible employee named Krish could not be uniquely identified. Select the responsible employee.</p>}
    <p className="text-xs leading-5 text-zinc-500">The assigned employee can view this PIN in their workspace and share it after collection. Only the owning client can verify it, marking cash or cheque payment as Paid.</p>
  </div>;
}
