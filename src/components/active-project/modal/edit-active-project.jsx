/* eslint-disable react/prop-types */
import {
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@components/ui/card";
import { Textarea } from "@components/ui/textarea";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Input } from "@components/ui/input";
import { useState, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";

export default function EditProjectIdea({
  isOpen,
  onClose,
  info,
  urlApi,
  refresh,
}) {
  const [infoTitle, setInfoTitle] = useState("");
  const [infoDescription, setInfoDescription] = useState("");
  const [isEditModal, setIsEditModal] = useState(false);

  useEffect(() => {
    if (info) {
      setInfoTitle(info.title || "");
      setInfoDescription(info.description || "");
    }
  }, [info]);

  async function handleUpdateIdea() {
    if (!info || !info.id) {
      // setError("No hay un curso válido para actualizar");
      return "No hay una idea valida para actualizar";
    }

    toast.promise(
      axios
        .put(
          `${urlApi}idea/${info.id}`,
          {
            title: infoTitle,
            description: infoDescription,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            // setLoading(false);
            refresh();
            onClose();
            return "Proyecto actualizado con éxito";
          } else {
            throw new Error("Error al actualizar el proyecto");
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
          <CardTitle>Editar Proyecto</CardTitle>
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
          {isEditModal ? (
            <div>
              <CardDescription className="pb-2">
                ¿Estás seguro de guardar los cambios?
              </CardDescription>
              <div className="flex gap-4">
                <Button className="w-full" onClick={handleUpdateIdea}>
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
              className="w-full"
              onClick={() => setIsEditModal(true)}
              disabled={!infoTitle.trim() || !infoDescription.trim()}
            >
              Editar proyecto
            </Button>
          )}
        </CardContent>
      </Modal>
    </>
  );
}
