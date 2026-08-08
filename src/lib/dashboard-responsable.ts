import { prisma } from "@/lib/prisma";
import {
  CONSEIL_STATUTS_CLOS,
  RISQUE_STATUTS_MAITRISES,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import { businessDaysBetween } from "@/lib/dates";
import { startOfToday } from "@/lib/labels";
import { getConseilDelaiCibleJours } from "@/lib/referentiels";

/** KPI synthétiques pour le Dashboard Responsable (volontairement courts). */
export async function getDashboardResponsable(uniteId: string) {
  const today = startOfToday();
  const annee = today.getFullYear();
  const delaiCible = await getConseilDelaiCibleJours(uniteId);

  const [
    auditsEnCours,
    auditsRealises,
    auditsPlanifies,
    conseilsOuverts,
    conseilsClos,
    conseilsTousClos,
    projetsActifs,
    projetsTermines,
    projetsEnRetard,
    controlesPrevus,
    controlesRealises,
    controlesEnRetard,
    risquesCritiques,
    risquesEleves,
    actionsOuvertes,
    actionsEnRetard,
    objectifs,
    auditsListe,
    conseilsListe,
    projetsListe,
    controlesListe,
    risquesListe,
  ] = await Promise.all([
    prisma.mission.count({
      where: {
        uniteId,
        archive: false,
        statut: { in: ["EN_COURS", "EN_REVUE"] },
      },
    }),
    prisma.mission.count({
      where: { uniteId, archive: false, statut: "TERMINE" },
    }),
    prisma.mission.count({
      where: {
        uniteId,
        archive: false,
        statut: { in: ["PLANIFIE", "EN_COURS", "EN_REVUE", "TERMINE"] },
      },
    }),
    prisma.conseil.count({
      where: {
        uniteId,
        archive: false,
        statut: { notIn: [...CONSEIL_STATUTS_CLOS] },
      },
    }),
    prisma.conseil.count({
      where: { uniteId, archive: false, statut: { in: ["CLOTURE", "REPONDU"] } },
    }),
    prisma.conseil.findMany({
      where: {
        uniteId,
        archive: false,
        statut: { in: ["CLOTURE", "REPONDU"] },
        OR: [{ dateCloture: { not: null } }, { dateReponse: { not: null } }],
      },
      select: { dateReception: true, dateCloture: true, dateReponse: true },
    }),
    prisma.projet.count({
      where: {
        uniteId,
        archive: false,
        statut: {
          in: ["VALIDE", "PLANIFIE", "EN_COURS", "EN_VALIDATION", "DEPLOYE"],
        },
      },
    }),
    prisma.projet.count({
      where: { uniteId, archive: false, statut: "CLOTURE" },
    }),
    prisma.projet.count({
      where: {
        uniteId,
        archive: false,
        statut: { notIn: ["CLOTURE", "ABANDONNE"] },
        dateEcheance: { lt: today },
      },
    }),
    prisma.controleSCI.count({
      where: {
        uniteId,
        archive: false,
        statut: "ACTIF",
      },
    }),
    prisma.tache.count({
      where: {
        uniteId,
        categorie: "SCI",
        controleSCIId: { not: null },
        statut: "TERMINE",
      },
    }),
    prisma.controleSCI.count({
      where: {
        uniteId,
        archive: false,
        statut: "ACTIF",
        dateProchaineEcheance: { lt: today },
      },
    }),
    prisma.risque.count({
      where: {
        uniteId,
        archive: false,
        criticite: { gte: 20 },
        statut: { notIn: [...RISQUE_STATUTS_MAITRISES] },
      },
    }),
    prisma.risque.count({
      where: {
        uniteId,
        archive: false,
        criticite: { gte: 12, lt: 20 },
        statut: { notIn: [...RISQUE_STATUTS_MAITRISES] },
      },
    }),
    prisma.tache.count({
      where: {
        uniteId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
      },
    }),
    prisma.tache.count({
      where: {
        uniteId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        dateEcheance: { lt: today },
      },
    }),
    prisma.objectifAnnuel.findMany({
      where: { uniteId, annee },
      include: { utilisateur: true },
      orderBy: { utilisateur: { nom: "asc" } },
    }),
    prisma.mission.findMany({
      where: {
        uniteId,
        archive: false,
        statut: { in: ["EN_COURS", "EN_REVUE"] },
      },
      include: { responsable: true },
      orderBy: { dateFin: "asc" },
      take: 6,
    }),
    prisma.conseil.findMany({
      where: {
        uniteId,
        archive: false,
        statut: { notIn: [...CONSEIL_STATUTS_CLOS] },
      },
      include: { responsable: true },
      orderBy: { dateEcheance: "asc" },
      take: 6,
    }),
    prisma.projet.findMany({
      where: {
        uniteId,
        archive: false,
        statut: {
          in: ["VALIDE", "PLANIFIE", "EN_COURS", "EN_VALIDATION", "DEPLOYE"],
        },
      },
      include: { responsable: true },
      orderBy: { dateEcheance: "asc" },
      take: 6,
    }),
    prisma.controleSCI.findMany({
      where: {
        uniteId,
        archive: false,
        statut: "ACTIF",
      },
      include: { responsable: true },
      orderBy: { dateProchaineEcheance: "asc" },
      take: 6,
    }),
    prisma.risque.findMany({
      where: {
        uniteId,
        archive: false,
        criticite: { gte: 12 },
        statut: { notIn: [...RISQUE_STATUTS_MAITRISES] },
      },
      include: { responsable: true },
      orderBy: { criticite: "desc" },
      take: 6,
    }),
  ]);

  let respectDelai = 0;
  let sommeDelais = 0;
  for (const c of conseilsTousClos) {
    const fin = c.dateCloture ?? c.dateReponse;
    if (!fin) continue;
    const jours = businessDaysBetween(c.dateReception, fin);
    sommeDelais += jours;
    if (jours <= delaiCible) respectDelai += 1;
  }
  const nbClos = conseilsTousClos.filter(
    (c) => c.dateCloture || c.dateReponse,
  ).length;
  const tauxRespectDelai =
    nbClos > 0 ? Math.round((respectDelai / nbClos) * 100) : null;
  const delaiMoyen =
    nbClos > 0 ? Math.round(sommeDelais / nbClos) : null;

  const totalControles = controlesPrevus + controlesRealises;
  const tauxRealisationControles =
    totalControles > 0
      ? Math.round((controlesRealises / totalControles) * 100)
      : null;

  return {
    synthetique: {
      auditsEnCours,
      auditsRealises,
      auditsPlanifies,
      conseilsOuverts,
      conseilsClos,
      delaiMoyen,
      tauxRespectDelai,
      projetsActifs,
      projetsTermines,
      projetsEnRetard,
      controlesPrevus,
      controlesRealises,
      controlesEnRetard,
      tauxRealisationControles,
      risquesCritiques,
      risquesEleves,
      actionsOuvertes,
      actionsEnRetard,
    },
    operationnel: {
      audits: auditsListe,
      conseils: conseilsListe,
      projets: projetsListe,
      controles: controlesListe,
      risques: risquesListe,
    },
    objectifs,
    meta: { today, annee, delaiCible },
  };
}
