import { getCurrentUser } from "@/lib/session";

/** Contexte d'unité de l'utilisateur courant (pas encore de droits croisés). */
export async function getUniteScope() {
  const user = await getCurrentUser();
  return { user, uniteId: user.uniteId };
}

export function whereUnite(uniteId: string) {
  return { uniteId } as const;
}
