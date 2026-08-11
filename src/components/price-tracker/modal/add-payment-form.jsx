/* eslint-disable react/prop-types */
import { useState, useRef, useEffect } from "react";
import { getCurrencySymbol, PAYMENT_METHODS } from "@lib/types.ts";
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
import { ImageIcon, X } from "lucide-react";
import { SignatureCanvas } from "./signature-canvas.jsx";

export function PaymentForm({ project, initialData, onSubmit, onCancel }) {
  const [inputMode, setInputMode] = useState(
    initialData?.percentage ? "percentage" : "amount",
  );
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [percentage, setPercentage] = useState(
    initialData?.percentage?.toString() || "",
  );
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState(initialData?.note || "");
  const [imagePreview, setImagePreview] = useState(initialData?.image);
  const [imageFile, setImageFile] = useState(null);
  const [signature, setSignature] = useState(initialData?.signature);
  const [phaseId, setPhaseId] = useState(initialData?.phaseId);
  const [paymentMethod, setPaymentMethod] = useState(
    initialData?.paymentMethod || "bank-transfer",
  );

  const fileInputRef = useRef(null);

  // Determine price base for percentage calculation
  const priceBase =
    phaseId && project.phases
      ? project.phases.find((p) => p.id === phaseId)?.price ||
        project.totalPrice
      : project.totalPrice;

  // Sync amount <-> percentage
  useEffect(() => {
    if (inputMode === "percentage" && percentage) {
      const pct = Number.parseFloat(percentage);
      if (!Number.isNaN(pct)) {
        setAmount(((priceBase * pct) / 100).toFixed(2).replace(/\.?0+$/, ""));
      }
    }
  }, [percentage, inputMode, priceBase]);

  const handleAmountChange = (val) => {
    setAmount(val);
    if (inputMode === "amount" && val && priceBase > 0) {
      const pct = (Number.parseFloat(val) / priceBase) * 100;
      setPercentage(pct.toFixed(2).replace(/\.?0+$/, ""));
    }
  };

  const handlePercentageChange = (val) => {
    setPercentage(val);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const parsedAmount = Number.parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    onSubmit({
      amount: parsedAmount,
      date,
      note: note.trim() || undefined,
      image: imageFile,
      signature: paymentMethod === "cash" ? signature : undefined,
      phaseId,
      paymentMethod,
      percentage:
        inputMode === "percentage" ? Number.parseFloat(percentage) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Phase selector */}
      {project.mode === "phases" &&
        project.phases &&
        project.phases.length > 0 && (
          <div className="space-y-2">
            <Label>Asignar a fase (opcional)</Label>
            <Select
              value={phaseId || "none"}
              onValueChange={(v) => setPhaseId(v === "none" ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No hay fase específica</SelectItem>
                {project.phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

      {/* Amount input mode */}
      <div className="space-y-3">
        <Label>Modo de entrada</Label>
        <RadioGroup
          value={inputMode}
          onValueChange={setInputMode}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="amount" id="input-amount" />
            <Label
              htmlFor="input-amount"
              className="font-normal cursor-pointer"
            >
              Monto fijo
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="percentage" id="input-percentage" />
            <Label
              htmlFor="input-percentage"
              className="font-normal cursor-pointer"
            >
              Porcentaje
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {inputMode === "percentage" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje (%) *</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                step="any"
                value={percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                placeholder="p. ej. 50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                Cantidad calculada ({getCurrencySymbol(project.currency)})
              </Label>
              <Input
                value={amount}
                readOnly
                className="bg-[#EEEEEE]"
                tabIndex={-1}
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="amount">
                Cantidad ({getCurrencySymbol(project.currency)}) *
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Porcentaje</Label>
              <Input
                value={percentage ? `${percentage}%` : ""}
                readOnly
                className="bg-[#EEEEEE]"
                tabIndex={-1}
              />
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Fecha *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Método de pago *</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Nota (opcional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Añadir una nota..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Imagen de prueba (opcional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview || "/404.jpg"}
              alt="Comprobante de pago"
              className="h-24 w-auto rounded border object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => {
                setImagePreview(undefined);
                setImageFile(null);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            Subir imagen
          </Button>
        )}
      </div>

      {paymentMethod === "cash" && (
        <SignatureCanvas value={signature} onChange={setSignature} />
      )}

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {initialData ? "Save Changes" : "Add Payment"}
        </Button>
      </div>
    </form>
  );
}
