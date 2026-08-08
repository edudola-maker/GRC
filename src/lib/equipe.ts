import { prisma } from "@/lib/prisma";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";
import { startOfToday } from "@/lib/labels";

export type EquipeCollaborateurSnapshot = {
  utilisateurId: string;
  nom: string;
  projetsEnCours: number;
  conseilsEnCours: number;
  auditsEnCours: number;
  tachesEnCours: number;
  controlesEnCours: number;
  elementsEnRetard: number;
  chargeApproximative: number;
  objectifs: Array<{
    id: string;
    objectif: string;
    progression: number;
    attenduAnnuel: string | null;
    realiseADate: string | null;
    dateEcheance: Date | null;
  }>;
};

export async function getEquipeOverview(
  uniteId: string,
): Promise<EquipeCollaborateurSnapshot[]> {
  const today = startOfToday();
  const users = await prisma.utilisateur.findMany({
    where: { actif: true, uniteId },
    orderBy: { nom: "asc" },
    include: {
      objectifs: {
        where: { annee: today.getFullYear(), uniteId },
        orderBy: { creeLe: "asc" },
      },
    },
  });

  const result: EquipeCollaborateurSnapshot[] = [];

  for (const u of users) {
    const [
      projetsEnCours,
      conseilsEnCours,
      auditsEnCours,
      tachesEnCours,
      controlesEnCours,
      tachesRetard,
      projetsRetard,
      conseilsRetard,
      controlesRetard,
    ] = await Promise.all([
      prisma.projet.count({
        where: {
          uniteId,
          archive: false,
          responsableId: u.id,
          statut: {
            in: ["VALIDE", "PLANIFIE", "EN_COURS", "EN_VALIDATION", "DEPLOYE"],
          },
        },
      }),
      prisma.conseil.count({
        where: {
          uniteId,
          archive: false,
          responsableId: u.id,
          statut: { notIn: ["CLOTURE", "ANNULE", "REPONDU"] },
        },
      }),
      prisma.mission.count({
        where: {
          uniteId,
          archive: false,
          responsableId: u.id,
          statut: { in: ["PLANIFIE", "EN_COURS", "EN_REVUE"] },
        },
      }),
      prisma.tache.count({
        where: {
          uniteId,
          responsableId: u.id,
          statut: { notIn: [...TACHE_STATUTS_CLOS] },
        },
      }),
      prisma.controleSCI.count({
        where: {
          uniteId,
          archive: false,
          responsableId: u.id,
          statut: "ACTIF",
        },
      }),
      prisma.tache.count({
        where: {
          uniteId,
          responsableId: u.id,
          statut: { notIn: [...TACHE_STATUTS_CLOS] },
          dateEcheance: { lt: today },
        },
      }),
      prisma.projet.count({
        where: {
          uniteId,
          archive: false,
          responsableId: u.id,
          statut: { notIn: ["CLOTURE", "ABANDONNE"] },
          dateEcheance: { lt: today },
        },
      }),
      prisma.conseil.count({
        where: {
          uniteId,
          archive: false,
          responsableId: u.id,
          statut: { notIn: ["CLOTURE", "ANNULE", "REPONDU"] },
          dateEcheance: { lt: today },
        },
      }),
      prisma.controleSCI.count({
        where: {
          uniteId,
          archive: false,
          responsableId: u.id,
          statut: "ACTIF",
          dateProchaineEcheance: { lt: today },
        },
      }),
    ]);

    const elementsEnRetard =
      tachesRetard + projetsRetard + conseilsRetard + controlesRetard;
    const chargeApproximative =
      tachesEnCours + projetsEnCours + conseilsEnCours + controlesEnCours;

    result.push({
      utilisateurId: u.id,
      nom: u.nom,
      projetsEnCours,
      conseilsEnCours,
      auditsEnCours,
      tachesEnCours,
      controlesEnCours,
      elementsEnRetard,
      chargeApproximative,
      objectifs: u.objectifs.map((o) => ({
        id: o.id,
        objectif: o.objectif,
        progression: o.progression,
        attenduAnnuel: o.attenduAnnuel,
        realiseADate: o.realiseADate,
        dateEcheance: o.dateEcheance,
      })),
    });
  }

  return result;
}
