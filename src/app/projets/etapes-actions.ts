"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  clampPct,
  computeProjetAvancement,
  repartirPoidsEgaux,
} from "@/lib/projet-avancement";
import { getCurrentUser } from "@/lib/session";

async function assertProjet(projetId: string) {
  const current = await getCurrentUser();
  const projet = await prisma.projet.findFirst({
    where: { id: projetId },
    select: { id: true, uniteId: true, archive: true },
  });
  if (!projet || projet.archive) throw new Error("Projet introuvable.");
  return { current, projet };
}

async function syncAvancement(projetId: string, userId: string) {
  const etapes = await prisma.projetEtape.findMany({
    where: { projetId },
    select: { poids: true, avancement: true },
  });
  const avancement = computeProjetAvancement(etapes);
  await prisma.projet.update({
    where: { id: projetId },
    data: { avancement, modifieParId: userId },
  });
  revalidatePath(`/projets/${projetId}`);
  revalidatePath("/projets");
  revalidatePath("/responsable");
  return avancement;
}

export async function updateProjetEtapeAvancement(
  projetId: string,
  etapeId: string,
  avancement: number,
) {
  const { current } = await assertProjet(projetId);
  const pct = clampPct(avancement);
  await prisma.projetEtape.updateMany({
    where: { id: etapeId, projetId },
    data: { avancement: pct, termine: pct >= 100 },
  });
  return syncAvancement(projetId, current.id);
}

export async function updateProjetEtapesPoids(
  projetId: string,
  rows: Array<{ id: string; poids: number }>,
) {
  const { current } = await assertProjet(projetId);
  for (const row of rows) {
    await prisma.projetEtape.updateMany({
      where: { id: row.id, projetId },
      data: { poids: clampPct(row.poids) },
    });
  }
  return syncAvancement(projetId, current.id);
}

export async function createProjetEtape(projetId: string, libelle: string) {
  const { current } = await assertProjet(projetId);
  const count = await prisma.projetEtape.count({ where: { projetId } });
  const etapes = await prisma.projetEtape.findMany({
    where: { projetId },
    select: { id: true },
    orderBy: { ordre: "asc" },
  });
  const poidsList = repartirPoidsEgaux(etapes.length + 1);
  await prisma.projetEtape.create({
    data: {
      projetId,
      libelle: libelle.trim(),
      ordre: count,
      poids: poidsList[poidsList.length - 1] ?? 0,
      avancement: 0,
    },
  });
  // Rééquilibrer tous les poids
  const all = await prisma.projetEtape.findMany({
    where: { projetId },
    orderBy: { ordre: "asc" },
  });
  const balanced = repartirPoidsEgaux(all.length);
  await Promise.all(
    all.map((e, i) =>
      prisma.projetEtape.update({
        where: { id: e.id },
        data: { poids: balanced[i] ?? 0 },
      }),
    ),
  );
  return syncAvancement(projetId, current.id);
}

export async function deleteProjetEtape(projetId: string, etapeId: string) {
  const { current } = await assertProjet(projetId);
  await prisma.projetEtape.deleteMany({ where: { id: etapeId, projetId } });
  const all = await prisma.projetEtape.findMany({
    where: { projetId },
    orderBy: { ordre: "asc" },
  });
  const balanced = repartirPoidsEgaux(all.length);
  await Promise.all(
    all.map((e, i) =>
      prisma.projetEtape.update({
        where: { id: e.id },
        data: { poids: balanced[i] ?? 0, ordre: i },
      }),
    ),
  );
  return syncAvancement(projetId, current.id);
}

export async function reorderProjetEtapes(projetId: string, orderedIds: string[]) {
  const { current } = await assertProjet(projetId);
  await Promise.all(
    orderedIds.map((id, ordre) =>
      prisma.projetEtape.updateMany({
        where: { id, projetId },
        data: { ordre },
      }),
    ),
  );
  revalidatePath(`/projets/${projetId}`);
  return syncAvancement(projetId, current.id);
}

/** Crée les étapes par défaut (si aucune) et recalcule. */
export async function ensureDefaultProjetEtapes(
  projetId: string,
  userId: string,
  defaults: Array<{ libelle: string; poids: number }>,
) {
  const count = await prisma.projetEtape.count({ where: { projetId } });
  if (count > 0) return;
  await prisma.projetEtape.createMany({
    data: defaults.map((d, ordre) => ({
      projetId,
      libelle: d.libelle,
      ordre,
      poids: d.poids,
      avancement: 0,
    })),
  });
  await syncAvancement(projetId, userId);
}
