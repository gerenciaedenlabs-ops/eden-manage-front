/* eslint-disable react/prop-types */
// Gestiona quién puede ver este proyecto (y, dentro de él, solo sus propias
// tareas asignadas): mientras un usuario no sea admin y no tenga una fila en
// project_developers para este proyecto, ni el proyecto ni sus tareas le
// aparecen en absoluto. Ver GET/POST/DELETE /project/:id/developers en
// manager.controller.js.
import { useState, useEffect, useMemo } from "react";
import { CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { UserPlus, X, Users } from "lucide-react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { authHeaders } from "@components/project-detail/task-constants.js";
import { Avatar } from "@components/project-detail/task-shared.jsx";

export default function AssignDevelopersModal({ isOpen, onClose, urlApi, projectId, collaborators }) {
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAssigned = () => {
    setLoading(true);
    axios
      .get(`${urlApi}project/${projectId}/developers`, { headers: authHeaders() })
      .then((response) => {
        if (response.data.status === "ok") setAssigned(response.data.data);
      })
      .catch((error) => {
        console.error(error);
        toast.error("No se pudo cargar la lista de desarrolladores asignados");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) fetchAssigned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const assignedIds = useMemo(() => new Set(assigned.map((a) => String(a.user_id))), [assigned]);
  const available = collaborators.filter((c) => !assignedIds.has(String(c.id)));

  const handleAdd = () => {
    if (!selectedToAdd) return;
    setSubmitting(true);

    axios
      .post(
        `${urlApi}project/${projectId}/developers`,
        { user_id: selectedToAdd },
        { headers: authHeaders() }
      )
      .then((response) => {
        if (response.data.status === "ok") {
          setSelectedToAdd("");
          fetchAssigned();
        } else {
          throw new Error(response.data.message);
        }
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || error.message || "No se pudo asignar");
      })
      .finally(() => setSubmitting(false));
  };

  const handleRemove = (userId) => {
    axios
      .delete(`${urlApi}project/${projectId}/developers/${userId}`, { headers: authHeaders() })
      .then((response) => {
        if (response.data.status === "ok") fetchAssigned();
      })
      .catch((error) => {
        console.error(error);
        toast.error("No se pudo quitar la asignación");
      });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Desarrolladores asignados"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(480px, 90vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          margin: "auto",
          borderRadius: "8px",
          padding: "32px",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <CardHeader>
        <CardTitle>Desarrolladores con acceso</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Solo los desarrolladores de esta lista pueden ver este proyecto, y
          dentro de él solo ven las tareas que tienen asignadas a ellos.
        </p>

        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground p-2">Cargando...</p>}

          {!loading && assigned.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">
              Nadie tiene acceso todavía (solo tú, como admin).
            </p>
          )}

          {assigned.map((dev) => (
            <div
              key={dev.user_id}
              className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
            >
              <Avatar name={dev.name} size={22} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{dev.name}</p>
                <p className="text-xs text-muted-foreground truncate">{dev.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => handleRemove(dev.user_id)}
                title="Quitar acceso"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Elegir colaborador..." />
            </SelectTrigger>
            <SelectContent>
              {available.length === 0 ? (
                <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  Todos los colaboradores ya tienen acceso
                </div>
              ) : (
                available.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button disabled={!selectedToAdd || submitting} onClick={handleAdd}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Dar acceso
          </Button>
        </div>
      </CardContent>
    </Modal>
  );
}
