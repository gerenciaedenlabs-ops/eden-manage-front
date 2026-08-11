/* eslint-disable react/prop-types */
import { formatCurrency } from "@lib/types.ts";
import { Card, CardContent } from "@components/ui/card.tsx";
import { Badge } from "@components/ui/badge.tsx";

export function ProjectCard({ project, payments, onClick }) {
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

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-foreground/20"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">
              {project.name}
            </h3>

            {project.client && (
              <p className="text-sm text-[#555555] truncate">
                {project.client}
              </p>
            )}
          </div>

          <Badge className={statusColors[status]} variant="secondary">
            {statusLabels[status]}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#555555]">Modo</span>
            <span className="font-medium capitalize">
              {project.mode === "flexible" ? "Flexible" : "Phases"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#555555]">Total</span>
            <span className="font-medium">
              {formatCurrency(project.totalPrice, project.currency)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#555555]">Pagado</span>
            <span className="font-medium text-[#399642]">
              {formatCurrency(totalPaid, project.currency)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-[#555555]">Restante</span>
            <span className="font-medium">
              {formatCurrency(Math.max(0, remaining), project.currency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
