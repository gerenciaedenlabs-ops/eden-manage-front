/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { Pencil } from "lucide-react";
import {
  column_translations,
  authHeaders,
  canEditTask,
} from "@components/project-detail/task-constants.js";
import {
  MoveStatusButtons,
  SubtasksSection,
  ChecklistSection,
  DueDatePicker,
  DueDateBadge,
  TagSelect,
} from "@components/project-detail/task-shared.jsx";

export default function ViewProjectTask({
  isOpen,
  onClose,
  info,
  urlApi,
  collaborators,
  onMoveTask,
  refresh,
  isAdmin,
}) {
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaTag, setMetaTag] = useState("");
  const [metaDueDate, setMetaDueDate] = useState(null);

  useEffect(() => {
    if (info) {
      setMetaTag(info.tags || "");
      setMetaDueDate(info.due_date || null);
    }
    setEditingMeta(false);
  }, [info?.id]);

  if (!info) return null;

  const handleSaveMeta = () => {
    toast.promise(
      axios
        .put(
          `${urlApi}task/${info.id}`,
          {
            title: info.title,
            description: info.description,
            assigned_to: info.assigned_to || null,
            tags: metaTag || null,
            due_date: metaDueDate || null,
          },
          { headers: authHeaders() }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            setEditingMeta(false);
            refresh();
            return "Tarea actualizada con éxito";
          } else {
            throw new Error("Error al actualizar la tarea");
          }
        }),
      {
        loading: "Guardando cambios...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de edición",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Detalle de la tarea"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(520px, 90vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          margin: "auto",
          borderRadius: "8px",
          padding: "32px",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        },
      }}
    >
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{info.title}</h2>
          <Badge variant="secondary" className="shrink-0">
            {column_translations[info.status] || info.status}
          </Badge>
        </div>

        {editingMeta ? (
          <div className="flex items-center gap-2 pt-1">
            <TagSelect value={metaTag} onChange={setMetaTag} className="flex-1" />
            <DueDatePicker value={metaDueDate} onChange={setMetaDueDate} />
            <Button size="sm" className="h-8 text-xs" onClick={handleSaveMeta}>
              Guardar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setEditingMeta(false)}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {info.tags && (
              <Badge variant="outline" className="text-xs">
                {info.tags}
              </Badge>
            )}
            {info.due_date && <DueDateBadge dueDate={info.due_date} status={info.status} />}
            {canEditTask(info) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditingMeta(true)}
              >
                <Pencil size={13} />
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
        {info.description}
      </p>

      <div className="flex items-center justify-between">
        <Badge variant="outline">{info.assigned_to || "Sin asignar"}</Badge>

        {onMoveTask && (
          <MoveStatusButtons
            status={info.status}
            onMove={(status) => onMoveTask(info.id, status)}
          />
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Creado por: {info.created_by_name || "Sin autor"}
      </p>

      <div className="border-t pt-3 space-y-3">
        <SubtasksSection
          task={info}
          urlApi={urlApi}
          collaborators={collaborators}
          onMoveTask={onMoveTask}
          refresh={refresh}
          isAdmin={isAdmin}
          defaultOpen
        />

        <ChecklistSection
          task={info}
          urlApi={urlApi}
          refresh={refresh}
          isAdmin={isAdmin}
          defaultOpen
        />
      </div>
    </Modal>
  );
}
