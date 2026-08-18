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
import { GERENCIA_CATEGORIES, DAY_OPTIONS, authHeaders } from "@components/gerencia/gerencia-constants.js";

export default function AddBudgetItemModal({ isOpen, onClose, urlApi, refresh }) {
  const [type, setType] = useState("gasto");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");

  const reset = () => {
    setType("gasto");
    setCategory("");
    setDescription("");
    setAmount("");
    setDueDay("1");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleTypeChange = (value) => {
    setType(value);
    setCategory("");
  };

  const isDisabled = !category || !description.trim() || !amount || Number(amount) <= 0;

  const handleSave = () => {
    const payload = { type, category, description, amount: Number(amount), due_day: Number(dueDay) };

    toast.promise(
      axios
        .post(`${urlApi}gerencia/budget-items`, payload, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            reset();
            refresh();
            onClose();
            return "Item de presupuesto guardado con éxito";
          } else {
            throw new Error("Error al guardar: " + response.data.message);
          }
        }),
      {
        loading: "Guardando...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Agregar item de presupuesto"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(420px, 90vw)",
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
      <div>
        <h2 className="text-lg font-semibold">Agregar al presupuesto fijo mensual</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Un ingreso o gasto que se repite cada mes (arriendo, nómina, subscripciones...).
        </p>
      </div>

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
              {GERENCIA_CATEGORIES[type].map((cat) => (
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
            placeholder="Ej. Arriendo oficina"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Monto mensual (COP)</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Día de débito</Label>
            <Select value={dueDay} onValueChange={setDueDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isDisabled} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Agregar al presupuesto
      </Button>
    </Modal>
  );
}
