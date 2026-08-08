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

export type UniteActiviteSlice = {
  id: string;
  code: string;
  titre: string;
  meta: string;
  href: string;
};

export type UniteActivite = {
  projets: UniteActiviteSlice[];
  missions: UniteActiviteSlice[];
  conseils: UniteActiviteSlice[];
  risques: UniteActiviteSlice[];
  controles: UniteActiviteSlice[];
  taches: UniteActiviteSlice[];
  documents: UniteActiviteSlice[];
  objectifs: UniteActiviteSlice[];
  processus: UniteActiviteSlice[];
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

/** Tranches d’activité pour la fiche Unité (agrégation lecture seule). */
export async function getUniteActivite(
  uniteId: string,
  limit = 5,
): Promise<UniteActivite> {
  const [
    projets,
    missions,
    conseils,
    risques,
    controles,
    taches,
    documents,
    objectifs,
    processus,
  ] = await Promise.all([
    prisma.projet.findMany({
      where: { uniteId, archive: false },
      orderBy: { modifieLe: "desc" },
      take: limit,
      select: { id: true, code: true, nom: true, statut: true },
    }),
    prisma.mission.findMany({
      where: { uniteId, archive: false },
      orderBy: { modifieLe: "desc" },
      take: limit,
      select: { id: true, code: true, titre: true, statut: true },
    }),
    prisma.conseil.findMany({
      where: { uniteId, archive: false },
      orderBy: { modifieLe: "desc" },
      take: limit,
      select: { id: true, code: true, objet: true, statut: true },
    }),
    prisma.risque.findMany({
      where: { uniteId, archive: false },
      orderBy: { modifieLe: "desc" },
      take: limit,
      select: { id: true, code: true, nom: true, statut: true },
    }),
    prisma.controleSCI.findMany({
      where: { uniteId, archive: false },
      orderBy: { modifieLe: "desc" },
      take: limit,
      select: { id: true, code: true, nom: true, statut: true },
    }),
    prisma.tache.findMany({
      where: { uniteId, statut: { notIn: [...TACHE_STATUTS_CLOS] } },
      orderBy: [{ dateEcheance: "asc" }, { modifieLe: "desc" }],
      take: limit,
      select: { id: true, titre: true, statut: true },
    }),
    prisma.document.findMany({
      where: { uniteId, archive: false },
      orderBy: { modifieLe: "desc" },
      take: limit,
      select: { id: true, code: true, nom: true, statut: true },
    }),
    prisma.objectif.findMany({
      where: { uniteId, statut: { not: "ABANDONNE" } },
      orderBy: [{ annee: "desc" }, { intitule: "asc" }],
      take: limit,
      select: { id: true, code: true, intitule: true, statut: true, annee: true },
    }),
    prisma.processus.findMany({
      where: { uniteId, archive: false },
      orderBy: { nom: "asc" },
      take: 20,
      select: { id: true, code: true, nom: true, statut: true },
    }),
  ]);

  return {
    projets: projets.map((p) => ({
      id: p.id,
      code: p.code,
      titre: p.nom,
      meta: p.statut,
      href: `/projets/${p.id}`,
    })),
    missions: missions.map((m) => ({
      id: m.id,
      code: m.code,
      titre: m.titre,
      meta: m.statut,
      href: `/audits/${m.id}`,
    })),
    conseils: conseils.map((c) => ({
      id: c.id,
      code: c.code,
      titre: c.objet,
      meta: c.statut,
      href: `/conseils/${c.id}`,
    })),
    risques: risques.map((r) => ({
      id: r.id,
      code: r.code,
      titre: r.nom,
      meta: r.statut,
      href: `/risques/${r.id}`,
    })),
    controles: controles.map((c) => ({
      id: c.id,
      code: c.code,
      titre: c.nom,
      meta: c.statut,
      href: `/controles-sci/${c.id}`,
    })),
    taches: taches.map((t) => ({
      id: t.id,
      code: "ACT",
      titre: t.titre,
      meta: t.statut,
      href: `/taches/${t.id}`,
    })),
    documents: documents.map((d) => ({
      id: d.id,
      code: d.code,
      titre: d.nom,
      meta: d.statut,
      href: `/documents/${d.id}`,
    })),
    objectifs: objectifs.map((o) => ({
      id: o.id,
      code: o.code,
      titre: o.intitule,
      meta: `${o.annee} · ${o.statut}`,
      href: `/objectifs/${o.id}`,
    })),
    processus: processus.map((p) => ({
      id: p.id,
      code: p.code,
      titre: p.nom,
      meta: p.statut,
      href: `/processus/${p.id}`,
    })),
  };
}
