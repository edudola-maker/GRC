import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { CleModule, RoleUtilisateur } from "@/generated/prisma/client";
import { DEMO_ORG_COOKIE } from "@/lib/org-constants";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export { DEMO_ORG_COOKIE };

export type OrgContext = {
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  organisationId: string;
  organisation: {
    id: string;
    code: string;
    nom: string;
    nomCourt: string | null;
    profilInitial: string | null;
  };
  /** Unités de l’Organisation courante. */
  uniteIds: string[];
  /** Unité de travail courante (principale membership ou cookie). */
  uniteId: string;
  role: RoleUtilisateur;
  modules: Set<CleModule>;
};

async function listMembershipOrgs(utilisateurId: string) {
  return prisma.organisationMembership.findMany({
    where: { utilisateurId, actif: true },
    include: {
      organisation: {
        select: {
          id: true,
          code: true,
          nom: true,
          nomCourt: true,
          profilInitial: true,
          statut: true,
        },
      },
    },
    orderBy: { creeLe: "asc" },
  });
}

/**
 * Contexte Organisation courant (tenant).
 * Isolation : toutes les requêtes métier doivent utiliser uniteIds / uniteId.
 */
export async function getOrgContext(): Promise<OrgContext> {
  const user = await getCurrentUser();
  const memberships = await listMembershipOrgs(user.id);
  if (memberships.length === 0) {
    throw new Error(
      "Aucune appartenance Organisation. Exécutez le seed multi-org.",
    );
  }

  const jar = await cookies();
  const preferredOrgId = jar.get(DEMO_ORG_COOKIE)?.value;

  const homeUnite = await prisma.unite.findUnique({
    where: { id: user.uniteId },
    select: { organisationId: true },
  });

  const membership =
    memberships.find((m) => m.organisationId === preferredOrgId) ??
    memberships.find((m) => m.organisationId === homeUnite?.organisationId) ??
    memberships[0]!;

  const org = membership.organisation;
  if (org.statut !== "ACTIF") {
    throw new Error("Organisation inactive.");
  }

  const unites = await prisma.unite.findMany({
    where: { organisationId: org.id, actif: true },
    select: { id: true },
    orderBy: { code: "asc" },
  });
  const uniteIds = unites.map((u) => u.id);
  if (uniteIds.length === 0) {
    throw new Error("Organisation sans unité active.");
  }

  let uniteId =
    membership.unitePrincipaleId &&
    uniteIds.includes(membership.unitePrincipaleId)
      ? membership.unitePrincipaleId
      : uniteIds.includes(user.uniteId)
        ? user.uniteId
        : uniteIds[0]!;

  const moduleRows = await prisma.organisationModule.findMany({
    where: { organisationId: org.id, actif: true },
    select: { module: true },
  });
  const modules = new Set(moduleRows.map((m) => m.module));

  return {
    user,
    organisationId: org.id,
    organisation: {
      id: org.id,
      code: org.code,
      nom: org.nom,
      nomCourt: org.nomCourt,
      profilInitial: org.profilInitial,
    },
    uniteIds,
    uniteId,
    role: membership.role,
    modules,
  };
}

export function hasModule(ctx: OrgContext, module: CleModule): boolean {
  return ctx.modules.has(module);
}

/** Vérifie qu’une unité appartient à l’Organisation courante. */
export function assertUniteInOrg(ctx: OrgContext, uniteId: string): void {
  if (!ctx.uniteIds.includes(uniteId)) notFound();
}

/**
 * Vérifie qu’un objet (via son uniteId) est accessible dans le tenant courant.
 * À utiliser sur les pages détail / API.
 */
export function assertObjetInOrg(
  ctx: OrgContext,
  objetUniteId: string | null | undefined,
): void {
  if (!objetUniteId || !ctx.uniteIds.includes(objetUniteId)) notFound();
}

export function whereOrgUnites(ctx: OrgContext) {
  return { uniteId: { in: ctx.uniteIds } } as const;
}

export async function listOrganisationsForUser(utilisateurId: string) {
  const rows = await listMembershipOrgs(utilisateurId);
  return rows.map((m) => ({
    id: m.organisation.id,
    code: m.organisation.code,
    nom: m.organisation.nom,
    nomCourt: m.organisation.nomCourt,
    profilInitial: m.organisation.profilInitial,
    role: m.role,
  }));
}
