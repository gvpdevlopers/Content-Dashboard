import { useCallback, useState } from "react";
import codService from "../services/codService";
import useAsyncResource from "./useAsyncResource";
import { choosePinEmployee } from "../utils/pinAssignment";

export default function usePinAssignment(enabled = true) {
  const [employeeId, setEmployeeId] = useState("");
  const load = useCallback(async () => enabled ? (await codService.getEligibleEmployees()).employees || [] : [], [enabled]);
  const onSuccess = useCallback((employees) => setEmployeeId((current) => choosePinEmployee(employees, current)), []);
  const resource = useAsyncResource(load, { initialData: [], onSuccess, errorMessage: "Unable to load eligible employees." });
  return { ...resource, employeeId, setEmployeeId };
}
