/* eslint-disable react/prop-types */
import { useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { STATUS, authHeaders, getCurrentUserId } from "@components/project-detail/task-constants.js";
import { TagSelect, DueDatePicker } from "@components/project-detail/task-shared.jsx";

export default function AddTaskModal({
  isOpen,
  onClose,
  urlApi,
  projectId,
  collaborators,
  refresh,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigned, setAssigned] = useState("");
  const [tag, setTag] = useState("");
  const [dueDate, setDueDate] = useState(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setAssigned("");
    setTag("");
    setDueDate(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isDisabled = !title.trim() || !description.trim() || !assigned;

  const handleAdd = () => {
    const payload = {
      project_id: projectId,
      title,
      description,
      assigned_to: assigned,
      tags: tag || null,
      due_date: dueDate || null,
      status: STATUS.PENDING,
      created_by: getCurrentUserId(),
    };

    toast.promise(
      axios
        .post(`${urlApi}task`, payload, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            reset();
            refresh();
            onClose();
            return "Tarea agregada con éxito";
          } else {
            throw new Error("Error al agregar la tarea: " + response.data.message);
          }
        }),
      {
        loading: "Guardando tarea...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Agregar nueva tarea"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(480px, 90vw)",
          maxHeight: "85vh",
          overflowY: "auto",
          margin: "auto",
          borderRadius: "10px",
          padding: "28px",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        },
      }}
    >
      <h2 className="text-lg font-semibold">Agregar nueva tarea</h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nombre de la tarea</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Configurar autenticación con Google" />
        </div>

        <div className="space-y-1.5">
          <Label>Descripción</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[90px]"
            placeholder="Describe qué incluye esta tarea..."
          />
        </div>

        <div className="space-y-1.5">
          <Label>Colaborador</Label>
          <Select value={assigned} onValueChange={setAssigned}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar usuario" />
            </SelectTrigger>
            <SelectContent>
              {collaborators.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tag</Label>
            <TagSelect value={tag} onChange={setTag} className="w-full" />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha límite</Label>
            <DueDatePicker value={dueDate} onChange={setDueDate} className="w-full" />
          </div>
        </div>
      </div>

      <Button onClick={handleAdd} disabled={isDisabled} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Agregar tarea
      </Button>
    </Modal>
  );
}
