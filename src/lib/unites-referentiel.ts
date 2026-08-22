import { prisma } from "@/lib/prisma";

/** Référentiel Unités actives (sélection « Unité responsable »). */
export async function listUnitesActives() {
  return prisma.unite.findMany({
    where: { actif: true },
    select: { id: true, code: true, nom: true },
    orderBy: { nom: "asc" },
  });
}

export async function syncApplicables(
  kind: "processus" | "macroprocessus",
  objetId: string,
  ownerUniteId: string,
  rawIds: string[],
) {
  const ids = Array.from(new Set(rawIds.filter((id) => id && id !== ownerUniteId)));

  if (kind === "processus") {
    await prisma.processusUniteApplicable.deleteMany({
      where: { processusId: objetId },
    });
    if (ids.length > 0) {
      await prisma.processusUniteApplicable.createMany({
        data: ids.map((uniteId) => ({ processusId: objetId, uniteId })),
      });
    }
    return;
  }

  await prisma.macroprocessusUniteApplicable.deleteMany({
    where: { macroprocessusId: objetId },
  });
  if (ids.length > 0) {
    await prisma.macroprocessusUniteApplicable.createMany({
      data: ids.map((uniteId) => ({
        macroprocessusId: objetId,
        uniteId,
      })),
    });
  }
}
