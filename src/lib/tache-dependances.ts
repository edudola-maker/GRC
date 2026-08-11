import { prisma } from "@/lib/prisma";

/** Un prérequis n’est satisfait que s’il est explicitement terminé. */
export function isPrerequisSatisfait(statut: string): boolean {
  return statut === "TERMINE";
}

export type TacheActivationInfo = {
  active: boolean;
  /** Titres des prérequis non terminés */
  enAttenteDe: string[];
  prerequisIds: string[];
};

/**
 * Pour un ensemble de tâches, calcule lesquelles sont bloquées par des prérequis.
 * Les tâches hors projet (sans dépendances) sont actives.
 */
export async function getActivationByTacheIds(
  tacheIds: string[],
): Promise<Map<string, TacheActivationInfo>> {
  const map = new Map<string, TacheActivationInfo>();
  for (const id of tacheIds) {
    map.set(id, { active: true, enAttenteDe: [], prerequisIds: [] });
  }
  if (tacheIds.length === 0) return map;

  const deps = await prisma.tacheDependance.findMany({
    where: { tacheId: { in: tacheIds } },
    include: {
      prerequis: { select: { id: true, titre: true, statut: true } },
    },
  });

  for (const d of deps) {
    const info = map.get(d.tacheId) ?? {
      active: true,
      enAttenteDe: [],
      prerequisIds: [],
    };
    info.prerequisIds.push(d.prerequisId);
    if (!isPrerequisSatisfait(d.prerequis.statut)) {
      info.active = false;
      info.enAttenteDe.push(d.prerequis.titre);
    }
    map.set(d.tacheId, info);
  }

  return map;
}

export async function filterActiveOperationnelles<T extends { id: string }>(
  items: T[],
): Promise<T[]> {
  const map = await getActivationByTacheIds(items.map((t) => t.id));
  return items.filter((t) => map.get(t.id)?.active !== false);
}

/**
 * IDs des tâches Projet encore bloquées par au moins un prérequis non terminé.
 * À exclure des vues opérationnelles (Dashboard, inventaire « à traiter », etc.).
 */
export async function getBlockedTacheIdsForUnite(
  uniteId: string,
): Promise<string[]> {
  const deps = await prisma.tacheDependance.findMany({
    where: { projet: { uniteId } },
    include: {
      prerequis: { select: { id: true, statut: true } },
    },
  });
  const bySuccesseur = new Map<string, boolean>();
  for (const d of deps) {
    const ok = isPrerequisSatisfait(d.prerequis.statut);
    const prev = bySuccesseur.get(d.tacheId);
    // active seulement si TOUS les prérequis sont satisfaits
    bySuccesseur.set(d.tacheId, prev === undefined ? ok : prev && ok);
  }
  return [...bySuccesseur.entries()]
    .filter(([, active]) => !active)
    .map(([id]) => id);
}

/** Détecte un cycle si on ajoutait les arêtes prerequisId → tacheId. */
export async function wouldCreateCycle(
  projetId: string,
  tacheId: string,
  prerequisIds: string[],
): Promise<boolean> {
  if (prerequisIds.includes(tacheId)) return true;

  const existing = await prisma.tacheDependance.findMany({
    where: { projetId },
    select: { tacheId: true, prerequisId: true },
  });

  // Graphe : prerequis → successeur (tacheId)
  const adj = new Map<string, string[]>();
  const addEdge = (from: string, to: string) => {
    const list = adj.get(from) ?? [];
    list.push(to);
    adj.set(from, list);
  };
  for (const e of existing) {
    if (e.tacheId === tacheId) continue; // on remplace les arêtes de cette tâche
    addEdge(e.prerequisId, e.tacheId);
  }
  for (const p of prerequisIds) addEdge(p, tacheId);

  // DFS depuis tacheId : si on atteint un prérequis, cycle
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function dfs(node: string): boolean {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of adj.get(node) ?? []) {
      if (dfs(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  }
  return dfs(tacheId);
}

/**
 * Remplace les prérequis d’une tâche Projet.
 * `prerequisIds` vide = aucune dépendance (toujours active).
 */
export async function setTachePrerequis(params: {
  projetId: string;
  tacheId: string;
  prerequisIds: string[];
}): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const tache = await prisma.tache.findFirst({
    where: { id: params.tacheId, projetId: params.projetId },
  });
  if (!tache) return { ok: false, erreur: "Tâche introuvable dans ce projet." };

  const unique = [...new Set(params.prerequisIds.filter((id) => id !== params.tacheId))];
  if (unique.length > 0) {
    const found = await prisma.tache.findMany({
      where: { id: { in: unique }, projetId: params.projetId },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      return { ok: false, erreur: "Un prérequis n’appartient pas au projet." };
    }
  }

  if (await wouldCreateCycle(params.projetId, params.tacheId, unique)) {
    return { ok: false, erreur: "Cette dépendance créerait un cycle." };
  }

  await prisma.$transaction([
    prisma.tacheDependance.deleteMany({ where: { tacheId: params.tacheId } }),
    ...(unique.length
      ? [
          prisma.tacheDependance.createMany({
            data: unique.map((prerequisId) => ({
              projetId: params.projetId,
              tacheId: params.tacheId,
              prerequisId,
            })),
          }),
        ]
      : []),
  ]);

  return { ok: true };
}
