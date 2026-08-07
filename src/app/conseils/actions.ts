"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  CONSEIL_DELAI_CIBLE_JOURS,
  STATUT_CONSEIL_OPTIONS,
} from "@/lib/catalog";
import { assertNomUnique, nextCode } from "@/lib/codes";
import { addBusinessDays } from "@/lib/dates";
import { optDate, optStr, str } from "@/lib/form";
import { ajouterJournal } from "@/lib/journal";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const STATUTS = new Set<string>(STATUT_CONSEIL_OPTIONS.map((o) => o.value));

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

export async function createConseil(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/conseils/nouveau";
  const objet = str(formData, "objet");
  if (!objet) {
    redirectWithError(fallback, "L'objet du conseil est obligatoire.");
  }

  const statut = str(formData, "statut") || "RECU";
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const nomErr = await assertNomUnique("CONSEIL", objet);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const dateReception = optDate(formData, "dateReception") ?? new Date();
  const dateEcheance =
    optDate(formData, "dateEcheance") ??
    addBusinessDays(dateReception, CONSEIL_DELAI_CIBLE_JOURS);

  const conseil = await prisma.conseil.create({
    data: {
      code: await nextCode("CONSEIL"),
      objet,
      description: optStr(formData, "description"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      demandeur: optStr(formData, "demandeur"),
      entiteDemandeuse: optStr(formData, "entiteDemandeuse"),
      dateReception,
      responsableId,
      dateEcheance,
      statut: statut as "RECU",
      dateReponse: optDate(formData, "dateReponse"),
      dateCloture: optDate(formData, "dateCloture"),
      commentaires: optStr(formData, "commentaires"),
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  await ajouterJournal({
    typeObjet: "CONSEIL",
    objetId: conseil.id,
    typeEvenement: "CREATION",
    message: `Conseil créé — ${objet}`,
    auteurId: current.id,
    automatique: true,
  });

  if (str(formData, "creerTache") === "1") {
    await prisma.tache.create({
      data: {
        titre: `Conseil : ${objet}`,
        description: optStr(formData, "description"),
        responsableId,
        conseilId: conseil.id,
        dateEcheance,
        statut: "A_FAIRE",
        priorite: "MOYENNE",
        categorie: "CONSEIL",
        creeParId: current.id,
        modifieParId: current.id,
      },
    });
  }

  revalidateApp([`/conseils/${conseil.id}`]);
  redirectWithOk(`/conseils/${conseil.id}`, "cree");
}

export async function updateConseil(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/conseils", "Identifiant conseil manquant.");

  const existing = await prisma.conseil.findUnique({ where: { id } });
  if (!existing) redirectWithError("/conseils", "Conseil introuvable.");

  const objet = str(formData, "objet");
  if (!objet) {
    redirectWithError(
      `/conseils/${id}/modifier`,
      "L'objet du conseil est obligatoire.",
    );
  }

  const statut = str(formData, "statut") || "RECU";
  if (!STATUTS.has(statut)) {
    redirectWithError(`/conseils/${id}/modifier`, "Statut invalide.");
  }

  const nomErr = await assertNomUnique("CONSEIL", objet, id);
  if (nomErr) redirectWithError(`/conseils/${id}/modifier`, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(`/conseils/${id}/modifier`, "Responsable introuvable.");
  }

  const dateReception =
    optDate(formData, "dateReception") ?? existing.dateReception;
  const dateEcheance =
    optDate(formData, "dateEcheance") ??
    existing.dateEcheance ??
    addBusinessDays(dateReception, CONSEIL_DELAI_CIBLE_JOURS);

  let dateCloture = optDate(formData, "dateCloture");
  let dateReponse = optDate(formData, "dateReponse");
  if (
    (statut === "CLOTURE" || statut === "REPONDU") &&
    !dateCloture &&
    !dateReponse
  ) {
    dateCloture = new Date();
  }

  await prisma.conseil.update({
    where: { id },
    data: {
      objet,
      description: optStr(formData, "description"),
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      demandeur: optStr(formData, "demandeur"),
      entiteDemandeuse: optStr(formData, "entiteDemandeuse"),
      dateReception,
      responsableId,
      dateEcheance,
      statut: statut as "RECU",
      dateReponse,
      dateCloture,
      commentaires: optStr(formData, "commentaires"),
      modifieParId: current.id,
    },
  });

  if (statut !== existing.statut) {
    await ajouterJournal({
      typeObjet: "CONSEIL",
      objetId: id,
      typeEvenement: "STATUT",
      message: `Statut : ${existing.statut} → ${statut}`,
      auteurId: current.id,
      automatique: true,
    });
  }

  revalidateApp([`/conseils/${id}`, `/conseils/${id}/modifier`]);
  redirectWithOk(`/conseils/${id}`, "modifie");
}

export async function addNoteJournal(formData: FormData) {
  const current = await getCurrentUser();
  const conseilId = str(formData, "conseilId");
  const message = str(formData, "message");
  if (!conseilId) redirectWithError("/conseils", "Conseil manquant.");
  if (!message) {
    redirectWithError(`/conseils/${conseilId}`, "La note ne peut pas être vide.");
  }

  await ajouterJournal({
    typeObjet: "CONSEIL",
    objetId: conseilId,
    typeEvenement: "NOTE",
    message,
    auteurId: current.id,
    automatique: false,
  });

  revalidateApp([`/conseils/${conseilId}`]);
  redirectWithOk(`/conseils/${conseilId}`, "note");
}

export async function reopenConseil(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/conseils", "Identifiant manquant.");

  await prisma.conseil.update({
    where: { id },
    data: {
      statut: "EN_COURS",
      dateCloture: null,
      modifieParId: current.id,
    },
  });

  await ajouterJournal({
    typeObjet: "CONSEIL",
    objetId: id,
    typeEvenement: "REOUVERTURE",
    message: "Conseil rouvert",
    auteurId: current.id,
    automatique: true,
  });

  revalidateApp([`/conseils/${id}`]);
  redirectWithOk(`/conseils/${id}`, "reouvert");
}

export async function archiveConseil(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/conseils", "Identifiant conseil manquant.");
  await prisma.conseil.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });
  revalidateApp([`/conseils/${id}`]);
  redirectWithOk(`/conseils/${id}`, "archive");
}

export async function unarchiveConseil(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/conseils", "Identifiant conseil manquant.");
  await prisma.conseil.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });
  revalidateApp([`/conseils/${id}`]);
  redirectWithOk(`/conseils/${id}`, "desarchive");
}

export async function deleteConseil(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/conseils", "Identifiant conseil manquant.");
  await prisma.conseil.delete({ where: { id } });
  revalidateApp();
  redirect("/conseils?ok=supprime");
}

export async function createTacheDepuisConseil(formData: FormData) {
  const current = await getCurrentUser();
  const conseilId = str(formData, "conseilId") || str(formData, "id");
  if (!conseilId) {
    redirectWithError("/conseils", "Identifiant conseil manquant.");
  }
  const conseil = await prisma.conseil.findUnique({ where: { id: conseilId } });
  if (!conseil) redirectWithError("/conseils", "Conseil introuvable.");

  const tache = await prisma.tache.create({
    data: {
      titre: `Conseil : ${conseil.objet}`,
      description: conseil.description,
      responsableId: conseil.responsableId,
      conseilId: conseil.id,
      dateEcheance: conseil.dateEcheance,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "CONSEIL",
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/conseils/${conseil.id}`, `/taches/${tache.id}`]);
  redirectWithOk(`/taches/${tache.id}`, "tache");
}
