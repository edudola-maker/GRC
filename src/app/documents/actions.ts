"use server";

import { redirect } from "next/navigation";
import { redirectWithError, redirectWithOk } from "@/lib/action-helpers";
import {
  FREQUENCE_REVUE_OPTIONS,
  NIVEAU_CONFIDENTIALITE_OPTIONS,
  STATUT_DOCUMENT_OPTIONS,
  TYPE_DOCUMENT_OPTIONS,
} from "@/lib/catalog";
import {
  allocateCreateCode,
  assertCodeUnique,
  assertNomUnique,
  normalizeCode,
} from "@/lib/codes";
import { nextRevueDate } from "@/lib/dates";
import { optDate, optInt, optStr, str } from "@/lib/form";
import {
  diffChamps,
  enregistrerModifications,
} from "@/lib/historique";
import { addDays, startOfToday } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { revalidateApp } from "@/lib/revalidate";
import { sectionEditHref, sectionSavedHref } from "@/lib/section-nav";
import { getCurrentUser } from "@/lib/session";
import { serializeTags } from "@/lib/tags";

const TYPES = new Set<string>(TYPE_DOCUMENT_OPTIONS.map((o) => o.value));
const STATUTS = new Set<string>(STATUT_DOCUMENT_OPTIONS.map((o) => o.value));
const FREQUENCES = new Set<string>(
  FREQUENCE_REVUE_OPTIONS.map((o) => o.value),
);
const NIVEAUX_CONF = new Set<string>(
  NIVEAU_CONFIDENTIALITE_OPTIONS.map((o) => o.value),
);

function parseLpd(formData: FormData) {
  const niveau = optStr(formData, "niveauConfidentialite") ?? "INTERNE";
  return {
    contientDonneesPersonnelles:
      str(formData, "contientDonneesPersonnelles") === "1",
    niveauConfidentialite: (NIVEAUX_CONF.has(niveau)
      ? niveau
      : "INTERNE") as "INTERNE",
  };
}

async function assertResponsable(id: string) {
  return prisma.utilisateur.findFirst({ where: { id, actif: true } });
}

async function nextHistVersion(objetId: string) {
  const last = await prisma.historiqueModification.aggregate({
    where: { typeObjet: "DOCUMENT", objetId },
    _max: { versionObjet: true },
  });
  return (last._max.versionObjet ?? 0) + 1;
}

function resolveProchaineRevue(
  formData: FormData,
  dateDerniereRevue: Date | null,
  frequenceRevue: string | null,
): Date | null {
  if (str(formData, "prochaineRevue")) {
    return optDate(formData, "prochaineRevue");
  }
  if (dateDerniereRevue && frequenceRevue) {
    return nextRevueDate(dateDerniereRevue, frequenceRevue);
  }
  return null;
}

export async function createDocument(formData: FormData) {
  const current = await getCurrentUser();
  const fallback = "/documents/nouveau";
  const uniteId = optStr(formData, "uniteId") || current.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(fallback, "Unité responsable invalide.");

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(fallback, "Le nom du document est obligatoire.");
  }

  const typeDocument = str(formData, "typeDocument") || "AUTRE";
  const statut = str(formData, "statut") || "BROUILLON";
  if (!TYPES.has(typeDocument) || !STATUTS.has(statut)) {
    redirectWithError(fallback, "Type ou statut invalide.");
  }

  const frequenceRevue = optStr(formData, "frequenceRevue");
  if (frequenceRevue && !FREQUENCES.has(frequenceRevue)) {
    redirectWithError(fallback, "Fréquence de revue invalide.");
  }

  const responsableId = optStr(formData, "responsableId");
  if (responsableId && !(await assertResponsable(responsableId))) {
    redirectWithError(fallback, "Responsable introuvable.");
  }

  const dateDerniereRevue = optDate(formData, "dateDerniereRevue");
  const prochaineRevue = resolveProchaineRevue(
    formData,
    dateDerniereRevue,
    frequenceRevue,
  );

  const nomErr = await assertNomUnique("DOCUMENT", nom, uniteId);
  if (nomErr) redirectWithError(fallback, nomErr);

  const lpd = parseLpd(formData);
  const allocated = await allocateCreateCode(
    "DOCUMENT",
    uniteId,
    optStr(formData, "code"),
  );
  if (!allocated.ok) {
    redirectWithError(fallback, allocated.error);
  }

  const document = await prisma.document.create({
    data: {
      code: allocated.code,
      uniteId,
      nom,
      typeDocument: typeDocument as "AUTRE",
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      version: optStr(formData, "version"),
      responsableId,
      dateApprobation: optDate(formData, "dateApprobation"),
      dateDerniereRevue,
      frequenceRevue: frequenceRevue as "ANNUELLE" | null,
      prochaineRevue,
      fenetreDeclenchementJours: optInt(formData, "fenetreDeclenchementJours") ?? 30,
      statut: statut as "BROUILLON",
      description: optStr(formData, "description"),
      reference: optStr(formData, "reference"),
      nomFichier: optStr(formData, "nomFichier"),
      contientDonneesPersonnelles: lpd.contientDonneesPersonnelles,
      niveauConfidentialite: lpd.niveauConfidentialite,
      archive: false,
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/documents/${document.id}`]);
  redirectWithOk(`/documents/${document.id}`, "cree");
}

export async function updateDocument(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/documents", "Identifiant document manquant.");

  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) redirectWithError("/documents", "Document introuvable.");

  const sectionKey = optStr(formData, "sectionKey") ?? "INFOS_GENERALES";
  const base = `/documents/${id}`;
  const editFallback = sectionEditHref(base, sectionKey);

  const nom = str(formData, "nom");
  if (!nom) {
    redirectWithError(editFallback, "Le nom du document est obligatoire.");
  }

  const typeDocument = str(formData, "typeDocument") || "AUTRE";
  const statut = str(formData, "statut") || "BROUILLON";
  if (!TYPES.has(typeDocument) || !STATUTS.has(statut)) {
    redirectWithError(editFallback, "Type ou statut invalide.");
  }

  const frequenceRevue = optStr(formData, "frequenceRevue");
  if (frequenceRevue && !FREQUENCES.has(frequenceRevue)) {
    redirectWithError(editFallback, "Fréquence de revue invalide.");
  }

  const uniteId = optStr(formData, "uniteId") || existing.uniteId;
  const unite = await prisma.unite.findFirst({
    where: { id: uniteId, actif: true },
  });
  if (!unite) redirectWithError(editFallback, "Unité responsable invalide.");

  const nomErr = await assertNomUnique("DOCUMENT", nom, uniteId, id);
  if (nomErr) redirectWithError(editFallback, nomErr);

  const codeRaw = optStr(formData, "code") ?? existing.code;
  const code = normalizeCode(codeRaw);
  const codeErr = await assertCodeUnique("DOCUMENT", code, uniteId, id);
  if (codeErr) redirectWithError(editFallback, codeErr);

  const responsableId = optStr(formData, "responsableId");
  if (responsableId && !(await assertResponsable(responsableId))) {
    redirectWithError(editFallback, "Responsable introuvable.");
  }

  const dateDerniereRevue = optDate(formData, "dateDerniereRevue");
  const prochaineRevue = resolveProchaineRevue(
    formData,
    dateDerniereRevue,
    frequenceRevue,
  );

  const lpd = parseLpd(formData);
  const description = optStr(formData, "description");
  const reference = optStr(formData, "reference");
  const version = optStr(formData, "version");

  const changes = diffChamps([
    { champ: "code", avant: existing.code, apres: code },
    { champ: "nom", avant: existing.nom, apres: nom },
    { champ: "description", avant: existing.description, apres: description },
    { champ: "uniteId", avant: existing.uniteId, apres: uniteId },
    { champ: "typeDocument", avant: existing.typeDocument, apres: typeDocument },
    { champ: "statut", avant: existing.statut, apres: statut },
    {
      champ: "responsableId",
      avant: existing.responsableId,
      apres: responsableId,
    },
  ]);

  await prisma.document.update({
    where: { id },
    data: {
      code,
      nom,
      typeDocument: typeDocument as "AUTRE",
      taxinomie: optStr(formData, "taxinomie"),
      tags: serializeTags(optStr(formData, "tags")),
      version,
      responsableId,
      dateApprobation: optDate(formData, "dateApprobation"),
      dateDerniereRevue,
      frequenceRevue: frequenceRevue as "ANNUELLE" | null,
      prochaineRevue,
      fenetreDeclenchementJours:
        optInt(formData, "fenetreDeclenchementJours") ??
        existing.fenetreDeclenchementJours,
      statut: statut as "BROUILLON",
      description,
      reference,
      contientDonneesPersonnelles: lpd.contientDonneesPersonnelles,
      niveauConfidentialite: lpd.niveauConfidentialite,
      uniteId,
      modifieParId: current.id,
    },
  });

  if (changes.length > 0) {
    await enregistrerModifications({
      typeObjet: "DOCUMENT",
      objetId: id,
      uniteId,
      modifieParId: current.id,
      changes,
      versionObjet: await nextHistVersion(id),
    });
  }

  revalidateApp([`/documents/${id}`, `/documents/${id}?edit=INFOS_GENERALES`]);
  redirectWithOk(sectionSavedHref(base, sectionKey), "modifie");
}

export async function archiveDocument(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/documents", "Identifiant document manquant.");

  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) redirectWithError("/documents", "Document introuvable.");

  await prisma.document.update({
    where: { id },
    data: { archive: true, modifieParId: current.id },
  });

  revalidateApp([`/documents/${id}`]);
  redirectWithOk(`/documents/${id}`, "archive");
}

export async function unarchiveDocument(formData: FormData) {
  const current = await getCurrentUser();
  const id = str(formData, "id");
  if (!id) redirectWithError("/documents", "Identifiant document manquant.");

  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) redirectWithError("/documents", "Document introuvable.");

  await prisma.document.update({
    where: { id },
    data: { archive: false, modifieParId: current.id },
  });

  revalidateApp([`/documents/${id}`]);
  redirectWithOk(`/documents/${id}`, "desarchive");
}

export async function deleteDocument(formData: FormData) {
  const id = str(formData, "id");
  if (!id) redirectWithError("/documents", "Identifiant document manquant.");

  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) redirectWithError("/documents", "Document introuvable.");

  await prisma.document.delete({ where: { id } });
  revalidateApp();
  redirect("/documents?ok=supprime");
}

export async function creerTacheRevue(formData: FormData) {
  const current = await getCurrentUser();
  const uniteId = current.uniteId;
  const documentId = str(formData, "documentId") || str(formData, "id");
  if (!documentId) {
    redirectWithError("/documents", "Identifiant document manquant.");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });
  if (!document) redirectWithError("/documents", "Document introuvable.");

  const echeance =
    document.prochaineRevue ?? addDays(startOfToday(), 30);

  const tache = await prisma.tache.create({
    data: {
      uniteId,
      titre: `Revue : ${document.nom}`,
      description: document.description,
      responsableId: document.responsableId ?? current.id,
      documentId: document.id,
      dateEcheance: echeance,
      statut: "A_FAIRE",
      priorite: "MOYENNE",
      categorie: "DOCUMENT",
      creeParId: current.id,
      modifieParId: current.id,
    },
  });

  revalidateApp([`/documents/${document.id}`, `/taches/${tache.id}`]);
  redirectWithOk(`/taches/${tache.id}`, "tache");
}

export async function linkDocumentProcessus(formData: FormData) {
  const current = await getCurrentUser();
  const documentId = str(formData, "documentId");
  const processusId = str(formData, "processusId");
  if (!documentId || !processusId) {
    redirectWithError("/documents", "Identifiant manquant.");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });
  if (!document) redirectWithError("/documents", "Document introuvable.");

  const processus = await prisma.processus.findFirst({
    where: { id: processusId, uniteId: document.uniteId, archive: false },
  });
  const editHref = sectionEditHref(`/documents/${documentId}`, "PROCESSUS");
  if (!processus) {
    redirectWithError(editHref, "Processus introuvable ou archivé.");
  }

  await prisma.documentProcessus.upsert({
    where: {
      documentId_processusId: { documentId, processusId },
    },
    create: {
      documentId,
      processusId,
      lieParId: current.id,
    },
    update: {},
  });

  revalidateApp([
    `/documents/${documentId}`,
    `/processus/${processusId}`,
  ]);
  redirectWithOk(editHref, "lien_ajoute");
}

export async function unlinkDocumentProcessus(formData: FormData) {
  const documentId = str(formData, "documentId");
  const id = str(formData, "id");
  if (!documentId || !id) {
    redirectWithError("/documents", "Identifiant manquant.");
  }

  const link = await prisma.documentProcessus.findFirst({
    where: { id, documentId },
  });
  if (!link) {
    redirectWithError(`/documents/${documentId}`, "Lien introuvable.");
  }

  await prisma.documentProcessus.delete({ where: { id } });
  revalidateApp([
    `/documents/${documentId}`,
    `/processus/${link.processusId}`,
  ]);
  redirectWithOk(
    sectionEditHref(`/documents/${documentId}`, "PROCESSUS"),
    "lien_supprime",
  );
}
