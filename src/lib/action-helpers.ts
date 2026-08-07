import { redirect } from "next/navigation";

/** Redirige vers un chemin avec un message d'erreur lisible (query `erreur`). */
export function redirectWithError(path: string, message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}erreur=${encodeURIComponent(message)}`);
}

/** Redirige avec un indicateur de succès (query `ok`). */
export function redirectWithOk(path: string, ok = "1"): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}ok=${encodeURIComponent(ok)}`);
}
