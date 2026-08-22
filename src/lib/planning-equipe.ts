import { prisma } from "@/lib/prisma";
import { addDays } from "@/lib/labels";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import {
  clampBandForWindow,
  planningWindow,
  type PlanningBand,
  type PlanningKind,
} from "@/lib/planning";
import { formatUtilisateurNom } from "@/lib/session";

export type PlanningEquipeBand = PlanningBand & {
  /** Durée approximative en jours (inclusifs). */
  durationDays: number;
};

export type PlanningEquipeRow = {
  user: { id: string; nom: string };
  bands: PlanningEquipeBand[];
  /** Somme approx. des durées visibles (jours). */
  chargeDays: number;
};

function durationDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(0.5, Math.round((ms / 86_400_000 + 1) * 2) / 2);
}

/**
 * Planning équipe : mêmes familles que le calendrier collaborateur,
 * regroupées par responsable / assigné.
 */
export async function getPlanningEquipe(
  uniteId: string,
  options?: { weeks?: number; weekOffset?: number },
): Promise<{
  window: ReturnType<typeof planningWindow>;
  rows: PlanningEquipeRow[];
}> {
  const weeks = options?.weeks ?? 5;
  const weekOffset = options?.weekOffset ?? 0;
  const window = planningWindow(weeks, weekOffset);
  const { start: winStart, end: winEnd } = window;

  const [projets, missions, conseils, documents, controles, actions, users] =
    await Promise.all([
      prisma.projet.findMany({
        where: {
          uniteId,
          archive: false,
          statut: { notIn: ["CLOTURE", "ABANDONNE", "IDEE"] },
        },
        select: {
          id: true,
          code: true,
          nom: true,
          dateDebut: true,
          dateEcheance: true,
          responsableId: true,
        },
      }),
      prisma.mission.findMany({
        where: {
          uniteId,
          archive: false,
          statut: { notIn: ["ANNULE"] },
        },
        select: {
          id: true,
          code: true,
          titre: true,
          dateDebut: true,
          dateFin: true,
          responsableId: true,
        },
      }),
      prisma.conseil.findMany({
        where: {
          uniteId,
          archive: false,
          statut: { notIn: ["CLOTURE", "ANNULE"] },
        },
        select: {
          id: true,
          code: true,
          objet: true,
          dateReception: true,
          dateEcheance: true,
          responsableId: true,
        },
      }),
      prisma.document.findMany({
        where: {
          uniteId,
          archive: false,
          prochaineRevue: { not: null },
          statut: { notIn: ["OBSOLETE", "ARCHIVE"] },
        },
        select: {
          id: true,
          code: true,
          nom: true,
          prochaineRevue: true,
          fenetreDeclenchementJours: true,
          responsableId: true,
        },
      }),
      prisma.controleSCI.findMany({
        where: {
          uniteId,
          archive: false,
          statut: "ACTIF",
          dateProchaineEcheance: { not: null },
        },
        select: {
          id: true,
          code: true,
          nom: true,
          dateProchaineEcheance: true,
          fenetreDeclenchementJours: true,
          responsableId: true,
        },
      }),
      prisma.tache.findMany({
        where: {
          uniteId,
          statut: { notIn: [...TACHE_STATUTS_CLOS] },
          priorite: { in: ["HAUTE", "CRITIQUE"] },
          dateEcheance: { not: null },
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
          responsableId: true,
        },
        take: 80,
      }),
      prisma.utilisateur.findMany({
        where: { uniteId, actif: true },
        select: { id: true, nom: true, prenom: true },
        orderBy: { nom: "asc" },
      }),
    ]);

  type Pending = {
    userId: string;
    band: Omit<PlanningBand, "start" | "end"> & { start: Date; end: Date };
  };
  const pending: Pending[] = [];

  const queue = (
    userId: string | null | undefined,
    band: Omit<PlanningBand, "start" | "end"> & { start: Date; end: Date },
  ) => {
    if (!userId) return;
    pending.push({ userId, band });
  };

  for (const p of projets) {
    const s = p.dateDebut ?? p.dateEcheance;
    const e = p.dateEcheance ?? p.dateDebut;
    if (!s || !e) continue;
    queue(p.responsableId, {
      id: `projet-${p.id}`,
      kind: "PROJET" as PlanningKind,
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
    queue(a.responsableId, {
      id: `mission-${a.id}`,
      kind: "MISSION" as PlanningKind,
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
    queue(c.responsableId, {
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
    queue(d.responsableId, {
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
    queue(ctl.responsableId, {
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
    if (t.conseilId || t.controleSCIId || t.documentId) continue;
    const day = new Date(t.dateEcheance);
    day.setHours(0, 0, 0, 0);
    queue(t.responsableId, {
      id: `action-${t.id}`,
      kind: "TACHE",
      title: t.titre,
      href: `/taches/${t.id}`,
      start: day,
      end: day,
      source: "Action",
    });
  }

  const byUser = new Map<string, PlanningEquipeBand[]>();

  for (const { userId, band } of pending) {
    const start = new Date(band.start);
    const end = new Date(band.end);
    if (end < start) end.setTime(start.getTime());
    const clamped = clampBandForWindow(start, end, winStart, winEnd);
    if (!clamped) continue;
    const days = durationDays(clamped.start, clamped.end);
    const list = byUser.get(userId) ?? [];
    list.push({
      ...band,
      start: clamped.start,
      end: clamped.end,
      durationDays: days,
    });
    byUser.set(userId, list);
  }

  const userMap = new Map(
    users.map((u) => [u.id, { id: u.id, nom: formatUtilisateurNom(u) }]),
  );
  const rows: PlanningEquipeRow[] = [];

  for (const [userId, bands] of byUser) {
    const u = userMap.get(userId);
    if (!u) continue;
    bands.sort((a, b) => a.start.getTime() - b.start.getTime());
    const chargeDays =
      Math.round(bands.reduce((s, b) => s + b.durationDays, 0) * 10) / 10;
    rows.push({ user: u, bands, chargeDays });
  }

  rows.sort((a, b) => a.user.nom.localeCompare(b.user.nom, "fr"));

  return { window, rows };
}
