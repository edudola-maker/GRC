import { prisma } from "@/lib/prisma";
import { addDays, startOfToday } from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import {
  PLANNING_KIND_LABELS,
  PLANNING_KINDS,
  toIsoDay,
  type PlanifiableEntity,
  type PlanningHorizon,
  type PlanningKind,
} from "@/lib/planning-geometry";

export type {
  PlanifiableEntity,
  PlanningHorizon,
  PlanningKind,
} from "@/lib/planning-geometry";
export {
  PLANNING_HORIZONS,
  PLANNING_KIND_LABELS,
  PLANNING_KINDS,
  bandDayStyle,
  bandStyle,
  toIsoDay,
} from "@/lib/planning-geometry";

export function parsePlanningHorizon(
  raw: string | undefined,
): PlanningHorizon {
  if (raw === "4sem" || raw === "mois" || raw === "semaine") return raw;
  return "semaine";
}

/** Nombre de semaines affichées selon l’horizon. */
export function weeksForHorizon(horizon: PlanningHorizon): number {
  switch (horizon) {
    case "semaine":
      return 1;
    case "4sem":
      return 4;
    case "mois":
      return 5;
  }
}

export type PlanningBand = {
  id: string;
  kind: PlanningKind;
  title: string;
  href: string;
  start: Date;
  end: Date;
  /** Origine métier (conseil, SCI…) — info secondaire */
  source?: string;
  /** Entité persistée pour drag / resize (si éditable). */
  entityType?: PlanifiableEntity;
  entityId?: string;
  /** Plage planifiée brute (ISO jour) avant clamp fenêtre. */
  planStartIso?: string;
  planEndIso?: string;
  /** true = drag/resize met à jour la planification uniquement. */
  editable?: boolean;
  /** Échéance métier affichée (jamais modifiée par le calendrier). */
  echeanceIso?: string;
  /** Charge estimée (jours) — densite visuelle. */
  chargeJours?: number | null;
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

export function clampBandForWindow(
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

/** Résout plage planifiée Projet (≠ échéance). */
export function resolveProjetPlan(p: {
  dateDebut: Date | null;
  dateFinPlanifiee: Date | null;
  dateEcheance: Date | null;
}): { start: Date; end: Date; fromEcheanceFallback: boolean } | null {
  if (p.dateDebut) {
    const start = new Date(p.dateDebut);
    const end = new Date(p.dateFinPlanifiee ?? p.dateDebut);
    return { start, end, fromEcheanceFallback: false };
  }
  // Pas encore de planification : repère visuel sur l’échéance (édition = créer planif).
  if (p.dateEcheance) {
    const day = new Date(p.dateEcheance);
    day.setHours(0, 0, 0, 0);
    return { start: day, end: day, fromEcheanceFallback: true };
  }
  return null;
}

export function resolveTachePlan(t: {
  dateDebut: Date | null;
  dateFinPlanifiee: Date | null;
  dateEcheance: Date | null;
  chargeJours?: number | null;
}): { start: Date; end: Date; fromEcheanceFallback: boolean } | null {
  if (t.dateDebut) {
    const start = new Date(t.dateDebut);
    let end: Date;
    if (t.dateFinPlanifiee) {
      end = new Date(t.dateFinPlanifiee);
    } else if (t.chargeJours && t.chargeJours > 0) {
      end = addDays(start, Math.max(0, Math.ceil(t.chargeJours) - 1));
    } else {
      end = new Date(start);
    }
    return { start, end, fromEcheanceFallback: false };
  }
  if (t.dateEcheance) {
    const day = new Date(t.dateEcheance);
    day.setHours(0, 0, 0, 0);
    return { start: day, end: day, fromEcheanceFallback: true };
  }
  return null;
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
 * Bande = planification ; l’échéance n’est jamais modifiée par le calendrier.
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
          dateFinPlanifiee: true,
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
          OR: [
            { dateDebut: { not: null } },
            {
              priorite: { in: ["HAUTE", "CRITIQUE"] },
              dateEcheance: { not: null },
            },
          ],
          projetId: null,
          missionId: null,
        },
        select: {
          id: true,
          titre: true,
          dateDebut: true,
          dateFinPlanifiee: true,
          dateEcheance: true,
          chargeJours: true,
          conseilId: true,
          controleSCIId: true,
          documentId: true,
        },
        take: 40,
      }),
    ]);

  const bands: PlanningBand[] = [];

  const pushBand = (
    band: Omit<PlanningBand, "start" | "end"> & { start: Date; end: Date },
  ) => {
    const start = new Date(band.start);
    const end = new Date(band.end);
    if (end < start) end.setTime(start.getTime());
    const clamped = clampBandForWindow(start, end, winStart, winEnd);
    if (!clamped) return;
    bands.push({
      ...band,
      start: clamped.start,
      end: clamped.end,
      planStartIso: band.planStartIso ?? toIsoDay(start),
      planEndIso: band.planEndIso ?? toIsoDay(end),
    });
  };

  for (const p of projets) {
    const plan = resolveProjetPlan(p);
    if (!plan) continue;
    pushBand({
      id: `projet-${p.id}`,
      kind: "PROJET",
      title: `${p.code} — ${p.nom}`,
      href: `/projets/${p.id}`,
      start: plan.start,
      end: plan.end,
      source: plan.fromEcheanceFallback
        ? "Projet (repère échéance)"
        : "Projet",
      entityType: "PROJET",
      entityId: p.id,
      editable: true,
      echeanceIso: p.dateEcheance ? toIsoDay(new Date(p.dateEcheance)) : undefined,
      planStartIso: toIsoDay(plan.start),
      planEndIso: toIsoDay(plan.end),
    });
  }

  for (const a of missions) {
    const s = a.dateDebut ?? a.dateFin;
    const e = a.dateFin ?? a.dateDebut;
    if (!s || !e) continue;
    const start = new Date(s);
    const end = new Date(e);
    pushBand({
      id: `mission-${a.id}`,
      kind: "MISSION",
      title: `${a.code} — ${a.titre}`,
      href: `/missions/${a.id}`,
      start,
      end,
      source: "Mission",
      entityType: "MISSION",
      entityId: a.id,
      editable: true,
      planStartIso: toIsoDay(start),
      planEndIso: toIsoDay(end),
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
      editable: false,
      echeanceIso: c.dateEcheance
        ? toIsoDay(new Date(c.dateEcheance))
        : undefined,
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
      editable: false,
      echeanceIso: toIsoDay(end),
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
      editable: false,
      echeanceIso: toIsoDay(end),
    });
  }

  for (const t of actions) {
    if (t.conseilId || t.controleSCIId || t.documentId) continue;
    const plan = resolveTachePlan(t);
    if (!plan) continue;
    pushBand({
      id: `action-${t.id}`,
      kind: "TACHE",
      title: t.titre,
      href: `/taches/${t.id}`,
      start: plan.start,
      end: plan.end,
      source: plan.fromEcheanceFallback
        ? "Action (repère échéance)"
        : "Action",
      entityType: "TACHE",
      entityId: t.id,
      editable: true,
      echeanceIso: t.dateEcheance
        ? toIsoDay(new Date(t.dateEcheance))
        : undefined,
      chargeJours: t.chargeJours,
      planStartIso: toIsoDay(plan.start),
      planEndIso: toIsoDay(plan.end),
    });
  }

  bands.sort((a, b) => a.start.getTime() - b.start.getTime());
  return { window, bands };
}
