/** Tags stockés en texte simple, séparés par virgule ou point-virgule. */

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function serializeTags(raw: string | null | undefined): string | null {
  const tags = parseTags(raw);
  return tags.length ? tags.join(", ") : null;
}

export function tagsMatch(raw: string | null | undefined, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return parseTags(raw).some((t) => t.toLowerCase().includes(q));
}
