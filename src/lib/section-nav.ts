/**
 * Navigation de section EditableSection — ancre / focus transversaux.
 *
 * Les redirections serveur (Server Actions) ne conservent pas le fragment `#…`.
 * On utilise donc `?focus=SECTION` ; `ScrollToHash` restaure la position.
 * Les liens clients (Modifier / Annuler) peuvent garder `#SECTION`.
 */

export function sectionEditHref(baseHref: string, sectionKey: string): string {
  const base = stripFocusAndEdit(baseHref);
  return `${withQuery(base, { edit: sectionKey })}#${sectionKey}`;
}

export function sectionCancelHref(baseHref: string, sectionKey: string): string {
  const base = stripFocusAndEdit(baseHref);
  return `${base}#${sectionKey}`;
}

/** Après enregistrement (finaliser) — lecture + focus. */
export function sectionSavedHref(
  baseHref: string,
  sectionKey: string,
): string {
  const base = stripFocusAndEdit(baseHref);
  return withQuery(base, { focus: sectionKey });
}

/** Après brouillon — reste en édition + focus. */
export function sectionDraftHref(
  baseHref: string,
  sectionKey: string,
): string {
  const base = stripFocusAndEdit(baseHref);
  return withQuery(base, { edit: sectionKey, focus: sectionKey });
}

function stripFocusAndEdit(href: string): string {
  const [pathAndQuery, hash] = href.split("#");
  const [path, qs = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(qs);
  params.delete("edit");
  params.delete("focus");
  params.delete("ok");
  params.delete("erreur");
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

function withQuery(
  href: string,
  extra: Record<string, string>,
): string {
  const [path, qs = ""] = href.split("?");
  const params = new URLSearchParams(qs);
  for (const [k, v] of Object.entries(extra)) {
    if (v) params.set(k, v);
  }
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}
