import { prisma } from "@/lib/prisma";
import {
  CONSEIL_STATUTS_CLOS,
  RISQUE_STATUTS_MAITRISES,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import { addDays, startOfToday, SOON_DAYS } from "@/lib/labels";
import { businessDaysBetween, endOfMonth, endOfWeek } from "@/lib/dates";
import { getConseilDelaiCibleJours } from "@/lib/referentiels";

export async function getPilotageDashboard(uniteId: string) {
  const today = startOfToday();
  const soon = addDays(today, SOON_DAYS);
  const delaiCible = await getConseilDelaiCibleJours(uniteId);

  const [
    auditsEnCours,
    auditsRealises,
    recoOuvertes,
    conseilsOuverts,
    conseilsClos,
    tousConseilsClos,
    projetsActifs,
    projetsTermines,
    projetsEnRetard,
    controlesPlanifies,
    controlesRealises,
    controlesEnRetard,
    docsARevoir,
    docsRevueRetard,
    risquesEleves,
    risquesCritiques,
    tachesOuvertes,
    tachesEnRetard,
    tachesAValider,
    listeTachesEnRetard,
    listeTachesBientot,
    validationsTaches,
    validationsControles,
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
    prisma.recommandation.count({
      where: {
        statut: { in: ["OUVERTE", "EN_COURS"] },
        mission: { uniteId, archive: false },
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
    prisma.document.count({
      where: { uniteId, archive: false, statut: "A_REVOIR" },
    }),
    prisma.document.count({
      where: {
        uniteId,
        archive: false,
        statut: { notIn: ["OBSOLETE", "ARCHIVE"] },
        prochaineRevue: { lt: today },
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
    prisma.risque.count({
      where: {
        uniteId,
        archive: false,
        criticite: { gte: 20 },
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
    prisma.tache.count({ where: { uniteId, statut: "A_VALIDER" } }),
    prisma.tache.findMany({
      where: {
        uniteId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        dateEcheance: { lt: today },
      },
      include: { responsable: true, projet: true, conseil: true },
      orderBy: { dateEcheance: "asc" },
      take: 8,
    }),
    prisma.tache.findMany({
      where: {
        uniteId,
        statut: { notIn: [...TACHE_STATUTS_CLOS] },
        dateEcheance: { gte: today, lte: soon },
      },
      include: { responsable: true, projet: true, conseil: true },
      orderBy: { dateEcheance: "asc" },
      take: 8,
    }),
    prisma.tache.findMany({
      where: { uniteId, statut: "A_VALIDER" },
      include: { responsable: true, soumisPar: true, projet: true },
      orderBy: { dateSoumission: "asc" },
      take: 6,
    }),
    // Validations sur la définition contrôle retirées (exécution = tâches).
    Promise.resolve([] as never[]),
  ]);

  // Respect délai conseils (paramètre unité)
  let respectDelai = 0;
  let sommeDelais = 0;
  for (const c of tousConseilsClos) {
    const fin = c.dateCloture ?? c.dateReponse;
    if (!fin) continue;
    const jours = businessDaysBetween(c.dateReception, fin);
    sommeDelais += jours;
    if (jours <= delaiCible) respectDelai += 1;
  }
  const nbClosMesures = tousConseilsClos.filter(
    (c) => c.dateCloture || c.dateReponse,
  ).length;
  const tauxRespectDelai =
    nbClosMesures > 0 ? Math.round((respectDelai / nbClosMesures) * 100) : null;
  const tempsMoyenReponse =
    nbClosMesures > 0 ? Math.round(sommeDelais / nbClosMesures) : null;

  const conseilsHorsDelai = await prisma.conseil.count({
    where: {
      uniteId,
      archive: false,
      statut: { notIn: [...CONSEIL_STATUTS_CLOS] },
      dateEcheance: { lt: today },
    },
  });

  const totalControles = controlesPlanifies + controlesRealises;
  const tauxRealisationControles =
    totalControles > 0
      ? Math.round((controlesRealises / totalControles) * 100)
      : null;

  return {
    synthetique: {
      auditsEnCours,
      auditsRealises,
      recoOuvertes,
      conseilsOuverts,
      conseilsClos,
      conseilsHorsDelai,
      tauxRespectDelai,
      tempsMoyenReponse,
      projetsActifs,
      projetsTermines,
      projetsEnRetard,
      controlesPlanifies,
      controlesRealises,
      controlesEnRetard,
      tauxRealisationControles,
      docsARevoir,
      docsRevueRetard,
      risquesEleves,
      risquesCritiques,
      tachesOuvertes,
      tachesEnRetard,
      tachesAValider,
    },
    aTraiter: {
      tachesEnRetard: listeTachesEnRetard,
      tachesBientot: listeTachesBientot,
      validationsTaches,
      validationsControles,
    },
    meta: { soonDays: SOON_DAYS, today, endWeek: endOfWeek(), endMonth: endOfMonth() },
  };
}
