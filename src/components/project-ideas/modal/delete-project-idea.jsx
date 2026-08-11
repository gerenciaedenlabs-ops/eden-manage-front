/* eslint-disable react/prop-types */
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

  async function handleDeleteIdea() {
    if (!info) return "Datos incompletos";

    toast.promise(
      axios
        .delete(`${urlApi}idea/${info}`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            // setLoading(false);
            refresh();
            onClose();
            return "Idea eliminada con éxito";
          } else {
            throw new Error(
              "Error al eliminar la idea: " + response.data.message
            );
          }
        }),
      {
        loading: "Eliminando idea...",
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
          {isDeleteModal ? (
            <div className="flex gap-2">
              <Button className="w-full" onClick={() => handleDeleteIdea()}>
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
            <Button className="pb-4" onClick={() => setIsDeleteModal(true)}>
              ¿Seguro que quieres eliminar esta idea?
            </Button>
          )}
        </section>
      </Modal>
    </>
  );
}
