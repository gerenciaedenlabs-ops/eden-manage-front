/* eslint-disable react/prop-types */
import { formatCurrency, getPaymentMethodLabel } from "@lib/types.ts";
import { Button } from "@components/ui/button.tsx";
import { Trash2, Pencil } from "lucide-react";

export function PaymentItem({ payment, project, onClick, onEdit, onDelete }) {
  const phase = project.phases?.find((p) => p.id === payment.phaseId);

  return (
    <div
      className="p-4 bg-[#FEFEFE] rounded-lg border flex items-center gap-4 cursor-pointer hover:border-foreground/20 transition-all"
      onClick={onClick}
    >
      {payment.image && (
        <img
          src={payment.image || "/404.jpg"}
          alt="Comprobante de pago"
          className="h-12 w-12 rounded object-cover shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold">
            {formatCurrency(payment.amount, project.currency)}
          </span>

          {payment.percentage && (
            <span className="text-xs text-[#555555]">
              ({payment.percentage}%)
            </span>
          )}

          {phase && (
            <span className="text-xs text-[#555555] bg-[#EEEEEE] px-2 py-0.5 rounded">
              {phase.name}
            </span>
          )}
        </div>

        <p className="text-sm text-[#555555]">
          {new Date(payment.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
          {" · "}
          {getPaymentMethodLabel(payment.paymentMethod)}
          {payment.note && ` · ${payment.note}`}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-[#555555] hover:text-foreground"
        >
          <Pencil className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-[#CC262E] hover:text-[#CC262E]"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
