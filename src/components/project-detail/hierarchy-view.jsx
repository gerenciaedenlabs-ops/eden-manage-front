/* eslint-disable react/prop-types */
// Vista jerárquica Módulo › Épica › Historia de Usuario, alternativa al
// Kanban para proyectos que importaron el catálogo ERP (ver
// import-tasks-modal.jsx / manager.controller.js#import-erp-catalog). Solo
// agrupa y muestra lo que ya viene en `tasks` (mismo estado que alimenta el
// Kanban, ya filtrado) — no hace fetch propio ni duda del padre.
import { useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  columns,
  column_translations,
  STATUS_COLORS,
} from "@components/project-detail/task-constants.js";
import { PriorityBadge } from "@components/project-detail/task-shared.jsx";

const NO_MODULE = "__no_module__";
const NO_EPIC = "__no_epic__";

// Arma Módulo -> Épica -> [historias], preservando orden alfabético por
// código de módulo (los "sin módulo" van al final) y por nombre de épica.
const buildTree = (tasks) => {
  const all = columns.flatMap((col) => tasks[col]);
  const modules = new Map();

  all.forEach((task) => {
    const moduleKey = task.module_code || NO_MODULE;
    if (!modules.has(moduleKey)) {
      modules.set(moduleKey, {
        code: task.module_code || null,
        name: task.module_name || null,
        epics: new Map(),
      });
    }
    const module_ = modules.get(moduleKey);

    const epicKey = task.epic_name || NO_EPIC;
    if (!module_.epics.has(epicKey)) {
      module_.epics.set(epicKey, { name: task.epic_name || null, tasks: [] });
    }
    module_.epics.get(epicKey).tasks.push(task);
  });

  return Array.from(modules.entries())
    .sort(([a], [b]) => {
      if (a === NO_MODULE) return 1;
      if (b === NO_MODULE) return -1;
      return a.localeCompare(b);
    })
    .map(([key, module_]) => ({
      key,
      ...module_,
      epics: Array.from(module_.epics.entries())
        .sort(([a], [b]) => {
          if (a === NO_EPIC) return 1;
          if (b === NO_EPIC) return -1;
          return a.localeCompare(b);
        })
        .map(([epicKey, epic]) => ({ key: epicKey, ...epic })),
    }));
};

function StatusChip({ status }) {
  const c = STATUS_COLORS[status];
  if (!c) return null;
  return (
    <span
      style={{ backgroundColor: c.chip, color: c.chipText }}
      className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
    >
      {column_translations[status] || status}
    </span>
  );
}

function StoryRow({ task, onView }) {
  return (
    <button
      type="button"
      onClick={() => onView(task)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted/60"
    >
      {task.external_code && (
        <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">{task.external_code}</span>
      )}
      <span className="min-w-0 flex-1 truncate">{task.title}</span>
      <PriorityBadge priority={task.priority} />
      {task.story_points != null && (
        <span className="shrink-0 text-[10.5px] text-muted-foreground">{task.story_points} pts</span>
      )}
      <StatusChip status={task.status} />
    </button>
  );
}

function EpicGroup({ epic, onView }) {
  const [open, setOpen] = useState(true);
  const done = epic.tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="border-t first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs font-semibold text-neutral-700 hover:bg-muted/40"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">{epic.name || "Sin épica"}</span>
        <span className="ml-auto shrink-0 text-[10.5px] font-normal text-muted-foreground">
          {done}/{epic.tasks.length}
        </span>
      </button>

      {open && (
        <div className="space-y-0.5 pb-2 pl-6 pr-2">
          {epic.tasks.map((task) => (
            <StoryRow key={task.id} task={task} onView={onView} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleGroup({ module: mod, onView }) {
  const [open, setOpen] = useState(true);
  const total = mod.epics.reduce((sum, e) => sum + e.tasks.length, 0);
  const done = mod.epics.reduce((sum, e) => sum + e.tasks.filter((t) => t.status === "completed").length, 0);

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 bg-neutral-50 px-3 py-2.5 text-left hover:bg-neutral-100"
      >
        {open ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
        {mod.code && (
          <span className="shrink-0 rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-neutral-600">
            {mod.code}
          </span>
        )}
        <span className="truncate text-sm font-bold">{mod.name || "Sin módulo"}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {done}/{total} historias
        </span>
      </button>

      {open && <div>{mod.epics.map((epic) => <EpicGroup key={epic.key} epic={epic} onView={onView} />)}</div>}
    </div>
  );
}

export default function HierarchyView({ tasks, onView }) {
  const tree = useMemo(() => buildTree(tasks), [tasks]);

  if (tree.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No hay historias que coincidan con los filtros actuales.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {tree.map((mod) => (
        <ModuleGroup key={mod.key} module={mod} onView={onView} />
      ))}
    </div>
  );
}
