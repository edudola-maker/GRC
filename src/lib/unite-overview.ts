import { prisma } from "@/lib/prisma";
import { TACHE_STATUTS_CLOS } from "@/lib/catalog";

/** Compteurs de pilotage synthétique pour la fiche Unité (calculés, non saisis). */
export type UnitePilotage = {
  objectifsEnCours: number;
  projetsActifs: number;
  missionsEnCours: number;
  tachesAVenir: number;
  tachesEnRetard: number;
  processusActifs: number;
  risquesOuverts: number;
  conseilsOuverts: number;
};

const PROJET_ACTIFS = [
  "IDEE",
  "A_ETUDIER",
  "VALIDE",
  "PLANIFIE",
  "EN_COURS",
  "EN_VALIDATION",
  "DEPLOYE",
] as const;

const MISSION_EN_COURS = ["PLANIFIE", "EN_COURS", "EN_REVUE"] as const;
const CONSEIL_OUVERTS = ["RECU", "EN_COURS", "EN_ATTENTE", "REPONDU"] as const;
const RISQUE_OUVERTS = [
  "IDENTIFIE",
  "EN_EVALUATION",
  "EN_TRAITEMENT",
  "MAITRISE",
  "ACCEPTE",
] as const;

export async function getUnitePilotage(uniteId: string): Promise<UnitePilotage> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);

  const [
    objectifsEnCours,
    projetsActifs,
    missionsEnCours,
    tachesAVenir,
    tachesEnRetard,
    processusActifs,
    risquesOuverts,
    conseilsOuverts,
  ] = await Promise.all([
    prisma.objectif.count({
      where: { uniteId, statut: "EN_COURS" },
    }),
    prisma.projet.count({
      where: {
        uniteId,
        archive: false,
        statut: { in: [...PROJET_ACTIFS] },
      },
    }),
    prisma.mission.count({
      where: {
        uniteId,
        archive: false,
        statut: { in: [...MISSION_EN_COURS] },
      },
    }),
    prisma.tache.count({
      where: {
        uniteId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        dateEcheance: { gte: today, lte: in30 },
      },
    }),
    prisma.tache.count({
      where: {
        uniteId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        dateEcheance: { lt: today },
      },
    }),
    prisma.processus.count({
      where: { uniteId, archive: false, statut: "ACTIF" },
    }),
    prisma.risque.count({
      where: {
        uniteId,
        archive: false,
        statut: { in: [...RISQUE_OUVERTS] },
      },
    }),
    prisma.conseil.count({
      where: {
        uniteId,
        archive: false,
        statut: { in: [...CONSEIL_OUVERTS] },
      },
    }),
  ]);

  return {
    objectifsEnCours,
    projetsActifs,
    missionsEnCours,
    tachesAVenir,
    tachesEnRetard,
    processusActifs,
    risquesOuverts,
    conseilsOuverts,
  };
}
