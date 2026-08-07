import { addDays, startOfToday } from "@/lib/labels";

export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return d;
}

export function businessDaysBetween(start: Date, end: Date): number {
  const a = new Date(start);
  const b = new Date(end);
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  if (b < a) return 0;
  let count = 0;
  const cur = new Date(a);
  while (cur < b) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

export function nextControleDate(
  from: Date,
  frequence: string,
): Date | null {
  const base = new Date(from);
  base.setHours(12, 0, 0, 0);
  switch (frequence) {
    case "MENSUELLE":
      return addDays(base, 30);
    case "TRIMESTRIELLE":
      return addDays(base, 90);
    case "SEMESTRIELLE":
      return addDays(base, 180);
    case "ANNUELLE":
      return addDays(base, 365);
    case "PONCTUELLE":
      return null;
    default:
      return null;
  }
}

export function nextRevueDate(
  from: Date,
  frequence: string | null | undefined,
): Date | null {
  if (!frequence) return null;
  const base = new Date(from);
  base.setHours(12, 0, 0, 0);
  switch (frequence) {
    case "ANNUELLE":
      return addDays(base, 365);
    case "BIANNUELLE":
      return addDays(base, 730);
    case "TRIENNALE":
      return addDays(base, 1095);
    case "PONCTUELLE":
      return null;
    default:
      return null;
  }
}

export function endOfWeek(from = startOfToday()): Date {
  const d = new Date(from);
  const day = d.getDay(); // 0 dimanche
  const diff = day === 0 ? 0 : 7 - day;
  return addDays(d, diff);
}

export function endOfMonth(from = startOfToday()): Date {
  const d = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}
