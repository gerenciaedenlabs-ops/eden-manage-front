/* eslint-disable react/prop-types */
import { useState } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { PERSONAL_CATEGORIES, authHeaders } from "@components/personal/personal-constants.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AddTransactionModal({ isOpen, onClose, urlApi, refresh }) {
  const [type, setType] = useState("gasto");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());

  const reset = () => {
    setType("gasto");
    setCategory("");
    setDescription("");
    setAmount("");
    setDate(todayStr());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTypeChange = (value) => {
    setType(value);
    setCategory("");
  };

  const isDisabled = !category || !description.trim() || !amount || Number(amount) <= 0 || !date;

  const handleSave = () => {
    const payload = {
      type,
      category,
      description,
      amount: Number(amount),
      date,
    };

    toast.promise(
      axios
        .post(`${urlApi}personal/transactions`, payload, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            reset();
            refresh();
            onClose();
            return "Movimiento guardado con éxito";
          } else {
            throw new Error("Error al guardar: " + response.data.message);
          }
        }),
      {
        loading: "Guardando movimiento...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Agregar movimiento"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(440px, 90vw)",
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
      <h2 className="text-lg font-semibold">Agregar movimiento puntual</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange("ingreso")}
            className={`h-10 rounded-md text-sm font-semibold border transition-colors ${
              type === "ingreso"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-neutral-600 border-neutral-200"
            }`}
          >
            Ingreso
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("gasto")}
            className={`h-10 rounded-md text-sm font-semibold border transition-colors ${
              type === "gasto"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-neutral-600 border-neutral-200"
            }`}
          >
            Gasto
          </button>
        </div>

        <div className="space-y-1.5">
          <Label>Categoría</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {PERSONAL_CATEGORIES[type].map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Descripción</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Cena de cumpleaños"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Monto (COP)</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isDisabled} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Guardar movimiento
      </Button>
    </Modal>
  );
}
