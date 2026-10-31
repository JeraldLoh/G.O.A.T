import { z } from "zod";
import type { BankSummary } from "@/lib/schemas";

const HistoryItemSchema = z.object({
  bankId: z.string(),
  title: z.string(),
  subject: z.string(),
  viewedAt: z.string(),
  visits: z.number().int().positive().optional(),
});
const HistorySchema = z.array(HistoryItemSchema);
const ViewsSchema = z.record(z.string(), z.number().int().nonnegative());

export type HistoryItem = z.infer<typeof HistoryItemSchema>;

export function readHistory(): HistoryItem[] {
  try {
    return HistorySchema.parse(JSON.parse(localStorage.getItem("kb:history") ?? "[]"));
  } catch {
    return [];
  }
}

export function recordVisit(bank: BankSummary) {
  try {
    const history = readHistory();
    const previous = history.find((item) => item.bankId === bank.id);
    const next: HistoryItem[] = [
      {
        bankId: bank.id,
        title: bank.title,
        subject: bank.subject,
        viewedAt: new Date().toISOString(),
        visits: (previous?.visits ?? 0) + 1,
      },
      ...history.filter((item) => item.bankId !== bank.id),
    ].slice(0, 20);
    localStorage.setItem("kb:history", JSON.stringify(next));
    window.dispatchEvent(new Event("kb:history"));
    recordBankView(bank.id);
  } catch {
    /* Reading remains available if device storage is full. */
  }
}

export function readBankViews(): Record<string, number> {
  try {
    return ViewsSchema.parse(JSON.parse(localStorage.getItem("kb:bank-views") ?? "{}"));
  } catch {
    return {};
  }
}

function recordBankView(bankId: string) {
  const views = readBankViews();
  views[bankId] = (views[bankId] ?? 0) + 1;
  localStorage.setItem("kb:bank-views", JSON.stringify(views));
  window.dispatchEvent(new Event("kb:bank-views"));
}
