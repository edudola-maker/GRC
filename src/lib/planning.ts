import { prisma } from "@/lib/prisma";
import { addDays, startOfToday } from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";

/** Familles visibles dans le calendrier (vue synthétique). */
export type PlanningKind = "PROJET" | "MISSION" | "TACHE";

export const PLANNING_KINDS: PlanningKind[] = ["PROJET", "MISSION", "TACHE"];

export type PlanningBand = {
  id: string;
  kind: PlanningKind;
  title: string;
  href: string;
  start: Date;
  end: Date;
  /** Origine métier (conseil, SCI…) — info secondaire */
  source?: string;
};

export const PLANNING_KIND_LABELS: Record<PlanningKind, string> = {
  PROJET: "Projet",
  MISSION: "Mission",
  TACHE: "Tâche",
};

export const DEFAULT_PLANNING_WEEKS = 20;

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function isoWeekNumber(d: Date): number {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/** Ex. "24–30 août" ou "31 août – 6 sept." */
export function formatWeekRange(weekStart: Date, weekEnd: Date): string {
  const d1 = weekStart.getDate();
  const d2 = weekEnd.getDate();
  const m1 = MONTHS_SHORT[weekStart.getMonth()];
  const m2 = MONTHS_SHORT[weekEnd.getMonth()];
  const y1 = weekStart.getFullYear();
  const y2 = weekEnd.getFullYear();
  if (m1 === m2 && y1 === y2) return `${d1}–${d2} ${m1}`;
  if (y1 === y2) return `${d1} ${m1} – ${d2} ${m2}`;
  return `${d1} ${m1} ${y1} – ${d2} ${m2} ${y2}`;
}

/**
 * Fenêtre de planification.
 * @param weekOffset décalage en semaines par rapport à la semaine courante (négatif = passé)
 */
export function planningWindow(
  weeks = DEFAULT_PLANNING_WEEKS,
  weekOffset = 0,
) {
  const start = addDays(startOfWeek(startOfToday()), weekOffset * 7);
  const end = addDays(start, weeks * 7 - 1);
  const columns = Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(start, i * 7);
    const weekEnd = addDays(weekStart, 6);
    const num = isoWeekNumber(weekStart);
    return {
      index: i,
      start: weekStart,
      end: weekEnd,
      weekNumber: num,
      labelShort: `S${num}`,
      labelDates: formatWeekRange(weekStart, weekEnd),
      labelFull: `Semaine ${num} — ${formatWeekRange(weekStart, weekEnd)}`,
    };
  });
  return { start, end, columns, weeks, weekOffset };
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

function clampBand(
  start: Date,
  end: Date,
  winStart: Date,
  winEnd: Date,
): { start: Date; end: Date } | null {
  if (!overlaps(start, end, winStart, winEnd)) return null;
  return {
    start: start < winStart ? winStart : start,
    end: end > winEnd ? winEnd : end,
  };
}

export function bandStyle(
  bandStart: Date,
  bandEnd: Date,
  winStart: Date,
  weeks: number,
): { gridColumn: string } {
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  let startIdx = Math.floor(
    (bandStart.getTime() - winStart.getTime()) / msWeek,
  );
  let endIdx = Math.floor((bandEnd.getTime() - winStart.getTime()) / msWeek);
  startIdx = Math.max(0, Math.min(weeks - 1, startIdx));
  endIdx = Math.max(startIdx, Math.min(weeks - 1, endIdx));
  return { gridColumn: `${startIdx + 1} / ${endIdx + 2}` };
}

export function parsePlanningFilters(
  raw: string | undefined,
): Set<PlanningKind> {
  if (!raw || raw === "all") return new Set(PLANNING_KINDS);
  const parts = raw
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p): p is PlanningKind =>
      PLANNING_KINDS.includes(p as PlanningKind),
    );
  if (parts.length === 0) return new Set(PLANNING_KINDS);
  return new Set(parts);
}

/**
 * Grandes plages de travail du collaborateur.
 * Familles calendrier : Projet | Mission | Tâche (conseils, SCI, revues, actions…).
 */
export async function getPlanningCollaborateur(
  utilisateurId: string,
  uniteId: string,
  options?: { weeks?: number; weekOffset?: number },
): Promise<{
  window: ReturnType<typeof planningWindow>;
  bands: PlanningBand[];
}> {
  const weeks = options?.weeks ?? DEFAULT_PLANNING_WEEKS;
  const weekOffset = options?.weekOffset ?? 0;
  const window = planningWindow(weeks, weekOffset);
  const { start: winStart, end: winEnd } = window;

  const [projets, missions, conseils, documents, controles, actions] =
    await Promise.all([
      prisma.projet.findMany({
        where: {
          uniteId,
          archive: false,
          OR: [
            { responsableId: utilisateurId },
            { membres: { some: { utilisateurId } } },
          ],
          statut: { notIn: ["CLOTURE", "ABANDONNE", "IDEE"] },
        },
        select: {
          id: true,
          code: true,
          nom: true,
          dateDebut: true,
          dateEcheance: true,
        },
      }),
      prisma.mission.findMany({
        where: {
          uniteId,
          archive: false,
          OR: [
            { responsableId: utilisateurId },
            { membres: { some: { utilisateurId } } },
          ],
          statut: { notIn: ["ANNULE"] },
        },
        select: {
          id: true,
          code: true,
          titre: true,
          dateDebut: true,
          dateFin: true,
        },
      }),
      prisma.conseil.findMany({
        where: {
          uniteId,
          archive: false,
          responsableId: utilisateurId,
          statut: { notIn: ["CLOTURE", "ANNULE"] },
        },
        select: {
          id: true,
          code: true,
          objet: true,
          dateReception: true,
          dateEcheance: true,
        },
      }),
      prisma.document.findMany({
        where: {
          uniteId,
          archive: false,
          responsableId: utilisateurId,
          prochaineRevue: { not: null },
          statut: { notIn: ["OBSOLETE", "ARCHIVE"] },
        },
        select: {
          id: true,
          code: true,
          nom: true,
          prochaineRevue: true,
          fenetreDeclenchementJours: true,
        },
      }),
      prisma.controleSCI.findMany({
        where: {
          uniteId,
          archive: false,
          responsableId: utilisateurId,
          statut: "ACTIF",
          dateProchaineEcheance: { not: null },
        },
        select: {
          id: true,
          code: true,
          nom: true,
          dateProchaineEcheance: true,
          fenetreDeclenchementJours: true,
        },
      }),
      prisma.tache.findMany({
        where: {
          uniteId,
          responsableId: utilisateurId,
          statut: { notIn: [...TACHE_STATUTS_CLOS] },
          priorite: { in: ["HAUTE", "CRITIQUE"] },
          dateEcheance: { not: null },
          // Éviter de doubler les tâches déjà représentées via leur objet métier
          projetId: null,
          missionId: null,
        },
        select: {
          id: true,
          titre: true,
          dateEcheance: true,
          conseilId: true,
          controleSCIId: true,
          documentId: true,
        },
        take: 30,
      }),
    ]);

  const bands: PlanningBand[] = [];

  const pushBand = (
    band: Omit<PlanningBand, "start" | "end"> & { start: Date; end: Date },
  ) => {
    const start = new Date(band.start);
    const end = new Date(band.end);
    if (end < start) end.setTime(start.getTime());
    const clamped = clampBand(start, end, winStart, winEnd);
    if (!clamped) return;
    bands.push({ ...band, start: clamped.start, end: clamped.end });
  };

  for (const p of projets) {
    const s = p.dateDebut ?? p.dateEcheance;
    const e = p.dateEcheance ?? p.dateDebut;
    if (!s || !e) continue;
    pushBand({
      id: `projet-${p.id}`,
      kind: "PROJET",
      title: `${p.code} — ${p.nom}`,
      href: `/projets/${p.id}`,
      start: new Date(s),
      end: new Date(e),
      source: "Projet",
    });
  }

  for (const a of missions) {
    const s = a.dateDebut ?? a.dateFin;
    const e = a.dateFin ?? a.dateDebut;
    if (!s || !e) continue;
    pushBand({
      id: `mission-${a.id}`,
      kind: "MISSION",
      title: `${a.code} — ${a.titre}`,
      href: `/missions/${a.id}`,
      start: new Date(s),
      end: new Date(e),
      source: "Mission",
    });
  }

  for (const c of conseils) {
    const start = new Date(c.dateReception);
    const end = c.dateEcheance ? new Date(c.dateEcheance) : addDays(start, 5);
    pushBand({
      id: `conseil-${c.id}`,
      kind: "TACHE",
      title: `${c.code} — ${c.objet}`,
      href: `/conseils/${c.id}`,
      start,
      end,
      source: "Conseil",
    });
  }

  for (const d of documents) {
    if (!d.prochaineRevue) continue;
    const end = new Date(d.prochaineRevue);
    const start = addDays(end, -(d.fenetreDeclenchementJours || 30));
    pushBand({
      id: `doc-${d.id}`,
      kind: "TACHE",
      title: `${d.code} — Revue ${d.nom}`,
      href: `/documents/${d.id}`,
      start,
      end,
      source: "Revue documentaire",
    });
  }

  for (const ctl of controles) {
    if (!ctl.dateProchaineEcheance) continue;
    const end = new Date(ctl.dateProchaineEcheance);
    const start = addDays(end, -(ctl.fenetreDeclenchementJours || 30));
    pushBand({
      id: `sci-${ctl.id}`,
      kind: "TACHE",
      title: `${ctl.code} — ${ctl.nom}`,
      href: `/controles-sci/${ctl.id}`,
      start,
      end,
      source: "Contrôle SCI",
    });
  }

  for (const t of actions) {
    if (!t.dateEcheance) continue;
    // Si déjà couvert via conseil/SCI/doc lié, on saute
    if (t.conseilId || t.controleSCIId || t.documentId) continue;
    const day = new Date(t.dateEcheance);
    day.setHours(0, 0, 0, 0);
    pushBand({
      id: `action-${t.id}`,
      kind: "TACHE",
      title: t.titre,
      href: `/taches/${t.id}`,
      start: day,
      end: day,
      source: "Action",
    });
  }

  bands.sort((a, b) => a.start.getTime() - b.start.getTime());
  return { window, bands };
}
