/* eslint-disable react/prop-types */
import { useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus } from "lucide-react";
import { authHeaders } from "@components/personal/personal-constants.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AddSavingsEntryModal({ isOpen, onClose, urlApi, goal, refresh }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");

  const reset = () => {
    setAmount("");
    setDate(todayStr());
    setNote("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!goal) return null;

  const handleSave = () => {
    toast.promise(
      axios
        .post(
          `${urlApi}personal/savings-goals/${goal.id}/entries`,
          { amount: Number(amount), date, note },
          { headers: authHeaders() }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            reset();
            refresh();
            onClose();
            return "Aporte registrado con éxito";
          } else {
            throw new Error("Error al registrar el aporte: " + response.data.message);
          }
        }),
      {
        loading: "Guardando aporte...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Agregar aporte"
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
      <h2 className="text-lg font-semibold">Agregar aporte a &ldquo;{goal.name}&rdquo;</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Monto (COP)</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Nota (opcional)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej. Bono" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={!amount || Number(amount) <= 0 || !date} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Agregar aporte
      </Button>
    </Modal>
  );
}
