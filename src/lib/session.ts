import { cookies } from "next/headers";
import type { RoleUtilisateur } from "@/generated/prisma/client";
import { DEMO_ORG_COOKIE } from "@/lib/org-constants";
import { prisma } from "@/lib/prisma";

export const DEMO_USER_COOKIE = "grc_demo_user";

export type SessionUser = Awaited<
  ReturnType<typeof prisma.utilisateur.findFirstOrThrow>
> & {
  /** Unité de travail dans l’Organisation courante (peut différer de la fiche user). */
  uniteId: string;
  role: RoleUtilisateur;
};

/**
 * Utilisateur courant (démo : cookie ou premier responsable / actif).
 * Si une Organisation est sélectionnée, `uniteId` et `role` suivent le membership.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const jar = await cookies();
  const preferredId = jar.get(DEMO_USER_COOKIE)?.value;

  let user =
    preferredId != null
      ? await prisma.utilisateur.findFirst({
          where: { id: preferredId, actif: true },
        })
      : null;

  if (!user) {
    user = await prisma.utilisateur.findFirst({
      where: { actif: true },
      orderBy: [{ role: "desc" }, { creeLe: "asc" }],
    });
  }

  if (!user) {
    throw new Error(
      "Aucun utilisateur actif. Exécutez `npm run db:seed` pour initialiser les données.",
    );
  }

  const preferredOrgId = jar.get(DEMO_ORG_COOKIE)?.value;
  if (preferredOrgId) {
    const membership = await prisma.organisationMembership.findFirst({
      where: {
        utilisateurId: user.id,
        organisationId: preferredOrgId,
        actif: true,
      },
    });
    if (membership) {
      const unites = await prisma.unite.findMany({
        where: { organisationId: preferredOrgId, actif: true },
        select: { id: true },
        orderBy: { code: "asc" },
      });
      const uniteIds = unites.map((u) => u.id);
      const uniteId =
        membership.unitePrincipaleId &&
        uniteIds.includes(membership.unitePrincipaleId)
          ? membership.unitePrincipaleId
          : uniteIds.includes(user.uniteId)
            ? user.uniteId
            : uniteIds[0];
      if (uniteId) {
        return { ...user, uniteId, role: membership.role };
      }
    }
  }

  return user;
}

export async function listUtilisateursActifs(uniteId?: string) {
  return prisma.utilisateur.findMany({
    where: {
      actif: true,
      ...(uniteId ? { uniteId } : {}),
    },
    orderBy: { nom: "asc" },
  });
}

/** Utilisateurs actifs de l'unité de l'utilisateur courant (sélecteurs, monitoring). */
export async function listUtilisateursActifsForCurrentUnite() {
  const user = await getCurrentUser();
  return listUtilisateursActifs(user.uniteId);
}

/**
 * Utilisateurs ayant un membership actif dans l’Organisation courante
 * (sélecteur démo — pas de mélange cross-tenant).
 */
export async function listUtilisateursActifsForCurrentOrg() {
  const jar = await cookies();
  const preferredOrgId = jar.get(DEMO_ORG_COOKIE)?.value;
  const user = await getCurrentUser();

  let organisationId = preferredOrgId;
  if (!organisationId) {
    const home = await prisma.unite.findUnique({
      where: { id: user.uniteId },
      select: { organisationId: true },
    });
    organisationId = home?.organisationId;
  }
  if (!organisationId) return listUtilisateursActifs(user.uniteId);

  const memberships = await prisma.organisationMembership.findMany({
    where: { organisationId, actif: true },
    include: { utilisateur: true },
    orderBy: { creeLe: "asc" },
  });

  return memberships
    .map((m) => m.utilisateur)
    .filter((u) => u.actif)
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

export function isAdministrateur(user: { role: string }) {
  return user.role === "ADMINISTRATEUR";
}

/** Responsable d’unité ou administrateur — navigation / dashboards élargis. */
export function isResponsable(user: { role: string }) {
  return user.role === "RESPONSABLE" || user.role === "ADMINISTRATEUR";
}

export function formatUtilisateurNom(u: {
  nom: string;
  prenom?: string | null;
}) {
  const prenom = u.prenom?.trim();
  const nom = u.nom.trim();
  return prenom ? `${prenom} ${nom}` : nom;
}
