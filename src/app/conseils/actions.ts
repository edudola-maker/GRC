"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import { STATUT_CONSEIL_OPTIONS } from "@/lib/catalog";
import {
  allocateCreateCode,
  assertCodeUnique,
  assertNomUnique,
  nextCode,
  normalizeCode,
} from "@/lib/codes";
import { addBusinessDays } from "@/lib/dates";
import { optDate, optStr, str } from "@/lib/form";
import {
  diffChamps,
  enregistrerModifications,
} from "@/lib/historique";
import { ajouterJournal } from "@/lib/journal";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { getConseilDelaiCibleJours } from "@/lib/referentiels";
import { sectionEditHref, sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const STATUTS = new Set<string>(STATUT_CONSEIL_OPTIONS.map((o) => o.value));

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

async function nextHistVersion(objetId: string) {
  const last = await prisma.historiqueModification.aggregate({
    where: { typeObjet: "CONSEIL", objetId },
    _max: { versionObjet: true },
  });
  return (last._max.versionObjet ?? 0) + 1;
}

export async function createConseil(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/conseils/nouveau";
  const uniteId = optStr(formData, "uniteId") || current.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(fallback, "Unité responsable invalide.");

  const objet = str(formData, "objet");
  if (!objet) {
    redirectWithError(fallback, "L'objet du conseil est obligatoire.");
  }

  const statut = str(formData, "statut") || "RECU";
  if (!STATUTS.has(statut)) {
    redirectWithError(fallback, "Statut invalide.");
  }

  const nomErr = await assertNomUnique("CONSEIL", objet, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const dateReception = optDate(formData, "dateReception") ?? new Date();
  const delaiCible = await getConseilDelaiCibleJours(uniteId);
  const dateEcheance =
    optDate(formData, "dateEcheance") ??
    addBusinessDays(dateReception, delaiCible);

  const allocated = await allocateCreateCode(
    "CONSEIL",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError(fallback, allocated.error);
  }

  const conseil = await prisma.conseil.create({
    data: {
      code: allocated.code,
      uniteId,
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
      raisonnement: optStr(formData, "raisonnement"),
      reponseConclusion: optStr(formData, "reponseConclusion"),
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
    uniteId,
  });

  if (str(formData, "creerTache") === "1") {
    await prisma.tache.create({
      data: {
        uniteId,
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

  const sectionKey = optStr(formData, "sectionKey") ?? "INFOS_GENERALES";
  const base = `/conseils/${id}`;
  const editFallback = sectionEditHref(base, sectionKey);

  const objet = str(formData, "objet");
  if (!objet) {
    redirectWithError(editFallback, "L'objet du conseil est obligatoire.");
  }

  const statut = str(formData, "statut") || "RECU";
  if (!STATUTS.has(statut)) {
    redirectWithError(editFallback, "Statut invalide.");
  }

  const uniteId = optStr(formData, "uniteId") || existing.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(editFallback, "Unité responsable invalide.");

  const nomErr = await assertNomUnique("CONSEIL", objet, uniteId, id);
  if (nomErr) redirectWithError(editFallback, nomErr);

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique("CONSEIL", code, uniteId, id);
  if (codeErr) redirectWithError(editFallback, codeErr);

  const responsableId = str(formData, "responsableId") || current.id;
  if (!(await assertResponsable(responsableId))) {
    redirectWithError(editFallback, "Responsable introuvable.");
  }

  const dateReception =
    optDate(formData, "dateReception") ?? existing.dateReception;
  const delaiCible = await getConseilDelaiCibleJours(uniteId);
  const dateEcheance =
    optDate(formData, "dateEcheance") ??
    existing.dateEcheance ??
    addBusinessDays(dateReception, delaiCible);

  let dateCloture = optDate(formData, "dateCloture");
  let dateReponse = optDate(formData, "dateReponse");
  if (
    (statut === "CLOTURE" || statut === "REPONDU") &&
    !dateCloture &&
    !dateReponse
  ) {
    dateCloture = new Date();
  }

  const description = optStr(formData, "description");
  const changes = diffChamps([
    { champ: "code", avant: existing.code, apres: code },
    { champ: "objet", avant: existing.objet, apres: objet },
    { champ: "description", avant: existing.description, apres: description },
    { champ: "uniteId", avant: existing.uniteId, apres: uniteId },
    { champ: "statut", avant: existing.statut, apres: statut },
    {
      champ: "responsableId",
      avant: existing.responsableId,
      apres: responsableId,
    },
  ]);

  await prisma.conseil.update({
    where: { id },
    data: {
      code,
      objet,
      description,
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
      raisonnement: optStr(formData, "raisonnement"),
      reponseConclusion: optStr(formData, "reponseConclusion"),
      uniteId,
      modifieParId: current.id,
    },
  });

  if (changes.length > 0) {
    await enregistrerModifications({
      typeObjet: "CONSEIL",
      objetId: id,
      uniteId,
      modifieParId: current.id,
      changes,
      versionObjet: await nextHistVersion(id),
    });
  }

  if (statut !== existing.statut) {
    await ajouterJournal({
      typeObjet: "CONSEIL",
      objetId: id,
      typeEvenement: "STATUT",
      message: `Statut : ${existing.statut} → ${statut}`,
      auteurId: current.id,
      automatique: true,
      uniteId,
    });
  }

  revalidateApp([`/conseils/${id}`, `/conseils/${id}?edit=INFOS_GENERALES`]);
  redirectWithOk(sectionSavedHref(base, sectionKey), "modifie");
}

export async function addNoteJournal(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
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
    uniteId,
  });

  revalidateApp([`/conseils/${conseilId}`]);
  redirectWithOk(`/conseils/${conseilId}`, "note");
}

export async function reopenConseil(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
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
    uniteId,
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
  const uniteId = current.uniteId;
  const conseilId = str(formData, "conseilId") || str(formData, "id");
  if (!conseilId) {
    redirectWithError("/conseils", "Identifiant conseil manquant.");
  }
  const conseil = await prisma.conseil.findUnique({ where: { id: conseilId } });
  if (!conseil) redirectWithError("/conseils", "Conseil introuvable.");

  const tache = await prisma.tache.create({
    data: {
      uniteId,
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

/** Crée un nouveau conseil lié à un précédent (suite / récurrence légère). */
export async function duplicateConseil(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const id = str(formData, "id");
  if (!id) redirectWithError("/conseils", "Identifiant manquant.");

  const source = await prisma.conseil.findUnique({ where: { id } });
  if (!source) redirectWithError("/conseils", "Conseil introuvable.");

  const delaiCible = await getConseilDelaiCibleJours(uniteId);
  const dateReception = new Date();
  const created = await prisma.conseil.create({
    data: {
      code: await nextCode("CONSEIL", uniteId),
      uniteId,
      objet: source.objet,
      description: source.description,
      taxinomie: source.taxinomie,
      tags: source.tags,
      demandeur: source.demandeur,
      entiteDemandeuse: source.entiteDemandeuse,
      dateReception,
      responsableId: source.responsableId,
      dateEcheance: addBusinessDays(dateReception, delaiCible),
      statut: "RECU",
      conseilPrecedentId: source.id,
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  await ajouterJournal({
    typeObjet: "CONSEIL",
    objetId: created.id,
    typeEvenement: "CREATION",
    message: `Suite du conseil ${source.code}`,
    auteurId: current.id,
    automatique: true,
    uniteId,
  });

  revalidateApp([`/conseils/${created.id}`, `/conseils/${source.id}`]);
  redirectWithOk(`/conseils/${created.id}`, "cree");
}
