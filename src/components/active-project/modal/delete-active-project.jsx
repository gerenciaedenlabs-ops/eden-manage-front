/* eslint-disable react/prop-types */
import { CardDescription, CardHeader } from "@components/ui/card";
import { Button } from "@components/ui/button";
import Modal from "react-modal";
import { toast } from "sonner";
import axios from "axios";
import { useState } from "react";

export default function DeleteProjectIdea({
  isOpen,
  onClose,
  info,
  urlApi,
  refresh,
}) {
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);

  const [isDeleteModal, setIsDeleteModal] = useState(false);

  async function handleReturnProjectActive() {
    if (!info) {
      // setError("No hay un curso válido para actualizar");
      return "No hay un proyecto valido para degradar";
    }

    toast.promise(
      axios
        .put(`${urlApi}idea/deactivate/${info}`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            // setLoading(false);
            refresh();
            onClose();
            return "Proyecto degradado con éxito";
          } else {
            throw new Error("Error al degradar el proyecto");
          }
        }),
      {
        loading: "Degradando proyecto...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de degradación",
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
            width: "500px",
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
          <CardDescription>
            Recuerda que para eliminar el proyecto por completo debes eliminarlo
            de la idea
          </CardDescription>
          <br />
          {isDeleteModal ? (
            <div className="flex gap-2">
              <Button
                className="w-full"
                onClick={() => handleReturnProjectActive()}
              >
                Si
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  setIsDeleteModal(false);
                  onClose;
                }}
              >
                No
              </Button>
            </div>
          ) : (
            <Button className="w-full" onClick={() => setIsDeleteModal(true)}>
              ¿Seguro que quieres degradar el proyecto a una idea?
            </Button>
          )}
        </CardHeader>
      </Modal>
    </>
  );
}
