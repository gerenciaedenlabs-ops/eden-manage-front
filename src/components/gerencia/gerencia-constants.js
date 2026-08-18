// Constantes y helpers puros (sin JSX) del módulo Gerencia: presupuesto interno
// y préstamos a colaboradores. Separado de los componentes por el mismo motivo
// que task-constants.js — mezclar rompe React Fast Refresh.

// Catálogo fijo de categorías, igual que TASK_TAGS en el módulo de Tareas.
export const GERENCIA_CATEGORIES = {
  ingreso: ["Ventas", "Otro ingreso"],
  gasto: ["Fijo", "Variable", "Nómina", "Otro"],
};

const CATEGORY_COLOR_MAP = {
  ventas: { bar: "#22c55e", bg: "#f0fdf4", text: "#15803d" },
  "otro ingreso": { bar: "#14b8a6", bg: "#f0fdfa", text: "#0f766e" },
  fijo: { bar: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  variable: { bar: "#f97316", bg: "#fff7ed", text: "#c2410c" },
  nómina: { bar: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
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

// Headers para las llamadas a /gerencia/*, que ahora requieren sesión de admin en el
// backend (authMiddleware + requireAdmin) — antes ninguna ruta pedía token.
export const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const formatMonthLabel = (monthStr) => {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
};
