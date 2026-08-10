/**
 * Retour contextuel : préserve l’origine de navigation (Projet, Mission…).
 * Accepte uniquement des chemins relatifs internes (anti open-redirect).
 */
export function safeRetourPath(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (!raw) return fallback;
  const decoded = (() => {
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })().trim();
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
  if (decoded.includes("://")) return fallback;
  return decoded;
}

/** Ajoute ?retour=… à un lien interne. */
export function withRetour(href: string, retour: string): string {
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}retour=${encodeURIComponent(retour)}`;
}
