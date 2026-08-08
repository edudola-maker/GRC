import type { ModuleMetier } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CONSEIL_STATUTS_CLOS,
  RISQUE_STATUTS_MAITRISES,
  TACHE_STATUTS_CLOS,
} from "@/lib/catalog";
import { getConseilDelaiCibleJours } from "@/lib/referentiels";
import { businessDaysBetween } from "@/lib/dates";
import { startOfToday } from "@/lib/labels";

export const MODULE_METIER_LABELS: Record<ModuleMetier, string> = {
  PROJET: "Projets",
  CONSEIL: "Conseils",
  MISSION: "Missions",
  RISQUE: "Risques",
  CONTROLE_SCI: "Contrôles SCI",
  DOCUMENT: "Documents",
};

/** Calcule la valeur réalisée d'un indicateur module pour l'unité. */
export async function calculerIndicateur(
  uniteId: string,
  indicateurCle: string,
): Promise<number | null> {
  const today = startOfToday();
  const annee = today.getFullYear();

  switch (indicateurCle) {
    case "audits_realises":
      return prisma.mission.count({
        where: { uniteId, archive: false, statut: "TERMINE" },
      });
    case "audits_planifies":
      return prisma.mission.count({
        where: {
          uniteId,
          archive: false,
          statut: { in: ["PLANIFIE", "EN_COURS", "EN_REVUE", "TERMINE"] },
        },
      });
    case "conseils_ouverts":
      return prisma.conseil.count({
        where: {
          uniteId,
          archive: false,
          statut: { notIn: [...CONSEIL_STATUTS_CLOS] },
        },
      });
    case "conseils_respect_delai_pct": {
      const clos = await prisma.conseil.findMany({
        where: {
          uniteId,
          archive: false,
          statut: { in: ["CLOTURE", "REPONDU"] },
          OR: [{ dateCloture: { not: null } }, { dateReponse: { not: null } }],
        },
        select: { dateReception: true, dateCloture: true, dateReponse: true },
      });
      if (clos.length === 0) return null;
      const delai = await getConseilDelaiCibleJours(uniteId);
      const ok = clos.filter((c) => {
        const fin = c.dateCloture ?? c.dateReponse;
        if (!fin) return false;
        return businessDaysBetween(c.dateReception, fin) <= delai;
      }).length;
      return Math.round((ok / clos.length) * 100);
    }
    case "projets_clotures":
      return prisma.projet.count({
        where: { uniteId, archive: false, statut: "CLOTURE" },
      });
    case "projets_actifs":
      return prisma.projet.count({
        where: {
          uniteId,
          archive: false,
          statut: {
            in: ["VALIDE", "PLANIFIE", "EN_COURS", "EN_VALIDATION", "DEPLOYE"],
          },
        },
      });
    case "controles_realises":
      return prisma.tache.count({
        where: {
          uniteId,
          categorie: "SCI",
          controleSCIId: { not: null },
          statut: "TERMINE",
        },
      });
    case "controles_taux_pct": {
      const [ouvertes, realises] = await Promise.all([
        prisma.tache.count({
          where: {
            uniteId,
            categorie: "SCI",
            controleSCIId: { not: null },
            statut: { notIn: [...TACHE_STATUTS_CLOS] },
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
      ]);
      const total = ouvertes + realises;
      return total > 0 ? Math.round((realises / total) * 100) : null;
    }
    case "risques_critiques":
      return prisma.risque.count({
        where: {
          uniteId,
          archive: false,
          criticite: { gte: 20 },
          statut: { notIn: [...RISQUE_STATUTS_MAITRISES] },
        },
      });
    case "documents_en_vigueur":
      return prisma.document.count({
        where: { uniteId, archive: false, statut: "EN_VIGUEUR" },
      });
    case "documents_revues_retard":
      return prisma.document.count({
        where: {
          uniteId,
          archive: false,
          prochaineRevue: { lt: today },
          statut: { notIn: ["OBSOLETE", "ARCHIVE"] },
        },
      });
    default:
      // indicateur inconnu : laisser la valeur saisie en base
      void annee;
      return null;
  }
}

export type ObjectifModuleVue = {
  id: string;
  module: ModuleMetier;
  moduleLabel: string;
  libelle: string;
  indicateurCle: string;
  cible: number | null;
  realise: number | null;
  uniteMesure: string | null;
  progression: number;
  source: "calcule" | "saisi";
};

/** Objectifs module de l'unité avec réalisation agrégée (lecture seule côté dashboard). */
export async function getObjectifsModuleAggreges(
  uniteId: string,
  annee?: number,
): Promise<ObjectifModuleVue[]> {
  const year = annee ?? startOfToday().getFullYear();
  const rows = await prisma.objectifModule.findMany({
    where: { uniteId, annee: year },
    orderBy: [{ module: "asc" }, { libelle: "asc" }],
  });

  const out: ObjectifModuleVue[] = [];
  for (const row of rows) {
    const calcule = await calculerIndicateur(uniteId, row.indicateurCle);
    const realise = calcule ?? row.realiseNumerique;
    const cible = row.cibleNumerique;
    let progression = row.progression;
    if (calcule != null && cible != null && cible > 0) {
      progression = Math.min(100, Math.round((calcule / cible) * 100));
    }
    out.push({
      id: row.id,
      module: row.module,
      moduleLabel: MODULE_METIER_LABELS[row.module],
      libelle: row.libelle,
      indicateurCle: row.indicateurCle,
      cible,
      realise,
      uniteMesure: row.uniteMesure,
      progression,
      source: calcule != null ? "calcule" : "saisi",
    });
  }
  return out;
}
