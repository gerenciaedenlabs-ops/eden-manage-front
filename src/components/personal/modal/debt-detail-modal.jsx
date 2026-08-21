/* eslint-disable react/prop-types */
import Modal from "react-modal";
import axios from "axios";
import { toast } from "sonner";
import { Checkbox } from "@components/ui/checkbox";
import { Button } from "@components/ui/button";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatDate, authHeaders } from "@components/personal/personal-constants.js";

export default function DebtDetailModal({ isOpen, onClose, debt, urlApi, refresh }) {
  if (!debt) return null;

  const installments = debt.installments || [];
  const paidCount = installments.filter((i) => !!i.paid).length;
  const pending = installments
    .filter((i) => !i.paid)
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const handleToggle = async (installment) => {
    try {
      const response = await axios.put(
        `${urlApi}personal/installments/${installment.id}`,
        { paid: !installment.paid },
        { headers: authHeaders() }
      );
      if (response.data.status === "ok") refresh();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar la cuota");
    }
  };

  const handleDelete = () => {
    if (!window.confirm(`¿Eliminar la deuda "${debt.title}"?`)) return;

    toast.promise(
      axios
        .delete(`${urlApi}personal/debts/${debt.id}`, {
          headers: authHeaders(),
        })
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            onClose();
            return "Deuda eliminada con éxito";
          } else {
            throw new Error("Error al eliminar la deuda");
          }
        }),
      {
        loading: "Eliminando deuda...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud",
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Detalle de la deuda"
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
          gap: "16px",
        },
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{debt.title}</h2>
          {debt.reason && <p className="text-sm text-muted-foreground">{debt.reason}</p>}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleDelete}>
          <Trash2 size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="border rounded-md p-2.5">
          <p className="text-base font-bold">{formatCurrency(debt.amount)}</p>
          <p className="text-[11px] text-muted-foreground">Total de la deuda</p>
        </div>
        <div className="border rounded-md p-2.5">
          <p className="text-base font-bold">
            {paidCount}/{installments.length}
          </p>
          <p className="text-[11px] text-muted-foreground">Cuotas pagadas</p>
        </div>
        <div className="border rounded-md p-2.5">
          <p className="text-base font-bold">{formatCurrency(pending)}</p>
          <p className="text-[11px] text-muted-foreground">Saldo pendiente</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cuotas</p>
        {installments.map((installment) => (
          <label
            key={installment.id}
            className="flex items-center gap-3 border rounded-md px-3 py-2 cursor-pointer"
          >
            <Checkbox checked={!!installment.paid} onCheckedChange={() => handleToggle(installment)} />
            <div className="flex-1 flex items-center justify-between">
              <span className={`text-sm ${installment.paid ? "line-through text-muted-foreground" : ""}`}>
                Cuota {installment.installment_number} &middot; vence {formatDate(installment.due_date)}
              </span>
              <span className={`text-sm font-semibold ${installment.paid ? "text-muted-foreground" : ""}`}>
                {formatCurrency(installment.amount)}
              </span>
            </div>
          </label>
        ))}
      </div>
    </Modal>
  );
}
