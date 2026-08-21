/* eslint-disable react/prop-types */
import { useState, useMemo } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus } from "lucide-react";
import { formatCurrency, formatDate, authHeaders } from "@components/personal/personal-constants.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AddDebtModal({ isOpen, onClose, urlApi, refresh }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [installmentsCount, setInstallmentsCount] = useState("1");

  const reset = () => {
    setTitle("");
    setAmount("");
    setReason("");
    setStartDate(todayStr());
    setInstallmentsCount("1");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const count = Math.max(1, Number(installmentsCount) || 1);
  const totalAmount = Number(amount) || 0;

  const preview = useMemo(() => {
    if (!totalAmount || !startDate) return [];

    const base = Math.floor((totalAmount / count) * 100) / 100;
    const rows = [];

    for (let i = 1; i <= count; i++) {
      const due = new Date(`${startDate}T00:00:00`);
      due.setMonth(due.getMonth() + i);
      const isLast = i === count;
      const value = isLast ? Math.round((totalAmount - base * (count - 1)) * 100) / 100 : base;
      rows.push({ number: i, dueDate: due, amount: value });
    }

    return rows;
  }, [totalAmount, count, startDate]);

  const isDisabled = !title.trim() || !totalAmount || totalAmount <= 0 || !startDate || count < 1;

  const handleSave = () => {
    const payload = {
      title: title.trim(),
      amount: totalAmount,
      reason,
      start_date: startDate,
      installments_count: count,
    };

    toast.promise(
      axios
        .post(`${urlApi}personal/debts`, payload, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            reset();
            refresh();
            onClose();
            return "Deuda registrada con éxito";
          } else {
            throw new Error("Error al registrar la deuda: " + response.data.message);
          }
        }),
      {
        loading: "Registrando deuda...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Registrar deuda"
      style={{
        overlay: { backgroundColor: "rgba(0,0,0,0.5)" },
        content: {
          width: "min(460px, 90vw)",
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
      <h2 className="text-lg font-semibold">Registrar deuda</h2>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Tarjeta de crédito" />
        </div>

        <div className="space-y-1.5">
          <Label>Motivo (opcional)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. Compra electrodomésticos" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Monto total (COP)</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Cuotas</Label>
            <Input
              type="number"
              min="1"
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Fecha de inicio</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        {preview.length > 0 && (
          <div className="border rounded-md p-3 space-y-1.5 bg-neutral-50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Vista previa de cuotas
            </p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {preview.map((row) => (
                <div key={row.number} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Cuota {row.number} &middot; vence {formatDate(row.dueDate.toISOString())}
                  </span>
                  <span className="font-semibold">{formatCurrency(row.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={isDisabled} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Registrar deuda
      </Button>
    </Modal>
  );
}
