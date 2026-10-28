export const initialUserListState = { search: "", statusFilter: "all", roleFilter: "all", visibleCount: 20 };

export function userListReducer(state, { field, value }) {
  if (!["search", "statusFilter", "roleFilter", "visibleCount"].includes(field)) return state;
  const next = typeof value === "function" ? value(state[field]) : value;
  if (next === state[field]) return state;
  return { ...state, [field]: next, ...(field === "visibleCount" ? {} : { visibleCount: 20 }) };
}
