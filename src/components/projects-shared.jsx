/* eslint-disable react/prop-types */
// Piezas visuales compartidas entre Proyectos activos (active-projects.jsx) y
// Proyectos empresa (freelance-projects.jsx): son casi la misma tarjeta, así
// que el anillo de progreso, el badge de estado y la fila de KPIs viven acá
// para que ambas vistas no diverjan con el tiempo.
import { getProjectStatus, getRingDashOffset, RING_CIRCUMFERENCE } from "@components/projects-constants.js";

export function ProgressRing({ progress, size = 60 }) {
  const pct = Math.round(Number(progress) || 0);
  const status = getProjectStatus(progress);
  const offset = getRingDashOffset(progress);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="26" fill="none" stroke="#f2f2f2" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke={status.ring}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={offset}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold text-neutral-950">
        {pct}%
      </div>
    </div>
  );
}

export function StatusBadge({ progress }) {
  const status = getProjectStatus(progress);
  return (
    <span
      className="self-start text-[11px] font-bold px-2.5 py-[3px] rounded-full"
      style={{ background: status.chipBg, color: status.chipText, border: `1px solid ${status.chipBorder}` }}
    >
      {status.label}
    </span>
  );
}

export function ProjectsStatsRow({ projects }) {
  const total = projects.length;
  const starting = projects.filter((p) => (Number(p.progress) || 0) <= 25).length;
  const inProgress = projects.filter((p) => {
    const pct = Number(p.progress) || 0;
    return pct > 25 && pct <= 75;
  }).length;
  const finishing = projects.filter((p) => (Number(p.progress) || 0) > 75).length;

  const tiles = [
    { value: total, label: "Proyectos", bar: "#171717" },
    { value: starting, label: "Iniciados", bar: "#a1a1aa" },
    { value: inProgress, label: "En curso", bar: "#3b82f6" },
    { value: finishing, label: "Finalizando", bar: "#22c55e" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white px-[18px] py-4"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: tile.bar }} />
          <div className="text-[26px] font-extrabold tracking-tight text-neutral-950">{tile.value}</div>
          <div className="text-[11.5px] font-semibold uppercase tracking-wide text-neutral-400 mt-0.5">
            {tile.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tile con icono usado en el header de ambas vistas (folder para Activos,
// briefcase para Empresa) — el icono se pasa como children.
export function PageHeaderIcon({ children }) {
  return (
    <div className="w-11 h-11 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0">
      {children}
    </div>
  );
}
