import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const DEMO_USER_COOKIE = "grc_demo_user";

/**
 * Utilisateur courant (démo : cookie ou premier responsable / actif).
 * À remplacer plus tard par une vraie authentification.
 */
export async function getCurrentUser() {
  const jar = await cookies();
  const preferredId = jar.get(DEMO_USER_COOKIE)?.value;

  if (preferredId) {
    const preferred = await prisma.utilisateur.findFirst({
      where: { id: preferredId, actif: true },
    });
    if (preferred) return preferred;
  }

  const user = await prisma.utilisateur.findFirst({
    where: { actif: true },
    orderBy: [{ role: "desc" }, { creeLe: "asc" }],
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

export function isResponsable(user: { role: string }) {
  return user.role === "RESPONSABLE";
}
