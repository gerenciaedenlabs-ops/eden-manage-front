/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Plus, Wallet, CalendarClock, Trash2, PiggyBank, AlertTriangle, Check, X } from "lucide-react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Checkbox } from "@components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { toast } from "sonner";
import AddTransactionModal from "@components/gerencia/modal/add-transaction-modal.jsx";
import AddBudgetItemModal from "@components/gerencia/modal/add-budget-item-modal.jsx";
import AddLoanModal from "@components/gerencia/modal/add-loan-modal.jsx";
import LoanDetailModal from "@components/gerencia/modal/loan-detail-modal.jsx";
import AddSavingsGoalModal from "@components/gerencia/modal/add-savings-goal-modal.jsx";
import AddSavingsEntryModal from "@components/gerencia/modal/add-savings-entry-modal.jsx";
import {
  getCategoryColor,
  formatCurrency,
  formatDate,
  authHeaders,
} from "@components/gerencia/gerencia-constants.js";

export default function Gerencia({ urlApi }) {
  const [summary, setSummary] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [collaborators, setCollaborators] = useState([]);

  const [openAddBudgetItem, setOpenAddBudgetItem] = useState(false);
  const [openAddTransaction, setOpenAddTransaction] = useState(false);
  const [openAddLoan, setOpenAddLoan] = useState(false);
  const [openAddSavingsGoal, setOpenAddSavingsGoal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [entryGoalId, setEntryGoalId] = useState(null);
  const [confirmAmounts, setConfirmAmounts] = useState({});

  const getSummary = useCallback(() => {
    axios
      .get(`${urlApi}gerencia/summary`, { headers: authHeaders() })
      .then((response) => setSummary(response.data.data))
      .catch((error) => console.error(error));
  }, [urlApi]);

  const getBudgetItems = useCallback(() => {
    axios
      .get(`${urlApi}gerencia/budget-items`, { headers: authHeaders() })
      .then((response) => setBudgetItems(response.data.data))
      .catch((error) => console.error(error));
  }, [urlApi]);

  const getTransactions = useCallback(() => {
    axios
      .get(`${urlApi}gerencia/transactions`, { headers: authHeaders() })
      .then((response) => setTransactions(response.data.data))
      .catch((error) => console.error(error));
  }, [urlApi]);

  const getLoans = useCallback(() => {
    axios
      .get(`${urlApi}gerencia/loans`, { headers: authHeaders() })
      .then((response) => setLoans(response.data.data))
      .catch((error) => console.error(error));
  }, [urlApi]);

  const getSavingsGoals = useCallback(() => {
    axios
      .get(`${urlApi}gerencia/savings-goals`, { headers: authHeaders() })
      .then((response) => setSavingsGoals(response.data.data))
      .catch((error) => console.error(error));
  }, [urlApi]);

  const getCollaborators = useCallback(() => {
    axios
      .get(`${urlApi}user`, { headers: authHeaders() })
      .then((response) => setCollaborators(response.data.data))
      .catch((error) => console.error(error));
  }, [urlApi]);

  const refresh = useCallback(() => {
    getSummary();
    getBudgetItems();
    getTransactions();
    getLoans();
    getSavingsGoals();
  }, [getSummary, getBudgetItems, getTransactions, getLoans, getSavingsGoals]);

  useEffect(() => {
    refresh();
    getCollaborators();
  }, [refresh, getCollaborators]);

  const handleToggleBudgetItem = async (item) => {
    try {
      const response = await axios.put(
        `${urlApi}gerencia/budget-items/${item.id}`,
        { active: !item.active },
        { headers: authHeaders() }
      );
      if (response.data.status === "ok") refresh();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el item");
    }
  };

  const handleDeleteBudgetItem = (item) => {
    if (!window.confirm(`¿Eliminar "${item.description}" del presupuesto fijo?`)) return;

    toast.promise(
      axios
        .delete(`${urlApi}gerencia/budget-items/${item.id}`, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            return "Item eliminado con éxito";
          } else {
            throw new Error("Error al eliminar el item");
          }
        }),
      {
        loading: "Eliminando...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud",
      }
    );
  };

  const handleDeleteTransaction = (transaction) => {
    if (!window.confirm(`¿Eliminar "${transaction.description}"?`)) return;

    toast.promise(
      axios
        .delete(`${urlApi}gerencia/transactions/${transaction.id}`, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            return "Movimiento eliminado con éxito";
          } else {
            throw new Error("Error al eliminar el movimiento");
          }
        }),
      {
        loading: "Eliminando...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud",
      }
    );
  };

  const handleConfirmOccurrence = (occurrence) => {
    const amount = Number(confirmAmounts[occurrence.occurrence_id] ?? occurrence.amount);

    toast.promise(
      axios
        .put(
          `${urlApi}gerencia/budget-occurrences/${occurrence.occurrence_id}/confirm`,
          { amount, date: occurrence.due_date.slice(0, 10) },
          { headers: authHeaders() }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            return "Movimiento confirmado con éxito";
          } else {
            throw new Error("Error al confirmar");
          }
        }),
      {
        loading: "Confirmando...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud",
      }
    );
  };

  const handleDismissOccurrence = (occurrence) => {
    toast.promise(
      axios
        .put(
          `${urlApi}gerencia/budget-occurrences/${occurrence.occurrence_id}/dismiss`,
          {},
          { headers: authHeaders() }
        )
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            return "Alerta descartada";
          } else {
            throw new Error("Error al descartar");
          }
        }),
      {
        loading: "Descartando...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud",
      }
    );
  };

  const handleDeleteSavingsGoal = (goal) => {
    if (!window.confirm(`¿Eliminar la meta "${goal.name}" y todos sus aportes?`)) return;

    toast.promise(
      axios
        .delete(`${urlApi}gerencia/savings-goals/${goal.id}`, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          if (response.data.status === "ok") {
            refresh();
            return "Meta eliminada con éxito";
          } else {
            throw new Error("Error al eliminar la meta");
          }
        }),
      {
        loading: "Eliminando...",
        success: (msg) => msg,
        error: (err) => err.message || "Error en la solicitud",
      }
    );
  };

  const selectedLoan = loans.find((l) => l.id === selectedLoanId) || null;
  const entryGoal = savingsGoals.find((g) => g.id === entryGoalId) || null;

  const maxCategoryTotal = summary?.by_category?.length
    ? Math.max(...summary.by_category.map((c) => c.total))
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gerencia</h1>

      {/* Alertas de gastos variables pendientes de confirmar */}
      {summary?.pending_confirmations?.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
              <AlertTriangle size={16} />
              ¿Se realizaron estos gastos variables?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.pending_confirmations.map((occurrence) => (
              <div
                key={occurrence.occurrence_id}
                className="flex items-center justify-between gap-3 bg-white border border-amber-200 rounded-md px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{occurrence.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Vencía el {formatDate(occurrence.due_date)} &middot; presupuestado {formatCurrency(occurrence.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min="0"
                    className="h-8 w-28 text-sm"
                    value={confirmAmounts[occurrence.occurrence_id] ?? occurrence.amount}
                    onChange={(e) =>
                      setConfirmAmounts((prev) => ({ ...prev, [occurrence.occurrence_id]: e.target.value }))
                    }
                  />
                  <Button size="icon" className="h-8 w-8" onClick={() => handleConfirmOccurrence(occurrence)}>
                    <Check size={15} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDismissOccurrence(occurrence)}
                  >
                    <X size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Saldo total / presupuesto mensual fijo / ahorrado */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
              <Wallet size={20} className="text-neutral-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Saldo total
              </p>
              <p className="text-2xl font-extrabold">{formatCurrency(summary?.balance_total)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <CalendarClock size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Presupuesto fijo mensual
              </p>
              <p className="text-2xl font-extrabold text-blue-700">
                {formatCurrency(summary?.monthly_budget?.gastos)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <PiggyBank size={20} className="text-indigo-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Total ahorrado
              </p>
              <p className="text-2xl font-extrabold text-indigo-700">
                {formatCurrency(summary?.savings_total)}
              </p>
              <p className="text-[11px] text-muted-foreground">Ya restado del saldo total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini dashboard */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Presupuesto fijo por categoría</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary?.by_category?.length ? (
              summary.by_category.map((row) => {
                const color = getCategoryColor(row.category);
                const pct = maxCategoryTotal ? Math.round((row.total / maxCategoryTotal) * 100) : 0;
                return (
                  <div key={row.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: color.text }} className="font-semibold">
                        {row.category}
                      </span>
                      <span className="font-semibold">{formatCurrency(row.total)}</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%`, backgroundColor: color.bar }}
                        className="h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin items de presupuesto fijo todavía.
              </p>
            )}

            {summary?.payroll_month > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                Nómina mensual: <span className="font-semibold text-foreground">{formatCurrency(summary.payroll_month)}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Préstamos a colaboradores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-extrabold">{formatCurrency(summary?.loans?.total_lent)}</p>
                <p className="text-[11px] text-muted-foreground">Prestado</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-green-700">
                  {formatCurrency(summary?.loans?.total_recovered)}
                </p>
                <p className="text-[11px] text-muted-foreground">Recuperado</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-amber-700">
                  {formatCurrency(summary?.loans?.pending)}
                </p>
                <p className="text-[11px] text-muted-foreground">Pendiente</p>
              </div>
            </div>

            {summary?.loans?.upcoming_installments?.length > 0 && (
              <div className="space-y-1 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Próximas cuotas
                </p>
                {summary.loans.upcoming_installments.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {i.collaborator_name} &middot; cuota {i.installment_number} &middot; {formatDate(i.due_date)}
                    </span>
                    <span className="font-semibold">{formatCurrency(i.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Presupuesto fijo mensual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Presupuesto fijo mensual</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ingresos y gastos que se repiten cada mes. Desactiva un item en vez de borrarlo si lo pausas temporalmente.
            </p>
          </div>
          <Button size="sm" onClick={() => setOpenAddBudgetItem(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar al presupuesto
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Activo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Día</TableHead>
                <TableHead className="text-right">Monto mensual</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetItems.map((item) => {
                const color = getCategoryColor(item.category);
                return (
                  <TableRow key={item.id} className={!item.active ? "opacity-50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={!!item.active}
                        onCheckedChange={() => handleToggleBudgetItem(item)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={item.type === "ingreso" ? "text-green-700 border-green-200" : "text-red-700 border-red-200"}
                      >
                        {item.type === "ingreso" ? "Ingreso" : "Gasto"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{ backgroundColor: color.bg, color: color.text }}
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                      >
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{item.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.due_day}</TableCell>
                    <TableCell
                      className={`text-right font-semibold whitespace-nowrap ${
                        item.type === "ingreso" ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {item.type === "ingreso" ? "+" : "-"}
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteBudgetItem(item)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {budgetItems.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay items de presupuesto fijo todavía.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Movimientos puntuales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Movimientos puntuales</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ingresos o gastos que no se repiten (ventas, compras ocasionales).
            </p>
          </div>
          <Button size="sm" onClick={() => setOpenAddTransaction(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar movimiento
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const color = getCategoryColor(tx.category);
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={tx.type === "ingreso" ? "text-green-700 border-green-200" : "text-red-700 border-red-200"}
                      >
                        {tx.type === "ingreso" ? "Ingreso" : "Gasto"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{ backgroundColor: color.bg, color: color.text }}
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold"
                      >
                        {tx.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{tx.description}</TableCell>
                    <TableCell
                      className={`text-right font-semibold whitespace-nowrap ${
                        tx.type === "ingreso" ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {tx.type === "ingreso" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteTransaction(tx)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {transactions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay movimientos puntuales registrados todavía.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Préstamos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Préstamos</CardTitle>
          <Button size="sm" onClick={() => setOpenAddLoan(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Registrar préstamo
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cuotas</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Saldo pendiente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => {
                const paidCount = loan.installments.filter((i) => !!i.paid).length;
                const pending = loan.installments
                  .filter((i) => !i.paid)
                  .reduce((sum, i) => sum + Number(i.amount), 0);

                return (
                  <TableRow
                    key={loan.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedLoanId(loan.id)}
                  >
                    <TableCell className="text-sm font-medium">{loan.collaborator_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(loan.loan_date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {paidCount}/{loan.installments.length}
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">
                      {formatCurrency(loan.amount)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold whitespace-nowrap ${
                        pending > 0 ? "text-amber-700" : "text-green-700"
                      }`}
                    >
                      {pending > 0 ? formatCurrency(pending) : "Pagado"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {loans.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay préstamos registrados todavía.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Ahorro */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Ahorro</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Metas de ahorro. Cada aporte se resta del saldo total.
            </p>
          </div>
          <Button size="sm" onClick={() => setOpenAddSavingsGoal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva meta
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {savingsGoals.map((goal) => (
            <div key={goal.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{goal.name}</p>
                  <p className="text-xl font-extrabold text-indigo-700">{formatCurrency(goal.total)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleDeleteSavingsGoal(goal)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>

              {goal.entries.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {goal.entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formatDate(entry.date)} {entry.note && `· ${entry.note}`}
                      </span>
                      <span className="font-semibold">{formatCurrency(entry.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setEntryGoalId(goal.id)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Agregar aporte
              </Button>
            </div>
          ))}

          {savingsGoals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6 md:col-span-2">
              No hay metas de ahorro todavía.
            </p>
          )}
        </CardContent>
      </Card>

      <AddBudgetItemModal
        isOpen={openAddBudgetItem}
        onClose={() => setOpenAddBudgetItem(false)}
        urlApi={urlApi}
        refresh={refresh}
      />

      <AddTransactionModal
        isOpen={openAddTransaction}
        onClose={() => setOpenAddTransaction(false)}
        urlApi={urlApi}
        refresh={refresh}
      />

      <AddLoanModal
        isOpen={openAddLoan}
        onClose={() => setOpenAddLoan(false)}
        urlApi={urlApi}
        collaborators={collaborators}
        refresh={refresh}
      />

      <LoanDetailModal
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoanId(null)}
        loan={selectedLoan}
        urlApi={urlApi}
        refresh={refresh}
      />

      <AddSavingsGoalModal
        isOpen={openAddSavingsGoal}
        onClose={() => setOpenAddSavingsGoal(false)}
        urlApi={urlApi}
        refresh={refresh}
      />

      <AddSavingsEntryModal
        isOpen={!!entryGoal}
        onClose={() => setEntryGoalId(null)}
        urlApi={urlApi}
        goal={entryGoal}
        refresh={refresh}
      />
    </div>
  );
}
