/* eslint-disable react/prop-types */
import { useRef } from "react";
import { formatCurrency, getPaymentMethodLabel } from "@lib/types.ts";
import { Button } from "@components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog.tsx";
import { Download, X } from "lucide-react";

export function PaymentTicketModal({ payment, project, allPayments, onClose }) {
  const ticketRef = useRef(null);

  const paymentsBeforeThis = allPayments.filter(
    (p) => new Date(p.date) <= new Date(payment.date) && p.id !== payment.id,
  );

  const paidBeforeThis = paymentsBeforeThis.reduce(
    (sum, p) => sum + p.amount,
    0,
  );

  const remainingAfterPayment =
    project.totalPrice - paidBeforeThis - payment.amount;

  const phase = project.phases?.find((p) => p.id === payment.phaseId);

  const issuers = project.parties?.filter((p) => p.role === "issuer") || [];

  const recipients =
    project.parties?.filter((p) => p.role === "recipient") || [];

  const handleDownload = async () => {
    if (!ticketRef.current) return;

    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;

    const canvas = await html2canvas(ticketRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [80, 200],
    });

    const imgWidth = 70;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);
    pdf.save(`payment-${payment.id.slice(0, 8)}.pdf`);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recibo de pago</DialogTitle>
        </DialogHeader>

        <div
          ref={ticketRef}
          className="bg-[#FEFEFE] p-6 rounded-lg border-2 border-dashed font-mono text-sm"
        >
          <div className="text-center border-b border-dashed pb-4 mb-4">
            <h3 className="font-bold text-lg">RECIBO DE PAGO</h3>
            <p className="text-[#555555] text-xs mt-1">
              {new Date(payment.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Project info */}
          <div className="space-y-2 border-b border-dashed pb-4 mb-4">
            <div className="flex justify-between">
              <span className="text-[#555555]">Proyecto:</span>
              <span className="font-medium text-right max-w-[60%] truncate">
                {project.name}
              </span>
            </div>

            {project.client && (
              <div className="flex justify-between">
                <span className="text-[#555555]">Cliente:</span>
                <span className="text-right max-w-[60%] truncate">
                  {project.client}
                </span>
              </div>
            )}

            {phase && (
              <div className="flex justify-between">
                <span className="text-[#555555]">Fase:</span>
                <span className="text-right max-w-[60%] truncate">
                  {phase.name}
                </span>
              </div>
            )}
          </div>

          {/* Parties */}
          {(issuers.length > 0 || recipients.length > 0) && (
            <div className="space-y-2 border-b border-dashed pb-4 mb-4">
              {issuers.length > 0 && (
                <div>
                  <span className="text-[#555555] text-xs">
                    Emisor / Facturado por:
                  </span>
                  {issuers.map((p) => (
                    <p key={p.id} className="font-medium">
                      {p.name}
                      {p.note && (
                        <span className="text-[#555555] font-normal text-xs">
                          {" "}
                          ({p.note})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}

              {recipients.length > 0 && (
                <div>
                  <span className="text-[#555555] text-xs">
                    Destinatario / Facturado a:
                  </span>
                  {recipients.map((p) => (
                    <p key={p.id} className="font-medium">
                      {p.name}
                      {p.note && (
                        <span className="text-[#555555] font-normal text-xs">
                          {" "}
                          ({p.note})
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-2 border-b border-dashed pb-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-[#555555]">Cantidad:</span>
              <span className="font-bold text-lg">
                {formatCurrency(payment.amount, project.currency)}
              </span>
            </div>

            {payment.percentage && (
              <div className="flex justify-between">
                <span className="text-[#555555]">Porcentaje:</span>
                <span>{payment.percentage}%</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[#555555]">Método:</span>
              <span>{getPaymentMethodLabel(payment.paymentMethod)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#555555]">Restante:</span>
              <span>
                {formatCurrency(
                  Math.max(0, remainingAfterPayment),
                  project.currency,
                )}
              </span>
            </div>
          </div>

          {payment.note && (
            <div className="border-b border-dashed pb-4 mb-4">
              <p className="text-[#555555] text-xs mb-1">Nota:</p>
              <p className="text-sm">{payment.note}</p>
            </div>
          )}

          {payment.image && (
            <div className="border-b border-dashed pb-4 mb-4">
              <p className="text-[#555555] text-xs mb-2">Prueba:</p>
              <img
                src={payment.image || "/404.jpg"}
                alt="Comprobante de pago"
                className="w-full rounded"
              />
            </div>
          )}

          {payment.signature && (
            <div className="border-b border-dashed pb-4 mb-4">
              <p className="text-[#555555] text-xs mb-2">Firma:</p>
              <img
                src={payment.signature || "/404.jpg"}
                alt="Firma"
                className="w-full h-20 rounded object-contain bg-[#FEFEFE]"
              />
            </div>
          )}

          <div className="text-center text-xs text-[#555555]">
            <p>Gracias por su pago</p>
            <p className="mt-1">ID: {payment.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
