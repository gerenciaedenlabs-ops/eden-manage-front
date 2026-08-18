/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button } from "@components/ui/button";
import Modal from "react-modal";
import { toast } from "sonner";
import axios from "axios";
import { authHeaders } from "@components/project-detail/task-constants.js";

export default function DeleteProjectTask({
  isOpen,
  onClose,
  info,
  urlApi,
  refresh,
}) {
  // const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);
  const [isDeleteModal, setIsDeleteModal] = useState(true);

  async function handleDeleteTask() {
    if (!info) return "Datos incompletos";

    toast.promise(
      axios
        .delete(`${urlApi}task/${info}`, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            // setLoading(false);
            refresh();
            onClose();
            return "Tarea eliminada con éxito";
          } else {
            throw new Error(
              "Error al eliminar la tarea: " + response.data.message
            );
          }
        }),
      {
        loading: "Eliminando tarea...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de eliminación",
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
        <section>
          <h1 className="pb-4">¿Seguro que quieres eliminar esta tarea?</h1>

          {isDeleteModal ? (
            <div className="flex gap-2">
              <Button className="w-full" onClick={() => handleDeleteTask()}>
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
              ¿Eliminar tarea?
            </Button>
          )}
        </section>
      </Modal>
    </>
  );
}
