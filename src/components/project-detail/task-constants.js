// Constantes y helpers puros (sin JSX) del modelo de tareas, compartidos entre
// el kanban (project-detail.jsx) y el modal de detalle (modal/view-project-detail.jsx).
// Separado de task-shared.jsx a propósito: mezclar constantes con componentes en
// un mismo archivo rompe React Fast Refresh (deja closures viejos tras un hot-reload).

export const column_translations = {
  pending: "Pendiente",
  inProgress: "En progreso",
  completed: "Completado",
};

export const columns = ["pending", "inProgress", "completed"];

export const STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "inProgress",
  COMPLETED: "completed",
};

// Catálogo fijo de tags para tareas/subtareas, seleccionable (no texto libre) para
// evitar variantes duplicadas ("frontend"/"Frontend"/"FE") en el mismo proyecto.
export const TASK_TAGS = [
  "Frontend",
  "Backend",
  "Base de datos",
  "Despliegue/DevOps",
  "QA/Testing",
  "Diseño/UI-UX",
  "Documentación",
  "Seguridad",
  "General",
];

// Sentinel para "sin tag" en los Select (Radix no permite SelectItem value="").
export const NO_TAG = "__no_tag__";

// Color fijo por tag (barra lateral + badge), consistente en todo el kanban/modal.
// La clave se normaliza (minúsculas) para que tags legacy del import ("frontend",
// "FE") también resuelvan a un color en vez de caer siempre en el default gris.
const TAG_COLOR_MAP = {
  frontend: { bar: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  fe: { bar: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  backend: { bar: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  be: { bar: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  "base de datos": { bar: "#14b8a6", bg: "#f0fdfa", text: "#0f766e" },
  "despliegue/devops": { bar: "#f97316", bg: "#fff7ed", text: "#c2410c" },
  "qa/testing": { bar: "#ec4899", bg: "#fdf2f8", text: "#be185d" },
  qa: { bar: "#ec4899", bg: "#fdf2f8", text: "#be185d" },
  "diseño/ui-ux": { bar: "#d946ef", bg: "#fdf4ff", text: "#a21caf" },
  documentación: { bar: "#eab308", bg: "#fefce8", text: "#a16207" },
  seguridad: { bar: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
  general: { bar: "#64748b", bg: "#f8fafc", text: "#475569" },
};

const TAG_COLOR_DEFAULT = { bar: "#a3a3a3", bg: "#f5f5f5", text: "#525252" };

export const getTagColor = (tag) => {
  if (!tag) return TAG_COLOR_DEFAULT;
  return TAG_COLOR_MAP[tag.trim().toLowerCase()] || TAG_COLOR_DEFAULT;
};

// Acento de color por columna/estado, usado en el header y la barra superior de cada columna.
export const STATUS_COLORS = {
  [STATUS.PENDING]: { bar: "#a1a1aa", bg: "#fafafa", border: "#f0f0f0", text: "#0a0a0a", chip: "#e5e5e5", chipText: "#525252" },
  [STATUS.IN_PROGRESS]: { bar: "#3b82f6", bg: "#eff6ff", border: "#dbeafe", text: "#1d4ed8", chip: "#dbeafe", chipText: "#1d4ed8" },
  [STATUS.COMPLETED]: { bar: "#22c55e", bg: "#f0fdf4", border: "#dcfce7", text: "#15803d", chip: "#dcfce7", chipText: "#15803d" },
};

// Paleta rotativa para los avatares de colaborador (no depende del tag).
const AVATAR_PALETTE = [
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#fce7f3", text: "#be185d" },
  { bg: "#fef3c7", text: "#a16207" },
  { bg: "#dcfce7", text: "#15803d" },
  { bg: "#ede9fe", text: "#6d28d9" },
  { bg: "#ffedd5", text: "#c2410c" },
];

export const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
};

export const getAvatarColor = (name) => {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

// Busca una tarea de nivel raíz por id dentro del estado organizado por columnas.
export const findTaskById = (tasksState, id) => {
  if (id == null) return null;
  for (const column of columns) {
    const found = tasksState[column]?.find((t) => t.id === id);
    if (found) return found;
  }
  return null;
};

// El backend devuelve due_date como datetime ISO ("2026-08-20T05:00:00.000Z");
// nos quedamos solo con la parte de fecha para comparar por día, sin líos de zona horaria.
const toDateOnly = (dueDate) => {
  const datePart = String(dueDate).slice(0, 10);
  return new Date(`${datePart}T00:00:00`);
};

// 'overdue' si ya venció y la tarea no está completada, 'soon' si vence en <= 2 días, null si no aplica alerta.
export const getDueDateStatus = (dueDate, status) => {
  if (!dueDate || status === STATUS.COMPLETED) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((toDateOnly(dueDate) - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return null;
};

export const formatDueDate = (dueDate) =>
  toDateOnly(dueDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
