export function formatCurrency(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCurrencyUnsigned(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function plColor(value: number): string {
  if (value > 0) return "text-positive";
  if (value < 0) return "text-negative";
  return "text-muted-foreground";
}
