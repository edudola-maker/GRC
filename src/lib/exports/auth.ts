import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Contexte unité pour les exports (réutilise la session démo). */
export async function requireExportContext() {
  const user = await getCurrentUser();
  const unite = await prisma.unite.findUnique({
    where: { id: user.uniteId },
    select: { id: true, code: true, nom: true },
  });
  if (!unite) {
    throw new Error("Unité introuvable pour l'utilisateur courant.");
  }
  return { user, unite };
}
