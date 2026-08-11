/* eslint-disable react/prop-types */
import { useState } from "react";
import { formatCurrency } from "@lib/types.ts";
import { Button } from "@components/ui/button.tsx";
import { Badge } from "@components/ui/badge.tsx";
import { Input } from "@components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog.tsx";
import { ArrowLeft, Plus, FileText, Trash2, Pencil } from "lucide-react";
import { PaymentForm } from "./add-payment-form.jsx";
import { PaymentItem } from "./payment-item.jsx";
import { PaymentTicketModal } from "./payment-ticket-modal.jsx";
import { ProjectTicketModal } from "./project-ticket-modal.jsx";
import { ConfirmDialog } from "./confirm-dialog.jsx";
import { ProjectForm } from "./create-project-form.jsx";

export function ProjectDetail({
  project,
  payments,
  onBack,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onDeleteProject,
  onUpdateProject,
  onUpdatePhase,
  onDeletePhase,
  onAddPhase,
}) {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showProjectTicket, setShowProjectTicket] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [editPhaseName, setEditPhaseName] = useState("");
  const [editPhasePrice, setEditPhasePrice] = useState("");
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhasePrice, setNewPhasePrice] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const projectPayments = payments.filter((p) => p.projectId === project.id);
  const totalPaid = projectPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = project.totalPrice - totalPaid;

  const status =
    remaining <= 0 ? "paid" : totalPaid > 0 ? "in-progress" : "pending";

  const statusColors = {
    pending: "bg-[#EEEEEE] text-[#555555]",
    "in-progress": "bg-[#D9A414] text-[#050505]",
    paid: "bg-[#399642] text-[#F8F8F8]",
  };

  const statusLabels = {
    pending: "Pendiente",
    "in-progress": "En curso",
    paid: "Pagado",
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === "project") {
      onDeleteProject();
    } else if (confirmDelete.type === "payment" && confirmDelete.id) {
      onDeletePayment(confirmDelete.id);
    } else if (confirmDelete.type === "phase" && confirmDelete.id) {
      onDeletePhase(confirmDelete.id);
    }

    setConfirmDelete(null);
  };

  const getPhasePaid = (phaseId) => {
    return projectPayments
      .filter((p) => p.phaseId === phaseId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const handleEditProject = (data) => {
    onUpdateProject({
      name: data.name,
      client: data.client,
      description: data.description,
      currency: data.currency,
      totalPrice:
        data.mode === "phases" && data.phases
          ? data.phases.reduce((s, p) => s + p.price, 0)
          : data.totalPrice,
      initialPaymentPercentage: data.initialPaymentPercentage,
      phases: data.phases,
      parties: data.parties,
    });
    setShowEditProject(false);
  };

  const handleSavePhaseEdit = () => {
    if (!editingPhase) return;

    onUpdatePhase(editingPhase.id, {
      name: editPhaseName.trim() || editingPhase.name,
      price: Number.parseFloat(editPhasePrice) || editingPhase.price,
    });

    setEditingPhase(null);
  };

  const handleAddNewPhase = () => {
    if (!newPhaseName.trim() || !newPhasePrice) return;

    onAddPhase({
      id: crypto.randomUUID(),
      name: newPhaseName.trim(),
      price: Number.parseFloat(newPhasePrice),
      status: "pending",
    });

    setNewPhaseName("");
    setNewPhasePrice("");
    setShowAddPhase(false);
  };

  const issuers = project.parties?.filter((p) => p.role === "issuer") || [];
  const recipients =
    project.parties?.filter((p) => p.role === "recipient") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Atrás
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEditProject(true)}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowProjectTicket(true)}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Ticket</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmDelete({ type: "project" })}
            className="gap-2 text-[#CC262E] hover:text-[#CC262E]"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Eliminar</span>
          </Button>
        </div>
      </div>

      {/* Project info */}
      <div className="space-y-1">
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
        </div>
        {project.client && <p className="text-[#555555]">{project.client}</p>}
        {project.description && (
          <p className="text-sm text-[#555555] mt-2">{project.description}</p>
        )}
      </div>

      {/* Involved Parties */}
      {project.parties?.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">
            Partes involucradas
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {issuers.length > 0 && (
              <div className="p-3 bg-[#FEFEFE] rounded-lg border">
                <p className="text-xs text-[#555555] mb-1">
                  Emisor / Facturado por
                </p>
                {issuers.map((p) => (
                  <p key={p.id} className="text-sm font-medium">
                    {p.name}
                    {p.note && (
                      <span className="text-[#555555] font-normal">
                        {" "}
                        - {p.note}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            )}
            {recipients.length > 0 && (
              <div className="p-3 bg-[#FEFEFE] rounded-lg border">
                <p className="text-xs text-[#555555] mb-1">
                  Destinatario / Facturado a
                </p>
                {recipients.map((p) => (
                  <p key={p.id} className="text-sm font-medium">
                    {p.name}
                    {p.note && (
                      <span className="text-[#555555] font-normal">
                        {" "}
                        - {p.note}
                      </span>
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="p-4 bg-[#FEFEFE] rounded-lg border">
          <p className="text-sm text-[#555555] mb-1">Total</p>
          <p className="text-xl font-semibold">
            {formatCurrency(project.totalPrice, project.currency)}
          </p>
        </div>
        <div className="p-4 bg-[#FEFEFE] rounded-lg border">
          <p className="text-sm text-[#555555] mb-1">Pagado</p>
          <p className="text-xl font-semibold text-[#399642]">
            {formatCurrency(totalPaid, project.currency)}
          </p>
        </div>
        <div className="p-4 bg-[#FEFEFE] rounded-lg border">
          <p className="text-sm text-[#555555] mb-1">Restante</p>
          <p className="text-xl font-semibold">
            {formatCurrency(Math.max(0, remaining), project.currency)}
          </p>
        </div>
      </div>

      {/* Phases */}
      {project.mode === "phases" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Fases</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPhase(true)}
              className="gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar fase
            </Button>
          </div>

          {showAddPhase && (
            <div className="p-4 bg-[#FEFEFE] rounded-lg border space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newPhaseName}
                  onChange={(e) => setNewPhaseName(e.target.value)}
                  placeholder="Nombre de fase"
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={newPhasePrice}
                  onChange={(e) => setNewPhasePrice(e.target.value)}
                  placeholder="Precio"
                  className="w-32"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPhase(false)}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleAddNewPhase}>
                  Agregar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {project.phases?.map((phase) => {
              const phasePaid = getPhasePaid(phase.id);
              const phaseRemaining = phase.price - phasePaid;
              const isEditing = editingPhase?.id === phase.id;

              return (
                <div
                  key={phase.id}
                  className="p-4 bg-[#FEFEFE] rounded-lg border space-y-3"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          value={editPhaseName}
                          onChange={(e) => setEditPhaseName(e.target.value)}
                          placeholder="Nombre de fase"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={editPhasePrice}
                          onChange={(e) => setEditPhasePrice(e.target.value)}
                          placeholder="Precio"
                          className="w-32"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPhase(null)}
                        >
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={handleSavePhaseEdit}>
                          Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{phase.name}</p>
                        <p className="text-sm text-[#555555]">
                          {formatCurrency(phase.price, project.currency)} ·
                          Pagado: {formatCurrency(phasePaid, project.currency)}{" "}
                          · Restante:{" "}
                          {formatCurrency(
                            Math.max(0, phaseRemaining),
                            project.currency,
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={phase.status}
                          onValueChange={(v) =>
                            onUpdatePhase(phase.id, {
                              status: v,
                            })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="in-progress">
                              En curso
                            </SelectItem>
                            <SelectItem value="paid">Pagado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPhase(phase);
                            setEditPhaseName(phase.name);
                            setEditPhasePrice(phase.price.toString());
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setConfirmDelete({
                              type: "phase",
                              id: phase.id,
                            })
                          }
                          className="text-[#CC262E] hover:text-[#CC262E]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Pagos</h2>
          <Button onClick={() => setShowAddPayment(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar pago
          </Button>
        </div>

        {showAddPayment && (
          <div className="p-4 bg-[#FEFEFE] rounded-lg border">
            <PaymentForm
              project={project}
              onSubmit={(payment) => {
                onAddPayment(payment);
                setShowAddPayment(false);
              }}
              onCancel={() => setShowAddPayment(false)}
            />
          </div>
        )}

        {projectPayments.length === 0 ? (
          <p className="text-[#555555] text-sm py-8 text-center">
            No hay pagos todavía
          </p>
        ) : (
          <div className="space-y-2">
            {projectPayments
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              .map((payment) => (
                <PaymentItem
                  key={payment.id}
                  payment={payment}
                  project={project}
                  onClick={() => setSelectedPayment(payment)}
                  onEdit={() => setEditingPayment(payment)}
                  onDelete={() =>
                    setConfirmDelete({
                      type: "payment",
                      id: payment.id,
                    })
                  }
                />
              ))}
          </div>
        )}
      </div>

      {/* Edit payment modal */}
      <Dialog
        open={!!editingPayment}
        onOpenChange={(open) => !open && setEditingPayment(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar pago</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <PaymentForm
              project={project}
              initialData={editingPayment}
              onSubmit={(data) => {
                onEditPayment(editingPayment.id, data);
                setEditingPayment(null);
              }}
              onCancel={() => setEditingPayment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit project modal */}
      <Dialog
        open={showEditProject}
        onOpenChange={(open) => !open && setShowEditProject(false)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
          </DialogHeader>
          <ProjectForm
            mode="edit"
            initialData={project}
            onSubmit={handleEditProject}
            onCancel={() => setShowEditProject(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Payment ticket modal */}
      {selectedPayment && (
        <PaymentTicketModal
          payment={selectedPayment}
          project={project}
          allPayments={projectPayments}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {/* Project ticket modal */}
      {showProjectTicket && (
        <ProjectTicketModal
          project={project}
          payments={projectPayments}
          onClose={() => setShowProjectTicket(false)}
        />
      )}

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={`Eliminar ${
          confirmDelete?.type === "project"
            ? "Proyecto"
            : confirmDelete?.type === "payment"
              ? "Pago"
              : "Fase"
        }?`}
        description={`Esta acción no se puede deshacer. Esto eliminará permanentemente el ${confirmDelete?.type}.`}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
