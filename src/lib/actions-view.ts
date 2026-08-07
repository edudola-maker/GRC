import type { Prisma } from "@/generated/prisma/client";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { addDays, startOfToday } from "@/lib/labels";
import { endOfWeek } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const tacheActionInclude = {
  responsable: true,
  projet: true,
  conseil: true,
  controleSCI: true,
  audit: true,
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
  if (t.audit) return { label: t.audit.titre, href: `/audits/${t.audit.id}` };
  if (t.document) return { label: t.document.nom, href: `/documents/${t.document.id}` };
  return { label: "Action libre" };
}

export type BucketActions = "retard" | "aujourdhui" | "semaine" | "avenir";

export async function getMesActions(utilisateurId: string) {
  const today = startOfToday();
  const week = endOfWeek(today);
  const tomorrow = addDays(today, 1);

  const ouvertes = await prisma.tache.findMany({
    where: {
      responsableId: utilisateurId,
      statut: { notIn: [...TACHE_STATUTS_CLOS] },
    },
    include: tacheActionInclude,
    orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
  });

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

  // Actions à valider sans échéance proche : rattachées à "aujourd'hui" si soumises
  const aValider = ouvertes.filter((t) => t.statut === "A_VALIDER");

  return {
    retard,
    aujourdhui,
    semaine,
    avenir,
    aValider,
    totalOuvertes: ouvertes.length,
    meta: { today, week, tomorrow },
  };
}

export type MonitoringFilters = {
  collaborateurId?: string;
  type?: string;
  statut?: string;
  priorite?: string;
  echeance?: "retard" | "proche" | "toutes";
};

export async function getActionsUnite(filters: MonitoringFilters = {}) {
  const today = startOfToday();
  const soon = addDays(today, 7);

  const where: Prisma.TacheWhereInput = {
    statut: { notIn: [...TACHE_STATUTS_CLOS] },
  };

  if (filters.collaborateurId) where.responsableId = filters.collaborateurId;
  if (filters.statut) where.statut = filters.statut as never;
  if (filters.priorite) where.priorite = filters.priorite as never;

  if (filters.type === "PROJET") where.projetId = { not: null };
  else if (filters.type === "CONSEIL") where.conseilId = { not: null };
  else if (filters.type === "SCI") where.controleSCIId = { not: null };
  else if (filters.type === "AUDIT") where.auditId = { not: null };
  else if (filters.type === "DOCUMENT") where.documentId = { not: null };
  else if (filters.type === "LIBRE") {
    where.projetId = null;
    where.conseilId = null;
    where.controleSCIId = null;
    where.auditId = null;
    where.documentId = null;
  }

  if (filters.echeance === "retard") {
    where.dateEcheance = { lt: today };
  } else if (filters.echeance === "proche") {
    where.dateEcheance = { gte: today, lte: soon };
  }

  const actions = await prisma.tache.findMany({
    where,
    include: tacheActionInclude,
    orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
    take: 100,
  });

  const chargeParCollaborateur = await prisma.tache.groupBy({
    by: ["responsableId"],
    where: { statut: { notIn: [...TACHE_STATUTS_CLOS] } },
    _count: { _all: true },
  });

  return { actions, chargeParCollaborateur, today, soon };
}
