// Constantes y helpers puros (sin JSX) del módulo Personal: mismo motor que
// Gerencia (gerencia-constants.js) pero con categorías propias de un
// presupuesto individual (sin Nómina, que no aplica a nivel personal).
export { authHeaders } from "@components/project-detail/task-constants.js";

export const PERSONAL_CATEGORIES = {
  ingreso: ["Salario", "Otro ingreso"],
  gasto: ["Fijo", "Variable", "Otro"],
};

const CATEGORY_COLOR_MAP = {
  salario: { bar: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
  "otro ingreso": { bar: "#14b8a6", bg: "#f0fdfa", text: "#0f766e" },
  fijo: { bar: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  variable: { bar: "#f97316", bg: "#fff7ed", text: "#c2410c" },
  otro: { bar: "#64748b", bg: "#f8fafc", text: "#475569" },
};
const CATEGORY_COLOR_DEFAULT = { bar: "#a3a3a3", bg: "#f5f5f5", text: "#525252" };

export const getCategoryColor = (category) => {
  if (!category) return CATEGORY_COLOR_DEFAULT;
  return CATEGORY_COLOR_MAP[category.trim().toLowerCase()] || CATEGORY_COLOR_DEFAULT;
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const formatDate = (dateStr) => {
  const datePart = String(dateStr).slice(0, 10);
  return new Date(`${datePart}T00:00:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Días del mes seleccionables para el débito automático del presupuesto fijo.
export const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);
