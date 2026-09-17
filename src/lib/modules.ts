/**
 * Catalogue modules — activation par Organisation.
 * Masque la navigation ; ne supprime jamais les données.
 */

import type { CleModule, ProfilOrganisation } from "@/generated/prisma/client";

export type ModuleDef = {
  cle: CleModule;
  label: string;
  groupe: "core" | "gouvernance" | "metier" | "admin";
};

export const MODULE_CATALOG: ModuleDef[] = [
  { cle: "TACHES", label: "Tâches", groupe: "core" },
  { cle: "PLANNING", label: "Planning", groupe: "core" },
  { cle: "PROJETS", label: "Projets", groupe: "core" },
  { cle: "STRATEGIE", label: "Stratégie", groupe: "core" },
  { cle: "OBJECTIFS", label: "Objectifs", groupe: "core" },
  { cle: "PROCESSUS", label: "Processus", groupe: "core" },
  { cle: "DOCUMENTS", label: "Documents", groupe: "core" },
  { cle: "EQUIPE", label: "Équipe", groupe: "core" },
  { cle: "FONCTIONS", label: "Fonctions", groupe: "core" },
  { cle: "GUIDE", label: "Guide", groupe: "core" },
  { cle: "RAPPORTS", label: "Rapports", groupe: "core" },
  { cle: "RISQUES", label: "Risques", groupe: "gouvernance" },
  { cle: "CONTROLES", label: "Contrôles SCI", groupe: "gouvernance" },
  { cle: "CONFORMITE", label: "Conformité", groupe: "gouvernance" },
  { cle: "QUALITE", label: "Qualité", groupe: "gouvernance" },
  { cle: "CONTINUITE", label: "Continuité", groupe: "gouvernance" },
  { cle: "ACTIFS", label: "Actifs", groupe: "gouvernance" },
  { cle: "DECISIONS", label: "Décisions", groupe: "gouvernance" },
  { cle: "ARBITRAGES", label: "Arbitrages", groupe: "gouvernance" },
  { cle: "MISSIONS", label: "Missions d'assurance", groupe: "metier" },
  { cle: "CONSEILS", label: "Conseils", groupe: "metier" },
  { cle: "ADMINISTRATION", label: "Administration", groupe: "admin" },
];

/** Presets de démarrage — configuration initiale, pas des versions produit. */
export const MODULES_PAR_PROFIL: Record<ProfilOrganisation, CleModule[]> = {
  PME_SIMPLE: [
    "TACHES",
    "PLANNING",
    "PROJETS",
    "STRATEGIE",
    "OBJECTIFS",
    "PROCESSUS",
    "DOCUMENTS",
    "EQUIPE",
    "FONCTIONS",
    "GUIDE",
    "RAPPORTS",
    "RISQUES",
    "ADMINISTRATION",
  ],
  PME_STRUCTUREE: [
    "TACHES",
    "PLANNING",
    "PROJETS",
    "STRATEGIE",
    "OBJECTIFS",
    "PROCESSUS",
    "DOCUMENTS",
    "EQUIPE",
    "FONCTIONS",
    "GUIDE",
    "RAPPORTS",
    "RISQUES",
    "CONTROLES",
    "QUALITE",
    "CONFORMITE",
    "DECISIONS",
    "ADMINISTRATION",
  ],
  GRC_TRANSVERSE: MODULE_CATALOG.map((m) => m.cle),
  FINANCE_CONTROLE: [
    "TACHES",
    "PLANNING",
    "PROJETS",
    "STRATEGIE",
    "OBJECTIFS",
    "PROCESSUS",
    "DOCUMENTS",
    "EQUIPE",
    "FONCTIONS",
    "GUIDE",
    "RAPPORTS",
    "RISQUES",
    "CONTROLES",
    "DECISIONS",
    "ARBITRAGES",
    "ADMINISTRATION",
  ],
};

export const PROFIL_LABELS: Record<ProfilOrganisation, string> = {
  PME_SIMPLE: "Petite PME",
  PME_STRUCTUREE: "PME structurée",
  GRC_TRANSVERSE: "Unité transverse / GRC",
  FINANCE_CONTROLE: "Finance / Contrôle",
};

/** Mapping nav href → module requis (premier match). */
export const NAV_MODULE_BY_HREF: Record<string, CleModule> = {
  "/": "TACHES",
  "/taches": "TACHES",
  "/strategie": "STRATEGIE",
  "/responsable": "PLANNING",
  "/unite": "EQUIPE",
  "/projets": "PROJETS",
  "/missions": "MISSIONS",
  "/conseils": "CONSEILS",
  "/processus": "PROCESSUS",
  "/macroprocessus": "PROCESSUS",
  "/actifs-it": "ACTIFS",
  "/modeles-taches": "TACHES",
  "/risques": "RISQUES",
  "/controles-sci": "CONTROLES",
  "/documents": "DOCUMENTS",
  "/fonctions": "FONCTIONS",
  "/exigences": "CONFORMITE",
  "/arbitrages": "ARBITRAGES",
  "/decisions": "DECISIONS",
  "/rapports": "RAPPORTS",
  "/decouvrir": "GUIDE",
  "/recherche": "TACHES",
  "/objectifs": "OBJECTIFS",
  "/administration": "ADMINISTRATION",
  "/administration/utilisateurs": "ADMINISTRATION",
  "/administration/unites": "ADMINISTRATION",
  "/administration/modules": "ADMINISTRATION",
  "/administration/roles": "ADMINISTRATION",
};

export function moduleForHref(href: string): CleModule | null {
  if (NAV_MODULE_BY_HREF[href]) return NAV_MODULE_BY_HREF[href];
  const base = "/" + href.split("/").filter(Boolean)[0];
  return NAV_MODULE_BY_HREF[base] ?? null;
}
