/* eslint-disable react/prop-types */
import { useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus } from "lucide-react";
import { authHeaders } from "@components/gerencia/gerencia-constants.js";

export default function AddSavingsGoalModal({ isOpen, onClose, urlApi, refresh }) {
  const [name, setName] = useState("");

  const handleClose = () => {
    setName("");
    onClose();
  };

  const handleSave = () => {
    toast.promise(
      axios
        .post(`${urlApi}gerencia/savings-goals`, { name }, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            setName("");
            refresh();
            onClose();
            return "Meta de ahorro creada con éxito";
          } else {
            throw new Error("Error al crear la meta: " + response.data.message);
          }
        }),
      {
        loading: "Creando meta...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Nueva meta de ahorro"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(380px, 90vw)",
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
      <h2 className="text-lg font-semibold">Nueva meta de ahorro</h2>

      <div className="space-y-1.5">
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Fondo de emergencia" />
      </div>

      <Button onClick={handleSave} disabled={!name.trim()} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Crear meta
      </Button>
    </Modal>
  );
}
