export type InvoiceStatus = "Paid" | "Unpaid" | "Overdue" | "Draft" | "Partially paid" | "Void";

export interface InvoiceRecord {
  id: string;
  account: string;
  status: InvoiceStatus;
  dueDate: string;
  amount: number;
}

const accounts = [
  "Northwind Holdings",
  "Globex Corporation",
  "Initech Group",
  "Umbrella Health",
  "Stark Logistics",
  "Wayne Enterprises",
  "Oscorp Industries",
  "Hooli",
];

const statuses: InvoiceStatus[] = ["Paid", "Unpaid", "Overdue", "Draft", "Partially paid"];

export const INVOICES: InvoiceRecord[] = Array.from({ length: 20 }, (_, i) => {
  const status = statuses[i % statuses.length];
  const day = 1 + (i % 28);
  const month = 8 + Math.floor(i / 7);
  const dueDate = `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return {
    id: `INV-${10420 + i}`,
    account: accounts[i % accounts.length],
    status,
    dueDate,
    amount: 1_980 + i * 1_275,
  };
});

export function formatAmount(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDueDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function statusTone(status: InvoiceStatus): "success" | "danger" | "warning" | "neutral" | "info" {
  switch (status) {
    case "Paid":
      return "success";
    case "Overdue":
    case "Void":
      return "danger";
    case "Unpaid":
    case "Partially paid":
      return "warning";
    case "Draft":
      return "neutral";
    default:
      return "info";
  }
}
