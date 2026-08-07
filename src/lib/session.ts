import { prisma } from "@/lib/prisma";

/**
 * Utilisateur courant provisoire (avant authentification).
 * Prend le premier utilisateur actif — à remplacer par une vraie session.
 */
export async function getCurrentUser() {
  const user = await prisma.utilisateur.findFirst({
    where: { actif: true },
    orderBy: { creeLe: "asc" },
  });

  if (!user) {
    throw new Error(
      "Aucun utilisateur actif. Exécutez `npm run db:seed` pour initialiser les données.",
    );
  }

  return user;
}

export async function listUtilisateursActifs() {
  return prisma.utilisateur.findMany({
    where: { actif: true },
    orderBy: { nom: "asc" },
  });
}
