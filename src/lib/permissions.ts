import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export function isAdministrateur(user: { role: string }) {
  return user.role === "ADMINISTRATEUR";
}

/** Responsable d’unité ou administrateur (accès élargi). */
export function isResponsableOuAdmin(user: { role: string }) {
  return user.role === "RESPONSABLE" || user.role === "ADMINISTRATEUR";
}

/**
 * Garde Administration — `notFound()` plutôt qu’un message d’erreur
 * pour ne pas révéler l’existence du module aux non-autorisés.
 */
export async function assertAdministrateur() {
  const user = await getCurrentUser();
  if (!isAdministrateur(user)) notFound();
  return user;
}

export async function assertCanAccessAdministration() {
  return assertAdministrateur();
}
