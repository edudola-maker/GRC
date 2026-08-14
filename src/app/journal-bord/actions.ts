"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { optStr, str } from "@/lib/form";
import { JOURNAL_BORD_PARENTS } from "@/lib/journal-bord";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";
import type { TypeObjetMetier } from "@/generated/prisma/client";

function parentHref(typeObjet: string, objetId: string) {
  if (typeObjet === "PROJET") return `/projets/${objetId}`;
  if (typeObjet === "CONSEIL") return `/conseils/${objetId}`;
  if (typeObjet === "MISSION") return `/missions/${objetId}`;
  return "/";
}

export async function createJournalBordEntree(formData: FormData) {
  const current = await getCurrentUser();
  const typeObjet = str(formData, "typeObjet");
  const objetId = str(formData, "objetId");
  const retour = str(formData, "retour") || "/";
  const texte = str(formData, "texte");
  const tacheId = optStr(formData, "tacheId");

  if (
    !typeObjet ||
    !objetId ||
    !(JOURNAL_BORD_PARENTS as readonly string[]).includes(typeObjet)
  ) {
    redirectWithError(retour, "Objet parent invalide.");
  }
  if (!texte) redirectWithError(retour, "Le texte est obligatoire.");

  // Date/heure = moment d’enregistrement (pas de saisie manuelle).
  const date = new Date();

  await prisma.journalBordEntree.create({
    data: {
      uniteId: current.uniteId,
      typeObjet: typeObjet as TypeObjetMetier,
      objetId,
      date,
      texte,
      auteurId: current.id,
      tacheId,
    },
  });

  const href = retour.includes("#")
    ? retour
    : sectionSavedHref(parentHref(typeObjet, objetId), "JOURNAL_BORD");
  revalidateApp([parentHref(typeObjet, objetId)]);
  redirectWithOk(href.split("#")[0]!, "journal");
}

export async function deleteJournalBordEntree(formData: FormData) {
  const id = str(formData, "id");
  const retour = str(formData, "retour") || "/";
  if (!id) redirectWithError(retour, "Entrée introuvable.");

  const entry = await prisma.journalBordEntree.findUnique({ where: { id } });
  if (!entry) redirectWithError(retour, "Entrée introuvable.");

  await prisma.journalBordEntree.delete({ where: { id } });
  revalidateApp([parentHref(entry.typeObjet, entry.objetId)]);
  redirect(
    sectionSavedHref(parentHref(entry.typeObjet, entry.objetId), "JOURNAL_BORD"),
  );
}
