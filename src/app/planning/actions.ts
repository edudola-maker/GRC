"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type PlanifiableKind = "PROJET" | "MISSION" | "TACHE";

export type PlanificationSnapshot = {
  kind: PlanifiableKind;
  id: string;
  dateDebut: string | null;
  dateFin: string | null;
};

function parseDay(iso: string): Date {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error("Date invalide");
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDay(d: Date | null | undefined): string | null {
  if (!d) return null;
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

/**
 * Met à jour uniquement les dates de planification.
 * Ne touche jamais à l’échéance (deadline métier).
 */
export async function updatePlanification(input: {
  kind: PlanifiableKind;
  id: string;
  dateDebut: string;
  dateFin: string;
}): Promise<{ ok: true; previous: PlanificationSnapshot } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  let start: Date;
  let end: Date;
  try {
    start = parseDay(input.dateDebut);
    end = parseDay(input.dateFin);
  } catch {
    return { ok: false, error: "Dates invalides." };
  }
  if (end < start) end = new Date(start);

  if (input.kind === "PROJET") {
    const prev = await prisma.projet.findFirst({
      where: { id: input.id, uniteId: user.uniteId, archive: false },
      select: { id: true, dateDebut: true, dateFinPlanifiee: true },
    });
    if (!prev) return { ok: false, error: "Projet introuvable." };
    const previous: PlanificationSnapshot = {
      kind: "PROJET",
      id: prev.id,
      dateDebut: toIsoDay(prev.dateDebut),
      dateFin: toIsoDay(prev.dateFinPlanifiee),
    };
    await prisma.projet.update({
      where: { id: prev.id },
      data: {
        dateDebut: start,
        dateFinPlanifiee: end,
        modifieParId: user.id,
      },
    });
    revalidatePath("/");
    revalidatePath("/responsable");
    revalidatePath(`/projets/${prev.id}`);
    return { ok: true, previous };
  }

  if (input.kind === "MISSION") {
    const prev = await prisma.mission.findFirst({
      where: { id: input.id, uniteId: user.uniteId, archive: false },
      select: { id: true, dateDebut: true, dateFin: true },
    });
    if (!prev) return { ok: false, error: "Mission introuvable." };
    const previous: PlanificationSnapshot = {
      kind: "MISSION",
      id: prev.id,
      dateDebut: toIsoDay(prev.dateDebut),
      dateFin: toIsoDay(prev.dateFin),
    };
    await prisma.mission.update({
      where: { id: prev.id },
      data: {
        dateDebut: start,
        dateFin: end,
        modifieParId: user.id,
      },
    });
    revalidatePath("/");
    revalidatePath("/responsable");
    revalidatePath(`/missions/${prev.id}`);
    return { ok: true, previous };
  }

  const prev = await prisma.tache.findFirst({
    where: { id: input.id, uniteId: user.uniteId },
    select: { id: true, dateDebut: true, dateFinPlanifiee: true },
  });
  if (!prev) return { ok: false, error: "Tâche introuvable." };
  const previous: PlanificationSnapshot = {
    kind: "TACHE",
    id: prev.id,
    dateDebut: toIsoDay(prev.dateDebut),
    dateFin: toIsoDay(prev.dateFinPlanifiee),
  };
  await prisma.tache.update({
    where: { id: prev.id },
    data: {
      dateDebut: start,
      dateFinPlanifiee: end,
      modifieParId: user.id,
    },
  });
  revalidatePath("/");
  revalidatePath("/responsable");
  revalidatePath(`/taches/${prev.id}`);
  return { ok: true, previous };
}

/** Annule une replanification (restaure le snapshot précédent). */
export async function undoPlanification(
  snapshot: PlanificationSnapshot,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  const start = snapshot.dateDebut ? parseDay(snapshot.dateDebut) : null;
  const end = snapshot.dateFin ? parseDay(snapshot.dateFin) : null;

  if (snapshot.kind === "PROJET") {
    const row = await prisma.projet.findFirst({
      where: { id: snapshot.id, uniteId: user.uniteId },
      select: { id: true },
    });
    if (!row) return { ok: false, error: "Projet introuvable." };
    await prisma.projet.update({
      where: { id: row.id },
      data: {
        dateDebut: start,
        dateFinPlanifiee: end,
        modifieParId: user.id,
      },
    });
  } else if (snapshot.kind === "MISSION") {
    const row = await prisma.mission.findFirst({
      where: { id: snapshot.id, uniteId: user.uniteId },
      select: { id: true },
    });
    if (!row) return { ok: false, error: "Mission introuvable." };
    await prisma.mission.update({
      where: { id: row.id },
      data: {
        dateDebut: start,
        dateFin: end,
        modifieParId: user.id,
      },
    });
  } else {
    const row = await prisma.tache.findFirst({
      where: { id: snapshot.id, uniteId: user.uniteId },
      select: { id: true },
    });
    if (!row) return { ok: false, error: "Tâche introuvable." };
    await prisma.tache.update({
      where: { id: row.id },
      data: {
        dateDebut: start,
        dateFinPlanifiee: end,
        modifieParId: user.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/responsable");
  return { ok: true };
}
