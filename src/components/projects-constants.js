// Bucketa el progreso (0-100) en los 3 estados visuales usados en las tarjetas
// de proyecto (Proyectos activos / Proyectos empresa), con la misma paleta
// gris/azul/verde ya establecida en project-detail.jsx (STATUS_COLORS).
export const getProjectStatus = (progress) => {
  const pct = Number(progress) || 0;

  if (pct <= 25) {
    return { label: "Iniciado", ring: "#a1a1aa", chipBg: "#fafafa", chipText: "#525252", chipBorder: "#f0f0f0", statBar: "#a1a1aa" };
  }
  if (pct <= 75) {
    return { label: "En curso", ring: "#3b82f6", chipBg: "#eff6ff", chipText: "#1d4ed8", chipBorder: "#dbeafe", statBar: "#3b82f6" };
  }
  return { label: "Finalizando", ring: "#22c55e", chipBg: "#f0fdf4", chipText: "#15803d", chipBorder: "#dcfce7", statBar: "#22c55e" };
};

const RING_RADIUS = 26;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const getRingDashOffset = (progress) => {
  const pct = Math.max(0, Math.min(100, Number(progress) || 0));
  return RING_CIRCUMFERENCE * (1 - pct / 100);
};
