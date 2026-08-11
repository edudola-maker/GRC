import { redirect } from "next/navigation";

/**
 * Sépare chemin+query et fragment. Les fragments ne survivent pas aux
 * redirects HTTP : on les convertit en `?focus=`.
 */
function applyFocusFromHash(path: string): string {
  const hashIdx = path.indexOf("#");
  if (hashIdx < 0) return path;
  const before = path.slice(0, hashIdx);
  const hash = path.slice(hashIdx + 1);
  if (!hash) return before;
  const sep = before.includes("?") ? "&" : "?";
  // Évite de dupliquer focus=
  if (/[?&]focus=/.test(before)) return before;
  return `${before}${sep}focus=${encodeURIComponent(hash)}`;
}

/** Redirige vers un chemin avec un message d'erreur lisible (query `erreur`). */
export function redirectWithError(path: string, message: string): never {
  const resolved = applyFocusFromHash(path);
  const sep = resolved.includes("?") ? "&" : "?";
  redirect(`${resolved}${sep}erreur=${encodeURIComponent(message)}`);
}

/** Redirige avec un indicateur de succès (query `ok`). */
export function redirectWithOk(path: string, ok = "1"): never {
  const resolved = applyFocusFromHash(path);
  const sep = resolved.includes("?") ? "&" : "?";
  redirect(`${resolved}${sep}ok=${encodeURIComponent(ok)}`);
}
