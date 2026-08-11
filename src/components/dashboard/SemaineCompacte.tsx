import Link from "next/link";
import { formatDate } from "@/lib/labels";

type DayItem = {
  id: string;
  titre: string;
  href: string;
  /** true = échéance ; false = plage planifiée */
  isEcheance: boolean;
};

type DayCol = {
  key: string;
  label: string;
  isToday: boolean;
  items: DayItem[];
};

/** Petite vue semaine — distingue échéance vs plage planifiée. */
export function SemaineCompacte({ days }: { days: DayCol[] }) {
  return (
    <div className="semaine-compacte" aria-label="Semaine">
      {days.map((d) => (
        <div
          key={d.key}
          className={`semaine-compacte__day${d.isToday ? " is-today" : ""}`}
        >
          <strong>{d.label}</strong>
          {d.items.length === 0 ? (
            <span className="muted">—</span>
          ) : (
            <ul>
              {d.items.slice(0, 3).map((it) => (
                <li key={it.id}>
                  <Link href={it.href} title={it.titre}>
                    {it.isEcheance ? "⚑ " : "▸ "}
                    {it.titre}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export function buildSemaineDays(
  actions: {
    id: string;
    titre: string;
    href: string;
    dateEcheance: Date | null;
    dateDebut?: Date | null;
  }[],
  today = new Date(),
): DayCol[] {
  const start = startOfWeek(today);
  const days: DayCol[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const key = d.toISOString().slice(0, 10);
    const items: DayItem[] = [];
    for (const a of actions) {
      if (a.dateEcheance && sameDay(a.dateEcheance, d)) {
        items.push({
          id: `${a.id}-ech`,
          titre: a.titre,
          href: a.href,
          isEcheance: true,
        });
      } else if (a.dateDebut && sameDay(a.dateDebut, d)) {
        items.push({
          id: `${a.id}-plan`,
          titre: a.titre,
          href: a.href,
          isEcheance: false,
        });
      }
    }
    days.push({
      key,
      label: formatDayLabel(d),
      isToday: sameDay(d, today),
      items,
    });
  }
  return days;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7; // lundi = 0
  x.setDate(x.getDate() - day);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(d: Date) {
  const jours = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
  const i = (d.getDay() + 6) % 7;
  return `${jours[i]} ${d.getDate()}`;
}

// silence unused import if tree-shaken oddly
void formatDate;
