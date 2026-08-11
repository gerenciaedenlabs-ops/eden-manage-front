export type Currency = "COP" | "USD" | "EUR" | "GBP" | "MXN" | "BRL";

export type ProjectMode = "flexible" | "phases";

export type PhaseStatus = "pending" | "in-progress" | "paid";

export type ProjectStatus = "pending" | "in-progress" | "paid";

export type PartyRole = "issuer" | "recipient";

export type PaymentMethod = "bank-transfer" | "cash" | "other";

export interface InvolvedParty {
  id: string;
  name: string;
  role: PartyRole;
  note?: string;
}

export interface Phase {
  id: string;
  name: string;
  price: number;
  status: PhaseStatus;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  image?: string; // base64
  signature?: string;
  phaseId?: string; // only for phases mode
  projectId: string;
  paymentMethod: PaymentMethod;
  percentage?: number;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  description?: string;
  currency: Currency;
  mode: ProjectMode;
  totalPrice: number;
  initialPaymentPercentage?: number; // only for flexible mode
  phases?: Phase[]; // only for phases mode
  parties: InvolvedParty[];
  createdAt: string;
}

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] =
  [
    { value: "COP", label: "Colombian Peso", symbol: "$" },
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "\u20AC" },
    { value: "GBP", label: "British Pound", symbol: "\u00A3" },
    { value: "MXN", label: "Mexican Peso", symbol: "$" },
    { value: "BRL", label: "Brazilian Real", symbol: "R$" },
  ];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash (Physical)" },
  { value: "other", label: "Other" },
];

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES.find((c) => c.value === currency)?.symbol || "$";
}

export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label || method;
}
