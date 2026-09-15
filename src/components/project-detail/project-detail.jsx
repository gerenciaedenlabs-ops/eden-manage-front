/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  MoreHorizontal,
  ArrowLeft,
  Eye,
  Trash2,
  Edit,
  ListChecks,
  ListTree,
  Upload,
  Search,
  LayoutGrid,
  Network,
  GitBranch,
  ExternalLink,
  Link2,
  X,
  Lock,
  Globe,
  Users,
} from "lucide-react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import axios from "axios";
import { toast } from "sonner";
import ViewProjectTask from "@components/project-detail/modal/view-project-detail.jsx";
import EditProjectTask from "@components/project-detail/modal/edit-project-detail.jsx";
import DeleteProjectTask from "@components/project-detail/modal/delete-project-detail.jsx";
import ImportTasksModal from "@components/project-detail/modal/import-tasks-modal.jsx";
import AddTaskModal from "@components/project-detail/modal/add-task-modal.jsx";
import LinkRepoModal from "@components/project-detail/modal/link-repo-modal.jsx";
import AssignDevelopersModal from "@components/project-detail/modal/assign-developers-modal.jsx";
import HierarchyView from "@components/project-detail/hierarchy-view.jsx";
import {
  column_translations,
  columns,
  STATUS,
  STATUS_COLORS,
  TASK_TAGS,
  getTagColor,
  findTaskById,
  authHeaders,
  canEditTask,
} from "@components/project-detail/task-constants.js";
import {
  MoveStatusButtons,
  DueDateBadge,
  Avatar,
  PriorityBadge,
  ModuleChip,
} from "@components/project-detail/task-shared.jsx";

const ALL = "all";

function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <CardContent
      ref={setNodeRef}
      className={`space-y-3 min-h-[80px] rounded-md transition-colors ${isOver ? "bg-accent/50" : ""}`}
    >
      {children}
    </CardContent>
  );
}

function TaskCard({ task, column, onView, onEdit, onDelete, onMove }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.id),
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const subtasksCount = task.subtasks?.length || 0;
  const subtasksDone =
    task.subtasks?.filter((s) => s.status === STATUS.COMPLETED).length || 0;
  const checklistCount = task.checklist?.length || 0;
  const checklistDone = task.checklist?.filter((i) => !!i.is_checked).length || 0;

  const tagColor = getTagColor(task.tags);
  const isDone = column === STATUS.COMPLETED;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex border rounded-lg overflow-hidden cursor-pointer hover:border-neutral-300 transition-colors touch-none bg-white ${isDone ? "opacity-80" : ""}`}
      onClick={() => onView(task)}
    >
      <div style={{ width: 4, backgroundColor: tagColor.bar }} className="shrink-0" />

      <div className="flex-1 min-w-0 p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={`text-[13.5px] font-semibold leading-snug ${isDone ? "line-through text-muted-foreground" : ""}`}
          >
            {task.title}
          </h4>

          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onView(task)}>
                  <Eye /> Ver
                </DropdownMenuItem>

                {canEditTask(task) && (
                  <>
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Edit /> Editar
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onDelete(task.id)}>
                      <Trash2 /> Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-xs text-muted-foreground truncate">{task.description}</p>

        {(task.tags || task.due_date || task.module_code || task.priority || subtasksCount > 0 || checklistCount > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {task.module_code && <ModuleChip code={task.module_code} />}
            {task.priority && <PriorityBadge priority={task.priority} />}
            {task.tags && (
              <span
                style={{ backgroundColor: tagColor.bg, color: tagColor.text }}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold"
              >
                {task.tags}
              </span>
            )}
            {task.due_date && <DueDateBadge dueDate={task.due_date} status={task.status} />}
            {subtasksCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold text-neutral-600">
                <ListTree className="w-3 h-3" />
                {subtasksDone}/{subtasksCount}
              </span>
            )}
            {checklistCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold text-neutral-600">
                <ListChecks className="w-3 h-3" />
                {checklistDone}/{checklistCount}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar name={task.assigned_to} size={20} />
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {task.assigned_to || "Sin asignar"}
            </span>
          </div>

          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            <MoveStatusButtons status={column} onMove={(status) => onMove(task.id, status)} />
          </div>
        </div>

        {task.created_by_name && (
          <div className="flex items-center gap-1.5 min-w-0">
            <Avatar name={task.created_by_name} size={16} />
            <span className="text-[10px] text-muted-foreground truncate">
              Creado por {task.created_by_name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetail({
  urlApi,
  project,
  onBack,
  collaborators,
  isAdmin,
  initialTaskId,
  onInitialTaskHandled,
}) {
  const userIsAdmin = useMemo(() => {
    if (typeof isAdmin === "boolean") return isAdmin;
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user) return false;
      const role = user.role ?? user.role_id;
      const dept = user.department ?? user.department_id;
      return (
        role == 4 ||
        dept == 2 ||
        String(role).toLowerCase() === "admin" ||
        String(role).toLowerCase() === "administradores" ||
        String(dept).toLowerCase() === "ti" ||
        String(dept).toLowerCase() === "ti admin"
      );
    } catch {
      return false;
    }
  }, [isAdmin]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCollaborator, setFilterCollaborator] = useState(ALL);
  const [filterTag, setFilterTag] = useState(ALL);
  const [filterModule, setFilterModule] = useState(ALL);
  const [filterPriority, setFilterPriority] = useState(ALL);
  const [filterRelease, setFilterRelease] = useState(ALL);
  const [viewMode, setViewMode] = useState("kanban");

  const [openViewModal, setOpenViewModal] = useState(false);
  const [infoViewModal, setInfoViewModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [infoEditModal, setInfoEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [infoDeleteModal, setInfoDeleteModal] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openLinkRepoModal, setOpenLinkRepoModal] = useState(false);
  const [openAssignDevsModal, setOpenAssignDevsModal] = useState(false);

  const [tasks, setTasks] = useState({
    pending: [],
    inProgress: [],
    completed: [],
  });

  const [repositories, setRepositories] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const getProjectDetails = async () => {
    try {
      const response = await axios.get(
        `${urlApi}project/partners/${project.id}`,
        {
          headers: authHeaders(),
        },
      );

      const organized = {
        pending: [],
        inProgress: [],
        completed: [],
      };

      response.data.data.forEach((task) => {
        if (organized[task.status]) {
          organized[task.status].push(task);
        }
      });

      setTasks(organized);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getProjectDetails();
  }, [urlApi, project.id]);

  const getProjectRepositories = async () => {
    try {
      const response = await axios.get(`${urlApi}project/${project.id}/repositories`, {
        headers: authHeaders(),
      });
      if (response.data.status === "ok") setRepositories(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getProjectRepositories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlApi, project.id]);

  const handleUnlinkRepo = (repo) => {
    if (!window.confirm(`¿Desvincular "${repo.repo_full_name}" de este proyecto? (no se elimina en GitHub)`)) return;

    toast.promise(
      axios
        .delete(`${urlApi}project/${project.id}/repositories/${repo.id}`, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            getProjectRepositories();
            return "Repositorio desvinculado";
          }
          throw new Error(response.data.message || "Error al desvincular");
        }),
      {
        loading: "Desvinculando...",
        success: (msg) => msg,
        error: (err) => err.response?.data?.message || err.message || "Error en la solicitud",
      }
    );
  };

  const onMoveTask = async (idTask, statusTask) => {
    const moveIn = { status: statusTask };

    toast.promise(
      axios
        .put(`${urlApi}task/state/${idTask}`, moveIn, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            getProjectDetails();
            return "Tarea movida con éxito";
          } else {
            throw new Error("Error al mover la tarea");
          }
        }),
      {
        loading: "Moviendo tarea...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud",
      },
    );
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const newStatus = String(over.id);
    const task = findTaskById(tasks, taskId);

    if (!task || task.status === newStatus) return;
    onMoveTask(taskId, newStatus);
  };

  // El listado del tablero trae la descripción truncada (para no bajar cientos
  // de KB en cada carga); si la tarea o alguna de sus subtareas viene truncada,
  // se trae el detalle completo aparte y se mezcla en el estado al abrir el modal.
  const mergeTaskDetail = (prevTasks, detail) => {
    const updateList = (list) =>
      list.map((t) => {
        if (t.id === detail.id) {
          return {
            ...t,
            description: detail.description,
            description_truncated: false,
            business_rules: detail.business_rules,
            ux_notes: detail.ux_notes,
            dependencies_raw: detail.dependencies_raw,
            acceptance_criteria: detail.acceptance_criteria,
            subtasks: (t.subtasks || []).map((s) => {
              const full = detail.subtasks?.find((fs) => fs.id === s.id);
              return full ? { ...s, description: full.description, description_truncated: false } : s;
            }),
          };
        }
        if (t.subtasks?.some((s) => s.id === detail.id)) {
          return {
            ...t,
            subtasks: t.subtasks.map((s) =>
              s.id === detail.id ? { ...s, description: detail.description, description_truncated: false } : s
            ),
          };
        }
        return t;
      });

    return {
      pending: updateList(prevTasks.pending),
      inProgress: updateList(prevTasks.inProgress),
      completed: updateList(prevTasks.completed),
    };
  };

  const handleViewTask = (task) => {
    setOpenViewModal(true);
    setInfoViewModal(task);

    // Las historias importadas del catálogo ERP nunca traen sus criterios de
    // aceptación (ni reglas de negocio/notas UX) en el listado liviano del
    // tablero, así que siempre se completan al abrir el detalle.
    const needsDetail =
      task.description_truncated ||
      task.subtasks?.some((s) => s.description_truncated) ||
      !!task.external_code;

    if (needsDetail) {
      axios
        .get(`${urlApi}task/${task.id}`, { headers: authHeaders() })
        .then((response) => {
          if (response.data.status === "ok") {
            setTasks((prev) => mergeTaskDetail(prev, response.data.data));
          }
        })
        .catch((error) => console.error(error));
    }
  };

  // Al llegar desde una notificación (click en "Se te asignó la tarea..."),
  // Dashboard deja el id de la tarea raíz pendiente; en cuanto el tablero
  // termina de cargar se abre su modal de detalle automáticamente.
  useEffect(() => {
    if (!initialTaskId) return;

    const found = findTaskById(tasks, initialTaskId);
    if (found) {
      handleViewTask(found);
      onInitialTaskHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, initialTaskId]);

  const handleEditTask = (task) => {
    setOpenEditModal(true);
    setInfoEditModal(task);
  };

  const handleDeleteTask = (taskId) => {
    setOpenDeleteModal(true);
    setInfoDeleteModal(taskId);
  };

  // La tarjeta del modal debe reflejar siempre el estado más reciente de `tasks`
  // (por ejemplo tras togglear un item del checklist dentro del propio modal).
  const liveViewInfo =
    (infoViewModal && findTaskById(tasks, infoViewModal.id)) || infoViewModal;

  const allTags = useMemo(() => {
    // Muestra siempre el catálogo completo (los mismos tags seleccionables al
    // crear una tarea), más cualquier tag "legacy" ya presente en datos
    // importados/antiguos que no esté en el catálogo, para no perder cobertura.
    const legacyTags = new Set();
    columns.forEach((col) =>
      tasks[col].forEach((t) => {
        if (t.tags && !TASK_TAGS.includes(t.tags)) legacyTags.add(t.tags);
      }),
    );
    return [...TASK_TAGS, ...Array.from(legacyTags).sort()];
  }, [tasks]);

  // Solo hay datos de catálogo ERP (módulo/prioridad/release) si el proyecto
  // tuvo al menos un import desde ese formato — en cualquier otro proyecto
  // estas listas quedan vacías y sus filtros/el toggle de vista no aparecen.
  const allModules = useMemo(() => {
    const byCode = new Map();
    columns.forEach((col) =>
      tasks[col].forEach((t) => {
        if (t.module_code && !byCode.has(t.module_code)) byCode.set(t.module_code, t.module_name);
      }),
    );
    return Array.from(byCode.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [tasks]);

  const allReleases = useMemo(() => {
    const set = new Set();
    columns.forEach((col) => tasks[col].forEach((t) => t.release_tag && set.add(t.release_tag)));
    return Array.from(set).sort();
  }, [tasks]);

  const hasErpData = allModules.length > 0;

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const collaboratorFilter =
      filterCollaborator !== ALL
        ? collaborators.find((c) => String(c.id) === filterCollaborator)
        : null;

    const result = { pending: [], inProgress: [], completed: [] };

    columns.forEach((col) => {
      result[col] = tasks[col].filter((task) => {
        if (
          query &&
          !task.title.toLowerCase().includes(query) &&
          !task.description.toLowerCase().includes(query)
        ) {
          return false;
        }
        if (collaboratorFilter && task.assigned_to !== collaboratorFilter.name) {
          return false;
        }
        if (filterTag !== ALL && task.tags !== filterTag) {
          return false;
        }
        if (filterModule !== ALL && task.module_code !== filterModule) {
          return false;
        }
        if (filterPriority !== ALL && task.priority !== filterPriority) {
          return false;
        }
        if (filterRelease !== ALL && task.release_tag !== filterRelease) {
          return false;
        }
        return true;
      });
    });

    return result;
  }, [tasks, searchQuery, filterCollaborator, filterTag, filterModule, filterPriority, filterRelease, collaborators]);

  const projectProgress = useMemo(() => {
    const total = columns.reduce((sum, col) => sum + tasks[col].length, 0);
    const completed = tasks.completed.length;
    return { total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Volver
        </Button>
        <h1 className="text-3xl font-bold">{project?.title}</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {repositories.map((repo) => (
          <span
            key={repo.id}
            className="group inline-flex items-center gap-1.5 rounded-full border bg-neutral-50 pl-3 pr-1.5 py-1 text-xs font-medium text-neutral-700"
          >
            <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
            <a
              href={repo.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {repo.repo_full_name}
            </a>
            {repo.is_private ? (
              <Lock className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Globe className="w-3 h-3 text-muted-foreground" />
            )}
            <a
              href={repo.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              title="Abrir en GitHub"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            {userIsAdmin && (
              <button
                type="button"
                onClick={() => handleUnlinkRepo(repo)}
                className="rounded-full p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-neutral-200 hover:text-foreground"
                title="Desvincular"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {userIsAdmin && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setOpenLinkRepoModal(true)}
            >
              <Link2 className="w-3.5 h-3.5 mr-1" />
              {repositories.length === 0 ? "Vincular repositorio" : "Vincular otro"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setOpenAssignDevsModal(true)}
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              Desarrolladores con acceso
            </Button>
          </>
        )}
      </div>

      {projectProgress.total > 0 && (
        <div className="border rounded-lg p-5 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Progreso del proyecto
            </span>
            <span className="text-xs text-muted-foreground">
              <span className="text-foreground font-bold">
                {projectProgress.completed} / {projectProgress.total}
              </span>{" "}
              tareas completadas &middot;{" "}
              <span className="text-foreground font-bold">{projectProgress.pct}%</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {columns.map((col) => {
              const c = STATUS_COLORS[col];
              return (
                <div
                  key={col}
                  style={{ backgroundColor: c.bg, borderColor: c.border }}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3"
                >
                  <span
                    style={{ backgroundColor: c.bar }}
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                  />
                  <div className="flex flex-col leading-tight">
                    <span style={{ color: c.text }} className="text-xl font-extrabold">
                      {tasks[col].length}
                    </span>
                    <span style={{ color: c.text }} className="text-xs">
                      {column_translations[col]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all"
              style={{ width: `${projectProgress.pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={filterCollaborator} onValueChange={setFilterCollaborator}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Colaborador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los colaboradores</SelectItem>
            {collaborators.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los tags</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasErpData && (
          <>
            <Select value={filterModule} onValueChange={setFilterModule}>
              <SelectTrigger className="sm:w-44">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los módulos</SelectItem>
                {allModules.map((m) => (
                  <SelectItem key={m.code} value={m.code}>
                    {m.code} · {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="sm:w-36">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Toda prioridad</SelectItem>
                <SelectItem value="Must">Must</SelectItem>
                <SelectItem value="Should">Should</SelectItem>
                <SelectItem value="Could">Could</SelectItem>
              </SelectContent>
            </Select>

            {allReleases.length > 0 && (
              <Select value={filterRelease} onValueChange={setFilterRelease}>
                <SelectTrigger className="sm:w-32">
                  <SelectValue placeholder="Release" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todo release</SelectItem>
                  {allReleases.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex rounded-md border p-0.5">
              <Button
                type="button"
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode("kanban")}
                title="Vista Kanban"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "hierarchy" ? "default" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode("hierarchy")}
                title="Vista jerárquica (Módulo › Épica › Historia)"
              >
                <Network className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {userIsAdmin && (
          <>
            <Button variant="outline" onClick={() => setOpenImportModal(true)} className="whitespace-nowrap">
              <Upload className="w-4 h-4 mr-2" />
              Importar desde Excel
            </Button>
            <Button onClick={() => setOpenAddModal(true)} className="whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Agregar tarea
            </Button>
          </>
        )}
      </div>

      {viewMode === "hierarchy" ? (
        <HierarchyView tasks={filteredTasks} onView={handleViewTask} />
      ) : (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-5 md:grid-cols-3 items-start">
          {columns.map((column) => {
            const c = STATUS_COLORS[column];
            return (
              <Card key={column} className="overflow-hidden p-0">
                <div style={{ backgroundColor: c.bar }} className="h-1" />
                <CardHeader
                  style={{ backgroundColor: c.bg, borderColor: c.border }}
                  className="flex flex-row items-center justify-between space-y-0 border-b py-3.5"
                >
                  <CardTitle style={{ color: c.text }} className="text-sm font-bold">
                    {column_translations[column]}
                  </CardTitle>
                  <span
                    style={{ backgroundColor: c.chip, color: c.chipText }}
                    className="text-xs font-bold rounded-full px-2.5 py-0.5"
                  >
                    {filteredTasks[column].length}
                  </span>
                </CardHeader>

                <DroppableColumn id={column}>
                  {filteredTasks[column].map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      column={column}
                      onView={handleViewTask}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteTask}
                      onMove={onMoveTask}
                    />
                  ))}
                </DroppableColumn>
              </Card>
            );
          })}
        </div>
      </DndContext>
      )}

      <ViewProjectTask
        isOpen={openViewModal}
        onClose={() => setOpenViewModal(false)}
        info={liveViewInfo}
        urlApi={urlApi}
        collaborators={collaborators}
        onMoveTask={onMoveTask}
        refresh={getProjectDetails}
        isAdmin={userIsAdmin}
      />

      <EditProjectTask
        isOpen={openEditModal}
        onClose={() => setOpenEditModal(false)}
        info={infoEditModal}
        urlApi={urlApi}
        collaborators={collaborators}
        refresh={getProjectDetails}
      />

      <DeleteProjectTask
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        info={infoDeleteModal}
        urlApi={urlApi}
        refresh={getProjectDetails}
      />

      <ImportTasksModal
        isOpen={openImportModal}
        onClose={() => setOpenImportModal(false)}
        urlApi={urlApi}
        projectId={project.id}
        collaborators={collaborators}
        refresh={getProjectDetails}
      />

      <AddTaskModal
        isOpen={openAddModal}
        onClose={() => setOpenAddModal(false)}
        urlApi={urlApi}
        projectId={project.id}
        collaborators={collaborators}
        refresh={getProjectDetails}
      />

      <LinkRepoModal
        isOpen={openLinkRepoModal}
        onClose={() => setOpenLinkRepoModal(false)}
        urlApi={urlApi}
        projectId={project.id}
        refresh={getProjectRepositories}
      />

      <AssignDevelopersModal
        isOpen={openAssignDevsModal}
        onClose={() => setOpenAssignDevsModal(false)}
        urlApi={urlApi}
        projectId={project.id}
        collaborators={collaborators}
      />
    </div>
  );
}
