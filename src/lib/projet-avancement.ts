/** Calcule l’avancement Projet = Σ (poids × avancement) / 100. */
export function computeProjetAvancement(
  etapes: Array<{ poids: number; avancement: number }>,
): number {
  if (etapes.length === 0) return 0;
  const totalPoids = etapes.reduce((s, e) => s + Math.max(0, e.poids), 0);
  if (totalPoids <= 0) return 0;
  const raw = etapes.reduce(
    (s, e) => s + Math.max(0, e.poids) * clampPct(e.avancement),
    0,
  );
  return Math.round(raw / totalPoids);
}

export function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Répartition égale des poids (somme = 100). */
export function repartirPoidsEgaux(count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(100 / count);
  const reste = 100 - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < reste ? 1 : 0));
}

/** Étapes proposées à la création d’un projet. */
export const ETAPES_PROJET_DEFAUT = [
  { libelle: "Cadrage", poids: 10 },
  { libelle: "Analyse", poids: 20 },
  { libelle: "Travaux", poids: 40 },
  { libelle: "Revue", poids: 20 },
  { libelle: "Finalisation", poids: 10 },
] as const;
