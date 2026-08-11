import type { TypeNoteTravail, TypeObjetMetier } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const NOTE_PARENTS = ["PROJET", "CONSEIL", "MISSION"] as const;
export type NoteParentType = (typeof NOTE_PARENTS)[number];

export function isNoteParent(t: string): t is NoteParentType {
  return (NOTE_PARENTS as readonly string[]).includes(t);
}

export async function listerNotes(
  typeObjet: TypeObjetMetier,
  objetId: string,
  opts?: { etapeMission?: string | null },
) {
  return prisma.noteTravail.findMany({
    where: {
      typeObjet,
      objetId,
      ...(opts?.etapeMission
        ? { etapeMission: opts.etapeMission }
        : {}),
    },
    include: {
      auteur: { select: { id: true, nom: true, prenom: true } },
      questions: { orderBy: { ordre: "asc" } },
      participants: {
        include: {
          utilisateur: { select: { id: true, nom: true, prenom: true } },
        },
      },
      taches: {
        select: { id: true, titre: true, statut: true, dateEcheance: true },
        orderBy: { creeLe: "desc" },
      },
    },
    orderBy: [{ date: "desc" }, { creeLe: "desc" }],
  });
}

export type NoteListeItem = Awaited<ReturnType<typeof listerNotes>>[number];

export const TYPE_NOTE_LABELS: Record<TypeNoteTravail, string> = {
  TRAVAIL: "Note",
  SEANCE: "Séance",
};
