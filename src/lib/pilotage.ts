import { prisma } from "@/lib/prisma";
import { addDays, startOfToday, SOON_DAYS } from "@/lib/labels";

const TACHE_CLOSES = ["TERMINE", "ANNULE"] as const;

export async function getPilotageDashboard() {
  const today = startOfToday();
  const soon = addDays(today, SOON_DAYS);

  const [
    projetsEnCours,
    tachesOuvertes,
    tachesEnRetard,
    tachesAValider,
    controlesAVenir,
    controlesEnRetard,
    listeTachesEnRetard,
    listeTachesBientot,
    listeControlesEnRetard,
    listeControlesBientot,
    validationsTaches,
    validationsControles,
    echeancesProjets,
    echeancesTaches,
    echeancesControles,
  ] = await Promise.all([
    prisma.projet.count({ where: { statut: "EN_COURS" } }),
    prisma.tache.count({
      where: { statut: { notIn: [...TACHE_CLOSES] } },
    }),
    prisma.tache.count({
      where: {
        statut: { notIn: [...TACHE_CLOSES] },
        dateEcheance: { lt: today },
      },
    }),
    prisma.tache.count({ where: { statut: "A_VALIDER" } }),
    prisma.controleSCI.count({
      where: {
        statut: { notIn: ["REALISE"] },
        dateProchaineEcheance: { gte: today, lte: soon },
      },
    }),
    prisma.controleSCI.count({
      where: {
        OR: [
          { statut: "EN_RETARD" },
          {
            statut: { notIn: ["REALISE"] },
            dateProchaineEcheance: { lt: today },
          },
        ],
      },
    }),
    prisma.tache.findMany({
      where: {
        statut: { notIn: [...TACHE_CLOSES] },
        dateEcheance: { lt: today },
      },
      include: {
        responsable: true,
        projet: true,
      },
      orderBy: { dateEcheance: "asc" },
      take: 8,
    }),
    prisma.tache.findMany({
      where: {
        statut: { notIn: [...TACHE_CLOSES] },
        dateEcheance: { gte: today, lte: soon },
      },
      include: {
        responsable: true,
        projet: true,
      },
      orderBy: { dateEcheance: "asc" },
      take: 8,
    }),
    prisma.controleSCI.findMany({
      where: {
        OR: [
          { statut: "EN_RETARD" },
          {
            statut: { notIn: ["REALISE"] },
            dateProchaineEcheance: { lt: today },
          },
        ],
      },
      include: { responsable: true },
      orderBy: { dateProchaineEcheance: "asc" },
      take: 8,
    }),
    prisma.controleSCI.findMany({
      where: {
        statut: { notIn: ["REALISE", "EN_RETARD"] },
        dateProchaineEcheance: { gte: today, lte: soon },
      },
      include: { responsable: true },
      orderBy: { dateProchaineEcheance: "asc" },
      take: 8,
    }),
    prisma.tache.findMany({
      where: { statut: "A_VALIDER" },
      include: {
        responsable: true,
        soumisPar: true,
        projet: true,
      },
      orderBy: { dateSoumission: "asc" },
      take: 8,
    }),
    prisma.controleSCI.findMany({
      where: { statut: "A_VALIDER" },
      include: {
        responsable: true,
        soumisPar: true,
      },
      orderBy: { dateSoumission: "asc" },
      take: 8,
    }),
    prisma.projet.findMany({
      where: {
        dateEcheance: { not: null },
        statut: { notIn: ["TERMINE", "ANNULE"] },
      },
      select: {
        id: true,
        nom: true,
        dateEcheance: true,
        statut: true,
        priorite: true,
      },
      orderBy: { dateEcheance: "asc" },
      take: 12,
    }),
    prisma.tache.findMany({
      where: {
        dateEcheance: { not: null },
        statut: { notIn: [...TACHE_CLOSES] },
      },
      select: {
        id: true,
        titre: true,
        dateEcheance: true,
        statut: true,
        priorite: true,
      },
      orderBy: { dateEcheance: "asc" },
      take: 12,
    }),
    prisma.controleSCI.findMany({
      where: {
        dateProchaineEcheance: { not: null },
        statut: { notIn: ["REALISE"] },
      },
      select: {
        id: true,
        nom: true,
        dateProchaineEcheance: true,
        statut: true,
        frequence: true,
      },
      orderBy: { dateProchaineEcheance: "asc" },
      take: 12,
    }),
  ]);

  return {
    synthetique: {
      projetsEnCours,
      tachesOuvertes,
      tachesEnRetard,
      tachesAValider,
      controlesAVenir,
      controlesEnRetard,
    },
    aTraiter: {
      tachesEnRetard: listeTachesEnRetard,
      tachesBientot: listeTachesBientot,
      controlesEnRetard: listeControlesEnRetard,
      controlesBientot: listeControlesBientot,
      validationsTaches,
      validationsControles,
    },
    calendrier: {
      projets: echeancesProjets,
      taches: echeancesTaches,
      controles: echeancesControles,
    },
  };
}
