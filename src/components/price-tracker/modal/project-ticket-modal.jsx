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

export function ProjectTicketModal({ project, payments, onClose }) {
  const ticketRef = useRef(null);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = project.totalPrice - totalPaid;
  const status =
    remaining <= 0 ? "Pagado" : totalPaid > 0 ? "En curso" : "Pendiente";

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
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > pdfHeight - 20) {
      const scale = (pdfHeight - 20) / imgHeight;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth * scale, imgHeight * scale);
    } else {
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    }

    pdf.save(`project-${project.id.slice(0, 8)}.pdf`);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resumen del proyecto</DialogTitle>
        </DialogHeader>

        <div
          ref={ticketRef}
          className="bg-[#FEFEFE] p-6 rounded-lg border-2 border-dashed font-mono text-sm"
        >
          <div className="text-center border-b border-dashed pb-4 mb-4">
            <h3 className="font-bold text-lg uppercase">TICKET DE PROYECTO</h3>
            <p className="text-[#555555] text-xs mt-1">
              Creado:{" "}
              {new Date(project.createdAt).toLocaleDateString("en-US", {
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
              <span className="font-bold text-right max-w-[60%]">
                {project.name}
              </span>
            </div>

            {project.client && (
              <div className="flex justify-between">
                <span className="text-[#555555]">Cliente:</span>
                <span className="text-right max-w-[60%]">{project.client}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[#555555]">Modo:</span>
              <span className="capitalize">
                {project.mode === "flexible" ? "Pagos flexibles" : "Fases"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#555555]">Estado:</span>
              <span className="font-medium">{status}</span>
            </div>
          </div>

          {/* Involved Parties */}
          {(issuers.length > 0 || recipients.length > 0) && (
            <div className="space-y-2 border-b border-dashed pb-4 mb-4">
              <p className="text-[#555555] text-xs">
                Partes involucradas:
              </p>

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

          {project.description && (
            <div className="border-b border-dashed pb-4 mb-4">
              <p className="text-[#555555] text-xs mb-1">Descripción:</p>
              <p className="text-sm">{project.description}</p>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-2 border-b border-dashed pb-4 mb-4">
            <div className="flex justify-between">
              <span className="text-[#555555]">Importe total:</span>
              <span className="font-bold text-lg">
                {formatCurrency(project.totalPrice, project.currency)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#555555]">Total pagado:</span>
              <span className="text-[#399642] font-medium">
                {formatCurrency(totalPaid, project.currency)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#555555]">Restante:</span>
              <span className="font-medium">
                {formatCurrency(Math.max(0, remaining), project.currency)}
              </span>
            </div>
          </div>

          {/* Phases */}
          {project.mode === "phases" &&
            project.phases &&
            project.phases.length > 0 && (
              <div className="border-b border-dashed pb-4 mb-4">
                <p className="text-[#555555] text-xs mb-2">Fases:</p>
                <div className="space-y-2">
                  {[...project.phases]
                    .sort((a, b) =>
                      (a.name || "").localeCompare(b.name || "", undefined, {
                        numeric: true,
                        sensitivity: "base",
                      }),
                    )
                    .map((phase) => {
                    const phasePaid = payments
                      .filter((p) => p.phaseId === phase.id)
                      .reduce((s, p) => s + p.amount, 0);

                    return (
                      <div
                        key={phase.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="truncate max-w-[50%]">
                          {phase.name}
                        </span>
                        <span className="text-right">
                          {formatCurrency(phase.price, project.currency)} (
                          {phase.status}, pagado{" "}
                          {formatCurrency(phasePaid, project.currency)})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Payments */}
          {payments.length > 0 && (
            <div className="border-b border-dashed pb-4 mb-4">
              <p className="text-[#555555] text-xs mb-2">
                Pagos ({payments.length}):
              </p>
              <div className="space-y-2">
                {payments
                  .sort(
                    (a, b) =>
                      new Date(b.date).getTime() - new Date(a.date).getTime(),
                  )
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {new Date(payment.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {" · "}
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </span>
                      <span>
                        {formatCurrency(payment.amount, project.currency)}
                        {payment.percentage ? ` (${payment.percentage}%)` : ""}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="text-center text-xs text-[#555555]">
            <p>EdenLabs Ledger</p>
            <p className="mt-1">ID: {project.id.slice(0, 8)}</p>
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
