"use server";

import { revalidatePath } from "next/cache";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { str, optStr } from "@/lib/form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { TypeObjetMetier } from "@/generated/prisma/client";

const TYPES = new Set<string>([
  "PROCESSUS",
  "PROCESSUS_ETAPE",
  "PROJET",
  "CONSEIL",
  "MISSION",
  "RISQUE",
  "CONTROLE_SCI",
  "DOCUMENT",
  "TACHE",
  "OBJECTIF",
  "MODELE_TACHE",
  "UNITE",
]);

/** Ordre canonique pour éviter les doublons A↔B. */
function canonicalize(
  typeA: string,
  idA: string,
  typeB: string,
  idB: string,
): { typeA: TypeObjetMetier; idA: string; typeB: TypeObjetMetier; idB: string } {
  const left = `${typeA}:${idA}`;
  const right = `${typeB}:${idB}`;
  if (left <= right) {
    return {
      typeA: typeA as TypeObjetMetier,
      idA,
      typeB: typeB as TypeObjetMetier,
      idB,
    };
  }
  return {
    typeA: typeB as TypeObjetMetier,
    idA: idB,
    typeB: typeA as TypeObjetMetier,
    idB: idA,
  };
}

export async function createLienObjet(formData: FormData) {
  const user = await getCurrentUser();
  const retour = str(formData, "retour") || "/";
  const typeSource = str(formData, "typeSource");
  const idSource = str(formData, "idSource");
  const typeCible = str(formData, "typeCible");
  const idCible = str(formData, "idCible");
  const libelle = optStr(formData, "libelle");

  if (!TYPES.has(typeSource) || !TYPES.has(typeCible)) {
    redirectWithError(retour, "Type d'objet invalide.");
  }
  if (!idSource || !idCible) {
    redirectWithError(retour, "Objets source et cible obligatoires.");
  }
  if (typeSource === typeCible && idSource === idCible) {
    redirectWithError(retour, "Impossible de lier un objet à lui-même.");
  }

  const pair = canonicalize(typeSource, idSource, typeCible, idCible);

  try {
    await prisma.lienObjet.create({
      data: {
        uniteId: user.uniteId,
        ...pair,
        libelle,
        creeParId: user.id,
      },
    });
  } catch {
    redirectWithError(retour, "Ce lien existe déjà.");
  }

  revalidatePath(retour);
  redirectWithOk(retour, "lien_ajoute");
}

export async function deleteLienObjet(formData: FormData) {
  const user = await getCurrentUser();
  const retour = str(formData, "retour") || "/";
  const id = str(formData, "id");
  if (!id) redirectWithError(retour, "Lien introuvable.");

  const lien = await prisma.lienObjet.findFirst({
    where: { id, uniteId: user.uniteId },
  });
  if (!lien) redirectWithError(retour, "Lien introuvable.");

  await prisma.lienObjet.delete({ where: { id } });
  revalidatePath(retour);
  redirectWithOk(retour, "lien_supprime");
}
