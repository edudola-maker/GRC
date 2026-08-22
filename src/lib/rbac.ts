/**
 * RBAC métier — prototype permissif.
 *
 * Par défaut : tout est autorisé (RBAC_ENFORCE ≠ "1").
 * L’architecture (rôles, permissions, périmètres, exceptions) est prête
 * pour activer les restrictions plus tard sans refactor massif.
 */

import type { PerimetreAcces, RoleUtilisateur } from "@/generated/prisma/client";

/** true tant que RBAC_ENFORCE n’est pas activé. */
export function isRbacPermissive(): boolean {
  return process.env.RBAC_ENFORCE !== "1";
}

export type PermissionAction = "voir" | "creer" | "modifier" | "valider" | "administrer";

export type PermissionDomain =
  | "processus"
  | "risques"
  | "projets"
  | "missions"
  | "conseils"
  | "controles"
  | "documents"
  | "fonctions"
  | "administration"
  | "rapports";

export type PermissionKey = `${PermissionDomain}.${PermissionAction}`;

type RolePerms = Partial<Record<PermissionAction, boolean>>;

/** Matrice compacte rôle × domaine — compréhensible métier. */
export const PERMISSION_MATRIX: Record<
  RoleUtilisateur,
  Partial<Record<PermissionDomain, RolePerms>>
> = {
  LECTURE_SEULE: {
    processus: { voir: true },
    risques: { voir: true },
    projets: { voir: true },
    missions: { voir: true },
    conseils: { voir: true },
    controles: { voir: true },
    documents: { voir: true },
    fonctions: { voir: true },
    rapports: { voir: true },
  },
  COLLABORATEUR: {
    processus: { voir: true, creer: true, modifier: true },
    risques: { voir: true, creer: true, modifier: true },
    projets: { voir: true, creer: true, modifier: true },
    missions: { voir: true, creer: true, modifier: true },
    conseils: { voir: true, creer: true, modifier: true },
    controles: { voir: true, creer: true, modifier: true },
    documents: { voir: true, creer: true, modifier: true },
    fonctions: { voir: true },
    rapports: { voir: true },
  },
  RESPONSABLE: {
    processus: { voir: true, creer: true, modifier: true, valider: true },
    risques: { voir: true, creer: true, modifier: true, valider: true },
    projets: { voir: true, creer: true, modifier: true, valider: true },
    missions: { voir: true, creer: true, modifier: true, valider: true },
    conseils: { voir: true, creer: true, modifier: true, valider: true },
    controles: { voir: true, creer: true, modifier: true, valider: true },
    documents: { voir: true, creer: true, modifier: true, valider: true },
    fonctions: { voir: true, creer: true, modifier: true },
    rapports: { voir: true, creer: true },
    administration: { voir: true },
  },
  ADMINISTRATEUR: {
    processus: { voir: true, creer: true, modifier: true, valider: true },
    risques: { voir: true, creer: true, modifier: true, valider: true },
    projets: { voir: true, creer: true, modifier: true, valider: true },
    missions: { voir: true, creer: true, modifier: true, valider: true },
    conseils: { voir: true, creer: true, modifier: true, valider: true },
    controles: { voir: true, creer: true, modifier: true, valider: true },
    documents: { voir: true, creer: true, modifier: true, valider: true },
    fonctions: { voir: true, creer: true, modifier: true, administrer: true },
    rapports: { voir: true, creer: true, administrer: true },
    administration: {
      voir: true,
      creer: true,
      modifier: true,
      administrer: true,
    },
  },
};

export const PERMISSION_DOMAINS: PermissionDomain[] = [
  "processus",
  "risques",
  "projets",
  "missions",
  "conseils",
  "controles",
  "documents",
  "fonctions",
  "rapports",
  "administration",
];

export const PERMISSION_ACTIONS: PermissionAction[] = [
  "voir",
  "creer",
  "modifier",
  "valider",
  "administrer",
];

export const DOMAIN_LABELS: Record<PermissionDomain, string> = {
  processus: "Processus",
  risques: "Risques",
  projets: "Projets",
  missions: "Missions",
  conseils: "Conseils",
  controles: "Contrôles",
  documents: "Documents",
  fonctions: "Fonctions",
  rapports: "Rapports",
  administration: "Administration",
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  voir: "Voir",
  creer: "Créer",
  modifier: "Modifier",
  valider: "Valider",
  administrer: "Admin",
};

export function roleHasPermission(
  role: RoleUtilisateur,
  domain: PermissionDomain,
  action: PermissionAction,
): boolean {
  return Boolean(PERMISSION_MATRIX[role]?.[domain]?.[action]);
}

/**
 * Décision d’accès — mode permissif = toujours true.
 * exceptions : map permissionKey → accord (architecture).
 */
export function canAccess(opts: {
  role: RoleUtilisateur;
  domain: PermissionDomain;
  action: PermissionAction;
  exceptions?: Map<string, boolean>;
}): boolean {
  if (isRbacPermissive()) return true;
  const key = `${opts.domain}.${opts.action}` as PermissionKey;
  const ex = opts.exceptions?.get(key);
  if (ex === false) return false;
  if (ex === true) return true;
  return roleHasPermission(opts.role, opts.domain, opts.action);
}

export function defaultPerimetreForRole(
  role: RoleUtilisateur,
): PerimetreAcces {
  switch (role) {
    case "ADMINISTRATEUR":
      return "ORGANISATION";
    case "RESPONSABLE":
      return "MON_UNITE";
    case "LECTURE_SEULE":
      return "MON_UNITE";
    default:
      return "MES_OBJETS";
  }
}
