/* eslint-disable react/prop-types */
import { CardContent, CardHeader, CardTitle } from "@components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { authHeaders } from "@components/project-detail/task-constants.js";

export default function EditProjectTask({
  isOpen,
  onClose,
  info,
  urlApi,
  collaborators,
  refresh,
}) {
  const [infoTitle, setInfoTitle] = useState("");
  const [infoDescription, setInfoDescription] = useState("");
  const [infoAssigned, setInfoAssigned] = useState("");
  const [isEditModal, setIsEditModal] = useState(false);

  useEffect(() => {
    if (info) {
      setInfoTitle(info.title || "");
      setInfoDescription(info.description || "");
      setInfoAssigned(info.assigned_to || "");
    }
  }, [info]);

  async function handleUpdateTask() {
    if (!info || !info.id) {
      // setError("No hay un curso válido para actualizar");
      return "No hay una idea valida para actualizar";
    }

    toast.promise(
      axios
        .put(
          `${urlApi}task/${info.id}`,
          {
            title: infoTitle,
            description: infoDescription,
            assigned_to: infoAssigned,
          },
          {
            headers: authHeaders(),
          }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            // setLoading(false);
            refresh();
            onClose();
            return "Tarea actualizada con éxito";
          } else {
            throw new Error("Error al actualizar la tarea");
          }
        }),
      {
        loading: "Editando cambios...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de edición",
      }
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Editar idea"
        style={{
          overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
          content: {
            width: "fit-content",
            height: "fit-content",
            margin: "auto",
            borderRadius: "8px",
            padding: "40px",
            backgroundColor: "white",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <CardHeader>
          <CardTitle>Editar tarea</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 w-[400px]">
          <div>
            <Label htmlFor="idea-title">Título</Label>
            <Input
              id="idea-title"
              value={infoTitle}
              onChange={(e) => setInfoTitle(e.target.value)}
              placeholder="Introduzca el título del proyecto"
            />
          </div>
          <div>
            <Label htmlFor="idea-description">Descripción</Label>
            <Textarea
              id="idea-description"
              value={infoDescription}
              onChange={(e) => setInfoDescription(e.target.value)}
              placeholder="Describe tu idea de proyecto"
            />
          </div>
          <div>
            <Label htmlFor="task-assignee">Colaborador asignado</Label>
            <Select
              value={infoAssigned}
              onValueChange={(value) => setInfoAssigned(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {collaborators.map((collaborator) => (
                  <SelectItem key={collaborator.id} value={collaborator.id}>
                    {collaborator.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEditModal ? (
            <div>
              <div className="flex gap-4">
                <Button className="w-full" onClick={handleUpdateTask}>
                  Sí
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    onClose;
                    setIsEditModal(false);
                  }}
                >
                  No
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditModal(true)}
              disabled={
                !infoTitle.trim() || !infoDescription.trim() || !infoAssigned
              }
              className="w-full"
            >
              ¿Estás seguro de editar la tarea?
            </Button>
          )}
        </CardContent>
      </Modal>
    </>
  );
}
