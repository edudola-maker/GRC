import type { TypeObjetMetier } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Catalogue des événements fonctionnels (journal ≠ historique de champs). */
export const TYPE_EVENEMENT = {
  CREATION: "CREATION",
  STATUT: "STATUT",
  ARCHIVE: "ARCHIVE",
  DESARCHIVE: "DESARCHIVE",
  CLOTURE: "CLOTURE",
  REOUVERTURE: "REOUVERTURE",
  NOTE: "NOTE",
  LIEN: "LIEN",
  VALIDATION: "VALIDATION",
} as const;

export const TYPE_EVENEMENT_LABELS: Record<string, string> = {
  CREATION: "Création",
  STATUT: "Statut",
  ARCHIVE: "Archivage",
  DESARCHIVE: "Désarchivage",
  CLOTURE: "Clôture",
  REOUVERTURE: "Réouverture",
  NOTE: "Note",
  LIEN: "Liaison",
  VALIDATION: "Validation",
};

export async function ajouterJournal(params: {
  typeObjet: TypeObjetMetier;
  objetId: string;
  typeEvenement: string;
  message: string;
  auteurId?: string | null;
  automatique?: boolean;
  uniteId?: string | null;
}) {
  return prisma.journalEvenement.create({
    data: {
      typeObjet: params.typeObjet,
      objetId: params.objetId,
      typeEvenement: params.typeEvenement,
      message: params.message,
      auteurId: params.auteurId ?? null,
      automatique: params.automatique ?? true,
      uniteId: params.uniteId ?? null,
    },
  });
}

export async function listerJournal(
  typeObjet: TypeObjetMetier,
  objetId: string,
) {
  return prisma.journalEvenement.findMany({
    where: { typeObjet, objetId },
    include: { auteur: true },
    orderBy: { creeLe: "desc" },
  });
}
