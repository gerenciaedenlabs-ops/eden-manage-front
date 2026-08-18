/* eslint-disable react/prop-types */
// Piezas compartidas entre el kanban (project-detail.jsx) y el modal de
// detalle de tarea (modal/view-project-detail.jsx): constantes de estado y
// las secciones interactivas de subtareas / checklist.
import { useState } from "react";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import { Checkbox } from "@components/ui/checkbox";
import { Progress } from "@components/ui/progress";
import { Calendar } from "@components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import {
  column_translations,
  STATUS,
  TASK_TAGS,
  NO_TAG,
  getDueDateStatus,
  formatDueDate,
  getTagColor,
  getInitials,
  getAvatarColor,
} from "@components/project-detail/task-constants.js";

// Avatar circular con iniciales, color consistente por nombre. "Sin asignar"
// se muestra como círculo punteado vacío en vez de badge de texto completo.
export function Avatar({ name, size = 24 }) {
  if (!name) {
    return (
      <span
        style={{ width: size, height: size }}
        className="rounded-full border border-dashed border-neutral-300 shrink-0"
        title="Sin asignar"
      />
    );
  }

  const { bg, text } = getAvatarColor(name);

  return (
    <span
      style={{ width: size, height: size, backgroundColor: bg, color: text, fontSize: size * 0.42 }}
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      title={name}
    >
      {getInitials(name)}
    </span>
  );
}

// Badge de tag con color fijo por categoría (ver task-constants.getTagColor).
export function TagBadge({ tag, className = "" }) {
  if (!tag) return null;
  const { bg, text } = getTagColor(tag);
  return (
    <span
      style={{ backgroundColor: bg, color: text }}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${className}`}
    >
      {tag}
    </span>
  );
}

// Select de tag con catálogo fijo (Frontend/Backend/BD/etc.), reutilizado en
// los forms de crear/editar tarea y subtarea.
export function TagSelect({ value, onChange, className = "" }) {
  return (
    <Select value={value || NO_TAG} onValueChange={(v) => onChange(v === NO_TAG ? "" : v)}>
      <SelectTrigger className={`h-8 text-xs ${className}`}>
        <SelectValue placeholder="Tag (opcional)" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_TAG}>Sin tag</SelectItem>
        {TASK_TAGS.map((tag) => (
          <SelectItem key={tag} value={tag}>
            {tag}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const toISODateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Selector de fecha límite (Popover + Calendar), reutilizado en los forms de tarea/subtarea.
export function DueDatePicker({ value, onChange, className = "" }) {
  const selectedDate = value ? new Date(`${String(value).slice(0, 10)}T00:00:00`) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={`h-8 text-xs justify-start font-normal ${className}`}
        >
          <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
          {value ? formatDueDate(value) : "Fecha límite (opcional)"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => onChange(date ? toISODateString(date) : null)}
          initialFocus
        />
        {value && (
          <div className="p-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => onChange(null)}
            >
              <X className="w-3 h-3 mr-1" /> Quitar fecha
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Badge de fecha límite con color de alerta (vencida / por vencer), reutilizado en cards y filas.
export function DueDateBadge({ dueDate, status }) {
  if (!dueDate) return null;

  const alert = getDueDateStatus(dueDate, status);
  const alertClass =
    alert === "overdue"
      ? "border-red-300 bg-red-50 text-red-700"
      : alert === "soon"
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : "";

  return (
    <Badge variant="outline" className={`text-xs gap-1 ${alertClass}`}>
      <CalendarIcon className="w-3 h-3" />
      {formatDueDate(dueDate)}
    </Badge>
  );
}

// Botones de mover estado, reutilizados por tareas raíz y subtareas.
export function MoveStatusButtons({ status, onMove, size = 16 }) {
  return (
    <div className="flex items-center gap-1">
      {status === STATUS.COMPLETED && (
        <>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(STATUS.PENDING)}>
            <ChevronsLeft size={size} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(STATUS.IN_PROGRESS)}>
            <ChevronLeft size={size} />
          </Button>
        </>
      )}

      {status === STATUS.IN_PROGRESS && (
        <>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(STATUS.PENDING)}>
            <ChevronLeft size={size} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(STATUS.COMPLETED)}>
            <ChevronRight size={size} />
          </Button>
        </>
      )}

      {status === STATUS.PENDING && (
        <>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(STATUS.IN_PROGRESS)}>
            <ChevronRight size={size} />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onMove(STATUS.COMPLETED)}>
            <ChevronsRight size={size} />
          </Button>
        </>
      )}
    </div>
  );
}

// Sección plegable de subtareas anidadas dentro de una tarjeta/modal de tarea.
export function SubtasksSection({ task, urlApi, collaborators, onMoveTask, refresh, isAdmin, defaultOpen = false }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigned, setAssigned] = useState("");
  const [tag, setTag] = useState("");
  const [dueDate, setDueDate] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssigned, setEditAssigned] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editDueDate, setEditDueDate] = useState(null);

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter((s) => s.status === STATUS.COMPLETED).length;

  if (subtasks.length === 0 && !isAdmin) return null;

  const startEdit = (sub) => {
    setEditingId(sub.id);
    setEditTitle(sub.title);
    setEditDescription(sub.description || "");
    setEditAssigned(sub.assigned_to || "");
    setEditTag(sub.tags || "");
    setEditDueDate(sub.due_date || null);
  };

  const handleSaveEdit = () => {
    toast.promise(
      axios
        .put(
          `${urlApi}task/${editingId}`,
          {
            title: editTitle,
            description: editDescription,
            assigned_to: editAssigned || null,
            tags: editTag || null,
            due_date: editDueDate || null,
          },
          { headers: { "Content-Type": "application/json" } }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            setEditingId(null);
            refresh();
            return "Subtarea actualizada con éxito";
          } else {
            throw new Error("Error al actualizar la subtarea");
          }
        }),
      {
        loading: "Guardando cambios...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de edición",
      }
    );
  };

  const handleDeleteSubtask = (sub) => {
    if (!window.confirm(`¿Eliminar la subtarea "${sub.title}"?`)) return;

    toast.promise(
      axios
        .delete(`${urlApi}task/${sub.id}`, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            return "Subtarea eliminada con éxito";
          } else {
            throw new Error("Error al eliminar la subtarea");
          }
        }),
      {
        loading: "Eliminando subtarea...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de eliminación",
      }
    );
  };

  const handleAddSubtask = () => {
    const payload = {
      project_id: task.project_id,
      parent_id: task.id,
      title,
      description,
      assigned_to: assigned || null,
      tags: tag || null,
      due_date: dueDate || null,
      status: STATUS.PENDING,
    };

    toast.promise(
      axios
        .post(`${urlApi}task`, payload, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            setTitle("");
            setDescription("");
            setAssigned("");
            setTag("");
            setDueDate(null);
            setShowForm(false);
            refresh();
            return "Subtarea agregada con éxito";
          } else {
            throw new Error("Error al agregar la subtarea: " + response.data.message);
          }
        }),
      {
        loading: "Guardando subtarea...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  };

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground py-1"
        >
          <span>
            Subtareas ({completedCount}/{subtasks.length})
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-2 pt-1">
        {subtasks.map((sub) =>
          editingId === sub.id ? (
            <div key={sub.id} className="border rounded-md p-2 space-y-2">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-8 text-xs"
              />
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="text-xs min-h-[60px]"
              />
              <Select value={editAssigned} onValueChange={setEditAssigned}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Colaborador (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <TagSelect value={editTag} onChange={setEditTag} className="flex-1" />
                <DueDatePicker value={editDueDate} onChange={setEditDueDate} />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  disabled={!editTitle.trim() || !editDescription.trim()}
                  onClick={handleSaveEdit}
                >
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div key={sub.id} className="border rounded-md p-2 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {sub.tags && (
                    <Badge variant="outline" className="text-[10px] shrink-0 px-1.5">
                      {sub.tags}
                    </Badge>
                  )}
                  <span className="text-xs truncate">{sub.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {column_translations[sub.status]}
                </span>
              </div>

              {sub.description && (
                <p className="text-xs text-muted-foreground">{sub.description}</p>
              )}

              {sub.due_date && (
                <DueDateBadge dueDate={sub.due_date} status={sub.status} />
              )}

              <div className="flex items-center justify-between">
                {isAdmin ? (
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => startEdit(sub)}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDeleteSubtask(sub)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ) : (
                  <span />
                )}

                <MoveStatusButtons
                  status={sub.status}
                  onMove={(status) => onMoveTask(sub.id, status)}
                  size={14}
                />
              </div>
            </div>
          )
        )}

        {isAdmin &&
          (showForm ? (
            <div className="space-y-2 border rounded-md p-2">
              <Input
                placeholder="Nombre de la subtarea"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 text-xs"
              />
              <Textarea
                placeholder="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs min-h-[60px]"
              />
              <Select value={assigned} onValueChange={setAssigned}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Colaborador (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <TagSelect value={tag} onChange={setTag} className="flex-1" />
                <DueDatePicker value={dueDate} onChange={setDueDate} />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  disabled={!title.trim() || !description.trim()}
                  onClick={handleAddSubtask}
                >
                  Agregar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-3 h-3 mr-1" /> Agregar subtarea
            </Button>
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

// Sección plegable de checklist (criterios de aceptación) de una tarea o subtarea.
export function ChecklistSection({ task, urlApi, refresh, isAdmin, defaultOpen = false }) {
  const [newLabel, setNewLabel] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingLabel, setEditingLabel] = useState("");

  const items = task.checklist || [];
  const doneCount = items.filter((i) => !!i.is_checked).length;
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  if (items.length === 0 && !isAdmin) return null;

  const handleToggle = async (item) => {
    try {
      const response = await axios.put(
        `${urlApi}checklist/${item.id}`,
        { is_checked: !item.is_checked },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data.status === "ok") refresh();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el item del checklist");
    }
  };

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditingLabel(item.label);
  };

  const handleSaveItemLabel = async () => {
    if (!editingLabel.trim()) return;

    try {
      const response = await axios.put(
        `${urlApi}checklist/${editingItemId}`,
        { label: editingLabel.trim() },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data.status === "ok") {
        setEditingItemId(null);
        refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el item del checklist");
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.label}"?`)) return;

    try {
      const response = await axios.delete(`${urlApi}checklist/${item.id}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data.status === "ok") refresh();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo eliminar el item del checklist");
    }
  };

  const handleAdd = async () => {
    if (!newLabel.trim()) return;

    try {
      const response = await axios.post(
        `${urlApi}task/${task.id}/checklist`,
        { label: newLabel.trim() },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.data.status === "ok") {
        setNewLabel("");
        refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("No se pudo agregar el item al checklist");
    }
  };

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground py-1"
        >
          <span>
            Checklist ({doneCount}/{items.length})
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-1.5 pt-1">
        {items.length > 0 && <Progress value={progress} className="h-1.5" />}

        {items.map((item) =>
          editingItemId === item.id ? (
            <div key={item.id} className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={editingLabel}
                onChange={(e) => setEditingLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveItemLabel();
                  if (e.key === "Escape") setEditingItemId(null);
                }}
                onBlur={handleSaveItemLabel}
                className="h-7 text-xs"
              />
            </div>
          ) : (
            <div key={item.id} className="flex items-center gap-2 text-xs group">
              <Checkbox
                checked={!!item.is_checked}
                onCheckedChange={() => handleToggle(item)}
              />
              <span
                className={`flex-1 cursor-pointer ${item.is_checked ? "line-through text-muted-foreground" : ""}`}
                onClick={() => isAdmin && startEditItem(item)}
              >
                {item.label}
              </span>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteItem(item)}
                >
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
          )
        )}

        {isAdmin && (
          <div className="flex gap-1.5 pt-1">
            <Input
              placeholder="Nuevo item..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              className="h-7 text-xs"
            />
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleAdd}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
