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
  return prenom ? `${prenom} ${u.nom}` : u.nom;
}
