/* eslint-disable react/prop-types */
import { useState } from "react";
import { CURRENCIES } from "@lib/types.ts";
import { Button } from "@components/ui/button.tsx";
import { Input } from "@components/ui/input.tsx";
import { Label } from "@components/ui/label.tsx";
import { Textarea } from "@components/ui/textarea.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select.tsx";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group.tsx";
import { Plus, X, UserPlus } from "lucide-react";

export function ProjectForm({ mode, initialData, onSubmit, onCancel }) {
  const [name, setName] = useState(initialData?.name || "");
  const [client, setClient] = useState(initialData?.client || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [currency, setCurrency] = useState(initialData?.currency || "COP");
  const [projectMode, setProjectMode] = useState(
    initialData?.mode || "flexible",
  );
  const [totalPrice, setTotalPrice] = useState(
    initialData?.totalPrice?.toString() || "",
  );
  const [initialPercentage, setInitialPercentage] = useState(
    initialData?.initialPaymentPercentage?.toString() || "50",
  );

  const [phases, setPhases] = useState(
    initialData?.phases?.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price.toString(),
      status: p.status,
    })) || [{ name: "", price: "", status: "pending" }],
  );

  const [parties, setParties] = useState(
    initialData?.parties?.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      note: p.note || "",
    })) || [],
  );

  const addPhase = () => {
    setPhases([...phases, { name: "", price: "", status: "pending" }]);
  };

  const removePhase = (index) => {
    if (phases.length > 1) {
      setPhases(phases.filter((_, i) => i !== index));
    }
  };

  const updatePhase = (index, field, value) => {
    const updated = [...phases];
    updated[index] = { ...updated[index], [field]: value };
    setPhases(updated);
  };

  const addParty = () => {
    setParties([...parties, { name: "", role: "issuer", note: "" }]);
  };

  const removeParty = (index) => {
    setParties(parties.filter((_, i) => i !== index));
  };

  const updateParty = (index, field, value) => {
    const updated = [...parties];
    updated[index] = { ...updated[index], [field]: value };
    setParties(updated);
  };

  const phasesTotal = phases.reduce(
    (sum, p) => sum + (Number.parseFloat(p.price) || 0),
    0,
  );

  const initialAmount =
    projectMode === "flexible"
      ? ((Number.parseFloat(totalPrice) || 0) *
          (Number.parseFloat(initialPercentage) || 0)) /
        100
      : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const validParties = parties
      .filter((p) => p.name.trim())
      .map((p) => ({
        id: p.id || crypto.randomUUID(),
        name: p.name.trim(),
        role: p.role,
        note: p.note.trim() || undefined,
      }));

    if (projectMode === "flexible") {
      if (!totalPrice || Number.parseFloat(totalPrice) <= 0) return;

      onSubmit({
        name: name.trim(),
        client: client.trim() || undefined,
        description: description.trim() || undefined,
        currency,
        mode: projectMode,
        totalPrice: Number.parseFloat(totalPrice),
        initialPaymentPercentage: Number.parseFloat(initialPercentage) || 0,
        parties: validParties,
      });
    } else {
      const validPhases = phases.filter(
        (p) => p.name.trim() && Number.parseFloat(p.price) > 0,
      );
      if (validPhases.length === 0) return;

      onSubmit({
        name: name.trim(),
        client: client.trim() || undefined,
        description: description.trim() || undefined,
        currency,
        mode: projectMode,
        totalPrice: phasesTotal,
        phases: validPhases.map((p) => ({
          id: p.id || crypto.randomUUID(),
          name: p.name.trim(),
          price: Number.parseFloat(p.price),
          status: p.status || "pending",
        })),
        parties: validParties,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del proyecto *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Introduzca el nombre del proyecto"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Cliente / Empresa</Label>
          <Input
            id="client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Divisa</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.value} - {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Involved Parties */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Partes involucradas</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addParty}
              className="gap-1 bg-transparent"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Agregar Participante
            </Button>
          </div>

          {parties.length === 0 && (
            <p className="text-sm text-[#555555]">
              No hay participantes añadidos todavía
            </p>
          )}

          <div className="space-y-3">
            {parties.map((party, index) => (
              <div
                key={index}
                className="p-3 bg-[#EEEEEE] rounded-lg space-y-2"
              >
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={party.name}
                      onChange={(e) =>
                        updateParty(index, "name", e.target.value)
                      }
                      placeholder="Nombre"
                    />
                  </div>
                  <Select
                    value={party.role}
                    onValueChange={(v) => updateParty(index, "role", v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="issuer">
                        Emisor / Facturado por
                      </SelectItem>
                      <SelectItem value="recipient">
                        Destinatario / Facturado a
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeParty(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                  value={party.note}
                  onChange={(e) => updateParty(index, "note", e.target.value)}
                  placeholder="Nota (opcional, p. ej., Freelancer, Empresa)"
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Payment Mode */}
        <div className="space-y-3">
          <Label>Modo de pago</Label>
          {mode === "edit" ? (
            <p className="text-sm text-[#555555] capitalize">
              {projectMode === "flexible"
                ? "Pagos flexibles"
                : "Fases / Módulos"}{" "}
              <span className="text-xs">(no se puede cambiar)</span>
            </p>
          ) : (
            <RadioGroup value={projectMode} onValueChange={setProjectMode}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="flexible" id="flexible" />
                <Label
                  htmlFor="flexible"
                  className="font-normal cursor-pointer"
                >
                  Pagos flexibles
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="phases" id="phases" />
                <Label htmlFor="phases" className="font-normal cursor-pointer">
                  Fases / Módulos
                </Label>
              </div>
            </RadioGroup>
          )}
        </div>

        {projectMode === "flexible" ? (
          <div className="space-y-4 p-4 bg-[#EEEEEE] rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Precio total del proyecto *</Label>
              <Input
                id="totalPrice"
                type="number"
                min="0"
                step="any"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialPercentage">Pago inicial %</Label>
              <Input
                id="initialPercentage"
                type="number"
                min="0"
                max="100"
                value={initialPercentage}
                onChange={(e) => setInitialPercentage(e.target.value)}
              />
            </div>

            {totalPrice && initialPercentage && (
              <p className="text-sm text-[#555555]">
                Pago inicial:{" "}
                {CURRENCIES.find((c) => c.value === currency)?.symbol}
                {initialAmount.toLocaleString("en-US")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-4 bg-[#EEEEEE] rounded-lg">
            <div className="flex items-center justify-between">
              <Label>Phases</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPhase}
              >
                <Plus className="w-4 h-4 mr-1" />
                Añadir fase
              </Button>
            </div>

            <div className="space-y-3">
              {phases.map((phase, index) => (
                <div key={phase.id || index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={phase.name}
                      onChange={(e) =>
                        updatePhase(index, "name", e.target.value)
                      }
                      placeholder="Nombre de la fase"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={phase.price}
                      onChange={(e) =>
                        updatePhase(index, "price", e.target.value)
                      }
                      placeholder="Precio"
                    />
                  </div>
                  {phases.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhase(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {phasesTotal > 0 && (
              <p className="text-sm text-[#555555]">
                Total: {CURRENCIES.find((c) => c.value === currency)?.symbol}
                {phasesTotal.toLocaleString("en-US")}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {mode === "edit" ? "Save Changes" : "Create Project"}
        </Button>
      </div>
    </form>
  );
}
