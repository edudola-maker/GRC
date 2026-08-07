import { prisma } from "@/lib/prisma";
import { addDays, startOfToday } from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";

export type PlanningKind =
  | "PROJET"
  | "AUDIT"
  | "CONSEIL"
  | "DOCUMENT"
  | "ACTION";

export type PlanningBand = {
  id: string;
  kind: PlanningKind;
  title: string;
  href: string;
  start: Date;
  end: Date;
  meta?: string;
};

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 dimanche
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function isoWeekLabel(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `S${week}`;
}

/** Fenêtre de planification : 16 semaines à partir de la semaine courante. */
export function planningWindow(weeks = 16) {
  const start = startOfWeek(startOfToday());
  const end = addDays(start, weeks * 7 - 1);
  const columns = Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(start, i * 7);
    return {
      index: i,
      start: weekStart,
      end: addDays(weekStart, 6),
      label: isoWeekLabel(weekStart),
    };
  });
  return { start, end, columns, weeks };
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

/** Position CSS d'une plage dans la grille de semaines. */
export function bandStyle(
  bandStart: Date,
  bandEnd: Date,
  winStart: Date,
  weeks: number,
): { gridColumn: string } {
  const msWeek = 7 * 24 * 60 * 60 * 1000;
  let startIdx = Math.floor((bandStart.getTime() - winStart.getTime()) / msWeek);
  let endIdx = Math.floor((bandEnd.getTime() - winStart.getTime()) / msWeek);
  startIdx = Math.max(0, Math.min(weeks - 1, startIdx));
  endIdx = Math.max(startIdx, Math.min(weeks - 1, endIdx));
  return { gridColumn: `${startIdx + 1} / ${endIdx + 2}` };
}

/**
 * Grandes plages de travail du collaborateur (pas un calendrier Outlook).
 * Sources : projets, audits, conseils, revues documentaires, actions importantes.
 */
export async function getPlanningCollaborateur(
  utilisateurId: string,
  uniteId: string,
  weeks = 16,
): Promise<{ window: ReturnType<typeof planningWindow>; bands: PlanningBand[] }> {
  const window = planningWindow(weeks);
  const { start: winStart, end: winEnd } = window;

  const [projets, audits, conseils, documents, actions] = await Promise.all([
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
        statut: true,
      },
    }),
    prisma.audit.findMany({
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
        statut: true,
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
        statut: true,
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
    prisma.tache.findMany({
      where: {
        uniteId,
        responsableId: utilisateurId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        priorite: { in: ["HAUTE", "CRITIQUE"] },
        dateEcheance: { not: null },
      },
      select: {
        id: true,
        titre: true,
        dateEcheance: true,
        priorite: true,
      },
      take: 20,
    }),
  ]);

  const bands: PlanningBand[] = [];

  for (const p of projets) {
    const s = p.dateDebut ?? p.dateEcheance;
    const e = p.dateEcheance ?? p.dateDebut;
    if (!s || !e) continue;
    const start = new Date(s);
    const end = new Date(e);
    if (end < start) end.setTime(start.getTime());
    const clamped = clampBand(start, end, winStart, winEnd);
    if (!clamped) continue;
    bands.push({
      id: `projet-${p.id}`,
      kind: "PROJET",
      title: `${p.code} — ${p.nom}`,
      href: `/projets/${p.id}`,
      start: clamped.start,
      end: clamped.end,
      meta: p.statut,
    });
  }

  for (const a of audits) {
    const s = a.dateDebut ?? a.dateFin;
    const e = a.dateFin ?? a.dateDebut;
    if (!s || !e) continue;
    const start = new Date(s);
    const end = new Date(e);
    if (end < start) end.setTime(start.getTime());
    const clamped = clampBand(start, end, winStart, winEnd);
    if (!clamped) continue;
    bands.push({
      id: `audit-${a.id}`,
      kind: "AUDIT",
      title: `${a.code} — ${a.titre}`,
      href: `/audits/${a.id}`,
      start: clamped.start,
      end: clamped.end,
      meta: a.statut,
    });
  }

  for (const c of conseils) {
    const start = new Date(c.dateReception);
    const end = c.dateEcheance ? new Date(c.dateEcheance) : addDays(start, 5);
    if (end < start) end.setTime(start.getTime());
    const clamped = clampBand(start, end, winStart, winEnd);
    if (!clamped) continue;
    bands.push({
      id: `conseil-${c.id}`,
      kind: "CONSEIL",
      title: `${c.code} — ${c.objet}`,
      href: `/conseils/${c.id}`,
      start: clamped.start,
      end: clamped.end,
      meta: c.statut,
    });
  }

  for (const d of documents) {
    if (!d.prochaineRevue) continue;
    const end = new Date(d.prochaineRevue);
    const start = addDays(end, -(d.fenetreDeclenchementJours || 30));
    const clamped = clampBand(start, end, winStart, winEnd);
    if (!clamped) continue;
    bands.push({
      id: `doc-${d.id}`,
      kind: "DOCUMENT",
      title: `${d.code} — Revue ${d.nom}`,
      href: `/documents/${d.id}`,
      start: clamped.start,
      end: clamped.end,
    });
  }

  for (const t of actions) {
    if (!t.dateEcheance) continue;
    const day = new Date(t.dateEcheance);
    day.setHours(0, 0, 0, 0);
    const clamped = clampBand(day, day, winStart, winEnd);
    if (!clamped) continue;
    bands.push({
      id: `action-${t.id}`,
      kind: "ACTION",
      title: t.titre,
      href: `/taches/${t.id}`,
      start: clamped.start,
      end: clamped.end,
      meta: t.priorite,
    });
  }

  bands.sort((a, b) => a.start.getTime() - b.start.getTime());
  return { window, bands };
}

export const PLANNING_KIND_LABELS: Record<PlanningKind, string> = {
  PROJET: "Projet",
  AUDIT: "Audit",
  CONSEIL: "Conseil",
  DOCUMENT: "Revue documentaire",
  ACTION: "Action importante",
};
