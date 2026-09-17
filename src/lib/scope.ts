import { getOrgContext } from "@/lib/organisation";
import { getCurrentUser } from "@/lib/session";

/**
 * Contexte d'unité de travail dans l'Organisation courante.
 * Remplace l'ancien scope mono-unité.
 */
export async function getUniteScope() {
  const ctx = await getOrgContext();
  return {
    user: ctx.user,
    uniteId: ctx.uniteId,
    uniteIds: ctx.uniteIds,
    organisationId: ctx.organisationId,
    modules: ctx.modules,
    role: ctx.role,
  };
}

export function whereUnite(uniteId: string) {
  return { uniteId } as const;
}

export function whereUnites(uniteIds: string[]) {
  return { uniteId: { in: uniteIds } } as const;
}

/** @deprecated Préférer getUniteScope / getOrgContext */
export async function getLegacyUniteId() {
  const user = await getCurrentUser();
  return user.uniteId;
}
