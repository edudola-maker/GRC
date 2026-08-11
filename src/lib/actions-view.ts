import type { Prisma } from "@/generated/prisma/client";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { addDays, startOfToday } from "@/lib/labels";
import { endOfWeek } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { filterActiveOperationnelles } from "@/lib/tache-dependances";

export const tacheActionInclude = {
  responsable: true,
  projet: true,
  conseil: true,
  controleSCI: true,
  mission: true,
  document: true,
} satisfies Prisma.TacheInclude;

export type TacheAction = Prisma.TacheGetPayload<{
  include: typeof tacheActionInclude;
}>;

export function origineAction(t: TacheAction): { label: string; href?: string } {
  if (t.projet) return { label: t.projet.nom, href: `/projets/${t.projet.id}` };
  if (t.conseil) return { label: t.conseil.objet, href: `/conseils/${t.conseil.id}` };
  if (t.controleSCI)
    return { label: t.controleSCI.nom, href: `/controles-sci/${t.controleSCI.id}` };
  if (t.mission) return { label: t.mission.titre, href: `/missions/${t.mission.id}` };
  if (t.document) return { label: t.document.nom, href: `/documents/${t.document.id}` };
  return { label: "Action libre" };
}

/** Exclut les actions SCI/document encore hors fenêtre de déclenchement. */
function dansFenetreDeclenchement(t: TacheAction, today: Date): boolean {
  if (t.controleSCI?.dateProchaineEcheance) {
    const fenetre = t.controleSCI.fenetreDeclenchementJours ?? 30;
    const start = addDays(new Date(t.controleSCI.dateProchaineEcheance), -fenetre);
    start.setHours(0, 0, 0, 0);
    return today >= start;
  }
  if (t.document?.prochaineRevue) {
    const fenetre = t.document.fenetreDeclenchementJours ?? 30;
    const start = addDays(new Date(t.document.prochaineRevue), -fenetre);
    start.setHours(0, 0, 0, 0);
    return today >= start;
  }
  return true;
}

export async function getMesActions(utilisateurId: string) {
  const today = startOfToday();
  const week = endOfWeek(today);

  const [ouvertesBrutes, terminees] = await Promise.all([
    prisma.tache.findMany({
      where: {
        responsableId: utilisateurId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
      },
      include: tacheActionInclude,
      orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
    }),
    prisma.tache.findMany({
      where: { responsableId: utilisateurId, statut: "TERMINE" },
      include: tacheActionInclude,
      orderBy: [{ dateValidation: "desc" }, { modifieLe: "desc" }],
      take: 20,
    }),
  ]);

  const ouvertes = (
    await filterActiveOperationnelles(ouvertesBrutes)
  ).filter((t) => dansFenetreDeclenchement(t, today));

  const retard: TacheAction[] = [];
  const aujourdhui: TacheAction[] = [];
  const semaine: TacheAction[] = [];
  const avenir: TacheAction[] = [];

  for (const t of ouvertes) {
    if (!t.dateEcheance) {
      avenir.push(t);
      continue;
    }
    const d = new Date(t.dateEcheance);
    d.setHours(0, 0, 0, 0);
    if (d < today) retard.push(t);
    else if (d.getTime() === today.getTime()) aujourdhui.push(t);
    else if (d <= week) semaine.push(t);
    else avenir.push(t);
  }

  return {
    retard,
    aujourdhui,
    semaine,
    avenir,
    terminees,
    totalOuvertes: ouvertes.length,
    meta: { today, week },
  };
}

export type MonitoringFilters = {
  collaborateurId?: string;
  type?: string;
  statut?: string;
  priorite?: string;
  echeance?: "retard" | "proche" | "toutes";
};

export async function getActionsUnite(
  uniteId: string,
  filters: MonitoringFilters = {},
) {
  const today = startOfToday();
  const soon = addDays(today, 7);

  const where: Prisma.TacheWhereInput = {
    uniteId,
    statut: { notIn: [...TACHE_STATUTS_CLOS] },
  };

  if (filters.collaborateurId) where.responsableId = filters.collaborateurId;
  if (filters.statut) where.statut = filters.statut as never;
  if (filters.priorite) where.priorite = filters.priorite as never;

  if (filters.type === "PROJET") where.projetId = { not: null };
  else if (filters.type === "CONSEIL") where.conseilId = { not: null };
  else if (filters.type === "SCI") where.controleSCIId = { not: null };
  else if (filters.type === "MISSION" || filters.type === "AUDIT")
    where.missionId = { not: null };
  else if (filters.type === "DOCUMENT") where.documentId = { not: null };
  else if (filters.type === "LIBRE") {
    where.projetId = null;
    where.conseilId = null;
    where.controleSCIId = null;
    where.missionId = null;
    where.documentId = null;
  }

  if (filters.echeance === "retard") where.dateEcheance = { lt: today };
  else if (filters.echeance === "proche") {
    where.dateEcheance = { gte: today, lte: soon };
  }

  const actionsBrutes = await prisma.tache.findMany({
    where,
    include: tacheActionInclude,
    orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
    take: 120,
  });

  const actionsActives = await filterActiveOperationnelles(actionsBrutes);
  const actions = actionsActives.filter((t) =>
    dansFenetreDeclenchement(t, today),
  );

  const chargeParCollaborateur = await prisma.tache.groupBy({
    by: ["responsableId"],
    where: {
      uniteId,
      statut: { notIn: [...TACHE_STATUTS_CLOS] },
    },
    _count: { _all: true },
  });

  return { actions, chargeParCollaborateur, today, soon };
}
