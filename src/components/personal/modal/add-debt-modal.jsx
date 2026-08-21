/* eslint-disable react/prop-types */
import { useState, useMemo, useEffect } from "react";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus, Lock } from "lucide-react";
import { formatCurrency, formatDate, authHeaders } from "@components/personal/personal-constants.js";

const todayStr = () => new Date().toISOString().slice(0, 10);

// Se usa tanto para crear como para editar una deuda (pasando `debt`). Si la
// deuda ya tiene alguna cuota pagada, el backend bloquea cambiar
// monto/fecha/cuotas (perdería el historial de pagos) — así que ahí se
// bloquean también esos campos en el form y solo queda editable el título/motivo.
export default function AddDebtModal({ isOpen, onClose, urlApi, refresh, debt }) {
  const isEdit = !!debt;
  const hasPaidInstallments = !!debt?.installments?.some((i) => !!i.paid);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [installmentsCount, setInstallmentsCount] = useState("1");

  useEffect(() => {
    if (debt) {
      setTitle(debt.title || "");
      setAmount(String(debt.amount ?? ""));
      setReason(debt.reason || "");
      setStartDate(String(debt.start_date || todayStr()).slice(0, 10));
      setInstallmentsCount(String(debt.installments_count ?? "1"));
    } else {
      setTitle("");
      setAmount("");
      setReason("");
      setStartDate(todayStr());
      setInstallmentsCount("1");
    }
  }, [debt, isOpen]);

  const reset = () => {
    setTitle("");
    setAmount("");
    setReason("");
    setStartDate(todayStr());
    setInstallmentsCount("1");
  };

  const handleClose = () => {
    if (!isEdit) reset();
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

  const isDisabled = isEdit && hasPaidInstallments
    ? !title.trim()
    : !title.trim() || !totalAmount || totalAmount <= 0 || !startDate || count < 1;

  const handleSave = () => {
    const payload = { title: title.trim(), reason };

    if (!hasPaidInstallments) {
      payload.amount = totalAmount;
      payload.start_date = startDate;
      payload.installments_count = count;
    }

    const request = isEdit
      ? axios.put(`${urlApi}personal/debts/${debt.id}`, payload, { headers: authHeaders() })
      : axios.post(`${urlApi}personal/debts`, payload, { headers: authHeaders() });

    toast.promise(
      request.then((response) => {
        if (response.data.status === "ok") {
          if (!isEdit) reset();
          refresh();
          onClose();
          return isEdit ? "Deuda actualizada con éxito" : "Deuda registrada con éxito";
        } else {
          throw new Error(response.data.message || "Error al guardar la deuda");
        }
      }),
      {
        loading: isEdit ? "Guardando cambios..." : "Registrando deuda...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud de guardado",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel={isEdit ? "Editar deuda" : "Registrar deuda"}
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
      <h2 className="text-lg font-semibold">{isEdit ? "Editar deuda" : "Registrar deuda"}</h2>

      {isEdit && hasPaidInstallments && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <Lock size={14} className="mt-0.5 shrink-0" />
          <span>
            Esta deuda ya tiene cuotas pagadas, así que el monto, la fecha y el número de
            cuotas no se pueden cambiar (se perdería ese historial). Solo el título y el
            motivo son editables.
          </span>
        </div>
      )}

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
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              disabled={isEdit && hasPaidInstallments}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cuotas</Label>
            <Input
              type="number"
              min="1"
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
              disabled={isEdit && hasPaidInstallments}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Fecha de inicio</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={isEdit && hasPaidInstallments}
          />
        </div>

        {!hasPaidInstallments && preview.length > 0 && (
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
        {isEdit ? "Guardar cambios" : "Registrar deuda"}
      </Button>
    </Modal>
  );
}
