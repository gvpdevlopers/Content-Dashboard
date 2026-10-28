export function choosePinEmployee(employees, current = "") {
  if (employees.some((employee) => String(employee._id) === current)) return current;
  const matches = employees.filter((employee) => String(employee.name || "").trim().toLowerCase() === "krish");
  return matches.length === 1 ? String(matches[0]._id) : "";
}
